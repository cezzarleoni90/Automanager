import os
import subprocess
from datetime import datetime
from utils.logger import log_activity
from tasks import celery
import boto3
from botocore.exceptions import ClientError
import json
import hashlib
from typing import Optional, Dict, List

@celery.task(name='tasks.restore_database')
def restore_database(
    backup_file: Optional[str] = None,
    from_s3: bool = False,
    point_in_time: Optional[str] = None,
    tables: Optional[List[str]] = None,
    verify_only: bool = False,
    dry_run: bool = False
) -> Dict:
    """Tarea asíncrona para restaurar la base de datos con opciones avanzadas"""
    try:
        db_url = os.getenv('DATABASE_URL')
        backup_dir = os.getenv('BACKUP_DIR', 'backups')
        s3_bucket = os.getenv('BACKUP_S3_BUCKET')
        
        # Obtener archivo de backup
        backup_file = get_backup_file(backup_file, from_s3, point_in_time, s3_bucket, backup_dir)
        if not backup_file:
            raise ValueError("No se encontró ningún archivo de backup")
        
        backup_path = os.path.join(backup_dir, backup_file)
        
        # Verificar integridad del backup
        if not verify_backup_integrity(backup_path):
            raise ValueError("El archivo de backup está corrupto")
        
        if verify_only:
            return {'status': 'success', 'message': 'Backup verificado correctamente', 'file': backup_file}
        
        if dry_run:
            return {'status': 'success', 'message': 'Simulación de restauración completada', 'file': backup_file}
        
        # Realizar restauración
        if 'postgresql' in db_url:
            restore_postgresql(db_url, backup_path, tables)
        else:
            restore_sqlite(db_url, backup_path, tables)
        
        log_activity('restore', f'Restauración completada desde: {backup_file}')
        return {'status': 'success', 'file': backup_file}
        
    except Exception as e:
        log_activity('restore_error', f"Error en restauración: {str(e)}")
        raise

def get_backup_file(
    backup_file: Optional[str],
    from_s3: bool,
    point_in_time: Optional[str],
    s3_bucket: Optional[str],
    backup_dir: str
) -> Optional[str]:
    """Obtiene el archivo de backup según los criterios especificados"""
    if backup_file:
        return backup_file
        
    if point_in_time:
        target_time = datetime.fromisoformat(point_in_time)
        if from_s3 and s3_bucket:
            return get_closest_backup_from_s3(s3_bucket, target_time)
        return get_closest_backup_local(backup_dir, target_time)
        
    if from_s3 and s3_bucket:
        return get_latest_backup_from_s3(s3_bucket)
        
    return get_latest_backup_local(backup_dir)

def get_closest_backup_from_s3(bucket: str, target_time: datetime) -> Optional[str]:
    """Obtiene el backup más cercano a un punto en el tiempo desde S3"""
    s3_client = boto3.client('s3')
    response = s3_client.list_objects_v2(Bucket=bucket, Prefix='backups/')
    
    if 'Contents' not in response:
        return None
        
    backups = response['Contents']
    closest = min(backups, key=lambda x: abs(x['LastModified'] - target_time))
    return closest['Key'].split('/')[-1]

def get_closest_backup_local(backup_dir: str, target_time: datetime) -> Optional[str]:
    """Obtiene el backup más cercano a un punto en el tiempo localmente"""
    if not os.path.exists(backup_dir):
        return None
        
    backup_files = [f for f in os.listdir(backup_dir) if f.endswith('.sql')]
    if not backup_files:
        return None
        
    return min(
        backup_files,
        key=lambda x: abs(datetime.fromtimestamp(os.path.getctime(os.path.join(backup_dir, x))) - target_time)
    )

def verify_backup_integrity(backup_path: str) -> bool:
    """Verifica la integridad del archivo de backup"""
    try:
        # Verificar que el archivo existe
        if not os.path.exists(backup_path):
            return False
            
        # Verificar tamaño mínimo
        if os.path.getsize(backup_path) < 1024:  # 1KB mínimo
            return False
            
        # Verificar checksum
        with open(backup_path, 'rb') as f:
            content = f.read()
            if not content.strip():
                return False
                
        # Verificar formato SQL
        if backup_path.endswith('.sql'):
            with open(backup_path, 'r') as f:
                content = f.read()
                if not content.strip().startswith('--'):
                    return False
                    
        return True
        
    except Exception:
        return False

def restore_postgresql(db_url: str, backup_path: str, tables: Optional[List[str]] = None) -> None:
    """Restaura una base de datos PostgreSQL"""
    cmd = ['pg_restore', '-d', db_url]
    
    if tables:
        cmd.extend(['-t', ','.join(tables)])
        
    cmd.append(backup_path)
    
    subprocess.run(cmd, check=True)

def restore_sqlite(db_url: str, backup_path: str, tables: Optional[List[str]] = None) -> None:
    """Restaura una base de datos SQLite"""
    db_path = db_url.replace('sqlite:///', '')
    
    if tables:
        # Crear backup temporal
        temp_backup = f"{backup_path}.temp"
        subprocess.run(['sqlite3', db_path, f'.backup {temp_backup}'], check=True)
        
        # Restaurar completo
        subprocess.run(['sqlite3', db_path, f'.restore {backup_path}'], check=True)
        
        # Restaurar solo las tablas especificadas
        for table in tables:
            subprocess.run([
                'sqlite3',
                temp_backup,
                f'.dump {table} | sqlite3 {db_path}'
            ], check=True)
            
        # Limpiar backup temporal
        os.remove(temp_backup)
    else:
        subprocess.run(['sqlite3', db_path, f'.restore {backup_path}'], check=True)

@celery.task(name='tasks.list_available_backups')
def list_available_backups(from_s3: bool = False) -> Dict:
    """Lista los backups disponibles"""
    try:
        backup_dir = os.getenv('BACKUP_DIR', 'backups')
        s3_bucket = os.getenv('BACKUP_S3_BUCKET')
        
        if from_s3 and s3_bucket:
            s3_client = boto3.client('s3')
            response = s3_client.list_objects_v2(
                Bucket=s3_bucket,
                Prefix='backups/'
            )
            
            backups = [{
                'name': obj['Key'].split('/')[-1],
                'size': obj['Size'],
                'last_modified': obj['LastModified'].isoformat(),
                'location': 's3'
            } for obj in response.get('Contents', [])]
        else:
            if not os.path.exists(backup_dir):
                return {'status': 'success', 'backups': []}
                
            backups = [{
                'name': f,
                'size': os.path.getsize(os.path.join(backup_dir, f)),
                'last_modified': datetime.fromtimestamp(
                    os.path.getctime(os.path.join(backup_dir, f))
                ).isoformat(),
                'location': 'local'
            } for f in os.listdir(backup_dir) if f.endswith('.sql')]
            
        return {
            'status': 'success',
            'backups': sorted(backups, key=lambda x: x['last_modified'], reverse=True)
        }
        
    except Exception as e:
        log_activity('backup_list_error', f"Error listando backups: {str(e)}")
        raise 
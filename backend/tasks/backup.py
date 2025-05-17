from celery import shared_task
from backend.extensions import db
from backend.utils.logger import log_activity
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import os
import subprocess
import boto3
from botocore.exceptions import ClientError

@shared_task(name='tasks.backup_database')
def backup_database():
    """Tarea asíncrona para backup de la base de datos"""
    try:
        # Configuración
        db_url = os.getenv('DATABASE_URL')
        backup_dir = os.getenv('BACKUP_DIR', 'backups')
        s3_bucket = os.getenv('BACKUP_S3_BUCKET')
        
        # Crear directorio de backup si no existe
        os.makedirs(backup_dir, exist_ok=True)
        
        # Generar nombre del archivo de backup
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = f"{backup_dir}/backup_{timestamp}.sql"
        
        # Realizar backup
        if 'postgresql' in db_url:
            subprocess.run([
                'pg_dump',
                db_url,
                '-f', backup_file
            ], check=True)
        else:
            # Backup para SQLite
            subprocess.run([
                'sqlite3',
                db_url.replace('sqlite:///', ''),
                f'.backup {backup_file}'
            ], check=True)
        
        # Subir a S3 si está configurado
        if s3_bucket:
            s3_client = boto3.client('s3')
            s3_client.upload_file(
                backup_file,
                s3_bucket,
                f"backups/{os.path.basename(backup_file)}"
            )
            
            # Eliminar backup local después de subir a S3
            os.remove(backup_file)
        
        log_activity('backup', f'Backup completado: {backup_file}')
        return {'status': 'success', 'file': backup_file}
        
    except Exception as e:
        log_activity('backup_error', f"Error en backup: {str(e)}")
        raise

@shared_task(name='tasks.cleanup_old_backups')
def cleanup_old_backups():
    """Tarea asíncrona para limpiar backups antiguos"""
    try:
        backup_dir = os.getenv('BACKUP_DIR', 'backups')
        retention_days = int(os.getenv('BACKUP_RETENTION_DAYS', 30))
        s3_bucket = os.getenv('BACKUP_S3_BUCKET')
        
        # Limpiar backups locales
        if os.path.exists(backup_dir):
            for file in os.listdir(backup_dir):
                file_path = os.path.join(backup_dir, file)
                if os.path.getctime(file_path) < (datetime.now().timestamp() - (retention_days * 86400)):
                    os.remove(file_path)
        
        # Limpiar backups en S3
        if s3_bucket:
            s3_client = boto3.client('s3')
            response = s3_client.list_objects_v2(
                Bucket=s3_bucket,
                Prefix='backups/'
            )
            
            for obj in response.get('Contents', []):
                if obj['LastModified'].timestamp() < (datetime.now().timestamp() - (retention_days * 86400)):
                    s3_client.delete_object(
                        Bucket=s3_bucket,
                        Key=obj['Key']
                    )
        
        log_activity('backup_cleanup', 'Limpieza de backups completada')
        
    except Exception as e:
        log_activity('backup_cleanup_error', f"Error en limpieza de backups: {str(e)}")
        raise 
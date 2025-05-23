import shutil
import os
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backup.log'),
        logging.StreamHandler()
    ]
)

def create_backup(version: str = "1.0", db_path: str = "automanager.db") -> Optional[str]:
    """
    Crea una copia de seguridad de la base de datos y genera un archivo de información.
    
    Args:
        version (str): Versión del backup
        db_path (str): Ruta a la base de datos
        
    Returns:
        Optional[str]: Ruta del directorio de backup si es exitoso, None si hay error
    """
    try:
        # Crear directorio de backup con timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_dir = Path(f"backups/v{version}_{timestamp}")
        backup_dir.mkdir(parents=True, exist_ok=True)
        
        # Backup de la base de datos
        if os.path.exists(db_path):
            backup_db_path = backup_dir / f"automanager_v{version}.db"
            shutil.copy2(db_path, backup_db_path)
            logging.info(f"✅ Base de datos respaldada en {backup_db_path}")
        else:
            logging.warning(f"⚠️ No se encontró la base de datos en {db_path}")
        
        # Crear archivo de información de la versión
        version_info_path = backup_dir / "version_info.txt"
        with open(version_info_path, "w", encoding='utf-8') as f:
            f.write(f"AutoManager v{version}\n")
            f.write(f"Fecha de backup: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Estado: Clientes y Vehículos funcionando\n")
            f.write(f"Problemas conocidos: Gestión de repuestos en servicios\n")
        
        logging.info(f"✅ Backup v{version} completado en {backup_dir}")
        return str(backup_dir)
        
    except Exception as e:
        logging.error(f"❌ Error durante el backup: {str(e)}")
        return None

if __name__ == "__main__":
    backup_path = create_backup()
    if backup_path:
        print(f"Backup completado exitosamente en: {backup_path}")
    else:
        print("Error al realizar el backup") 
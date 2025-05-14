import shutil
import os
from datetime import datetime

# Crear directorio de backup
backup_dir = "backups/v1.0"
os.makedirs(backup_dir, exist_ok=True)

# Backup de la base de datos
if os.path.exists("automanager.db"):
    shutil.copy2("automanager.db", f"{backup_dir}/automanager_v1.0.db")
    print("✅ Base de datos respaldada")

# Crear archivo de información de la versión
with open(f"{backup_dir}/version_info.txt", "w") as f:
    f.write(f"AutoManager v1.0\n")
    f.write(f"Fecha de backup: {datetime.now()}\n")
    f.write(f"Estado: Clientes y Vehículos funcionando\n")
    f.write(f"Problemas conocidos: Gestión de repuestos en servicios\n")

print("✅ Backup v1.0 completado") 
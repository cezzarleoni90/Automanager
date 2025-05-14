import os
import sys
from app import create_app
from models import db

# Cerrar todas las conexiones existentes a la base de datos
if 'sqlite3' in sys.modules:
    import sqlite3
    # Forzar cierre de conexiones
    sqlite3.connect('automanager.db').close()

# Eliminar base de datos existente completamente
files_to_remove = ['automanager.db', 'automanager.db-journal', 'automanager.db-wal', 'automanager.db-shm']
for file in files_to_remove:
    if os.path.exists(file):
        try:
            os.remove(file)
            print(f"Archivo {file} eliminado")
        except Exception as e:
            print(f"Error eliminando {file}: {e}")

# Crear nueva aplicación y recrear tablas
app = create_app()

with app.app_context():
    # Forzar eliminar todas las tablas existentes
    db.drop_all()
    print("Todas las tablas eliminadas")
    
    # Recrear todas las tablas
    db.create_all()
    print("Nuevas tablas creadas exitosamente")
    
    # Verificar que las tablas se crearon correctamente
    from models import Repuesto
    print("\nColumnas del modelo Repuesto después de recrear:")
    for column in Repuesto.__table__.columns:
        print(f"  - {column.name}: {column.type}") 
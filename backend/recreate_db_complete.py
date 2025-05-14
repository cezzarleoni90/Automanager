import os
from app import create_app
from extensions import db

# Crear aplicación
app = create_app()

print("=== RECREANDO BASE DE DATOS COMPLETA ===")

# 1. Eliminar base de datos existente
if os.path.exists('automanager.db'):
    os.remove('automanager.db')
    print("✅ Base de datos anterior eliminada")

# 2. Crear todas las tablas con el esquema actualizado
with app.app_context():
    # Crear todas las tablas
    db.create_all()
    print("✅ Todas las tablas creadas con esquema actualizado")
    
    # Verificar estructura de movimiento_inventario
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    columns = inspector.get_columns('movimiento_inventario')
    
    print("\n=== COLUMNAS DE movimiento_inventario ===")
    for column in columns:
        print(f"  - {column['name']}: {column['type']}")
    
    print("\n✅ Base de datos recreada exitosamente") 
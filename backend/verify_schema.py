from app import create_app
from extensions import db
from sqlalchemy import inspect

app = create_app()

with app.app_context():
    print("=== VERIFICACIÓN DE ESQUEMA ===\n")
    
    inspector = inspect(db.engine)
    
    # Verificar tabla repuesto
    print("1. Tabla 'repuesto':")
    columns = inspector.get_columns('repuesto')
    for column in columns:
        print(f"  - {column['name']}: {column['type']}")
    
    # Verificar tabla movimiento_inventario
    print("\n2. Tabla 'movimiento_inventario':")
    columns = inspector.get_columns('movimiento_inventario')
    for column in columns:
        print(f"  - {column['name']}: {column['type']}")
    
    # Verificar claves foráneas
    print("\n3. Claves foráneas en 'movimiento_inventario':")
    foreign_keys = inspector.get_foreign_keys('movimiento_inventario')
    for fk in foreign_keys:
        print(f"  - {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}")
    
    print("\n✅ Verificación completa") 
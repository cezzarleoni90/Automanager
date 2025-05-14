from app import create_app
from models import db, Vehiculo, Mecanico
from sqlalchemy import inspect

app = create_app()

with app.app_context():
    print("=== ESTRUCTURA DE MODELOS ===")
    
    print("\n1. Estructura del modelo Vehículo:")
    for column in Vehiculo.__table__.columns:
        print(f"  - {column.name}: {column.type}")
    
    print("\n2. Estructura del modelo Mecánico:")
    for column in Mecanico.__table__.columns:
        print(f"  - {column.name}: {column.type}") 
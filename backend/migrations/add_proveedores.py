from app import create_app
from models import db, Proveedor, Repuesto
from datetime import datetime

app = create_app()

def migrate():
    with app.app_context():
        try:
            # Crear tabla de proveedores
            db.create_all()
            
            # Crear algunos proveedores de prueba
            proveedores = [
                {
                    'nombre': 'Distribuidora AutoParts',
                    'contacto': 'Juan Pérez',
                    'telefono': '555-0101',
                    'email': 'contacto@autoparts.com',
                    'direccion': 'Av. Industrial 123',
                    'estado': 'activo',
                    'notas': 'Proveedor principal de repuestos generales'
                },
                {
                    'nombre': 'Frenos y Suspensión S.A.',
                    'contacto': 'María García',
                    'telefono': '555-0102',
                    'email': 'ventas@frenosysuspension.com',
                    'direccion': 'Calle Técnica 456',
                    'estado': 'activo',
                    'notas': 'Especialista en sistemas de frenos'
                },
                {
                    'nombre': 'Motores y Transmisiones',
                    'contacto': 'Carlos Rodríguez',
                    'telefono': '555-0103',
                    'email': 'info@motores.com',
                    'direccion': 'Zona Industrial Norte 789',
                    'estado': 'activo',
                    'notas': 'Proveedor de componentes de motor'
                }
            ]
            
            # Insertar proveedores
            for prov_data in proveedores:
                proveedor = Proveedor(**prov_data)
                db.session.add(proveedor)
            
            db.session.commit()
            print("Proveedores creados exitosamente")
            
            # Actualizar repuestos existentes con proveedores
            repuestos = Repuesto.query.all()
            for repuesto in repuestos:
                # Asignar un proveedor aleatorio a cada repuesto
                proveedor = Proveedor.query.order_by(db.func.random()).first()
                if proveedor:
                    repuesto.proveedor = proveedor
            
            db.session.commit()
            print("Repuestos actualizados con proveedores")
            
        except Exception as e:
            print(f"Error durante la migración: {e}")
            db.session.rollback()

if __name__ == '__main__':
    migrate() 
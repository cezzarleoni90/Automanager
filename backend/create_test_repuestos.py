from app import create_app
from models import db, Inventario
import random

def create_test_data():
    app = create_app()
    with app.app_context():
        # Crear algunos repuestos de prueba
        repuestos = [
            {
                'nombre': 'Aceite de Motor 5W-30',
                'descripcion': 'Aceite sintético para motor',
                'stock': 15,
                'stock_minimo': 5,
                'precio_compra': 25.00,
                'precio_venta': 35.00,
                'categoria': 'Lubricantes'
            },
            {
                'nombre': 'Filtro de Aceite',
                'descripcion': 'Filtro de aceite universal',
                'stock': 8,
                'stock_minimo': 10,
                'precio_compra': 8.00,
                'precio_venta': 15.00,
                'categoria': 'Filtros'
            },
            {
                'nombre': 'Pastillas de Freno',
                'descripcion': 'Pastillas de freno cerámicas',
                'stock': 4,
                'stock_minimo': 6,
                'precio_compra': 30.00,
                'precio_venta': 45.00,
                'categoria': 'Frenos'
            },
            {
                'nombre': 'Bujías NGK',
                'descripcion': 'Bujías de iridio',
                'stock': 20,
                'stock_minimo': 15,
                'precio_compra': 12.00,
                'precio_venta': 20.00,
                'categoria': 'Motor'
            },
            {
                'nombre': 'Líquido de Frenos DOT4',
                'descripcion': 'Líquido de frenos sintético',
                'stock': 3,
                'stock_minimo': 5,
                'precio_compra': 15.00,
                'precio_venta': 25.00,
                'categoria': 'Frenos'
            }
        ]
        
        # Insertar los repuestos en la base de datos
        for repuesto in repuestos:
            item = Inventario(**repuesto)
            db.session.add(item)
        
        try:
            db.session.commit()
            print("Datos de prueba creados exitosamente")
        except Exception as e:
            db.session.rollback()
            print(f"Error al crear datos de prueba: {str(e)}")

if __name__ == '__main__':
    create_test_data() 
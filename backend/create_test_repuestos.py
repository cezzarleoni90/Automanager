from app import create_app
from models import db, Repuesto

app = create_app()

with app.app_context():
    # Crear repuestos de prueba
    repuestos = [
        {
            'codigo': 'REP001',
            'nombre': 'Filtro de Aceite',
            'categoria': 'Filtros',
            'precio_compra': 15.00,
            'precio_venta': 25.00,
            'stock': 50,
            'stock_minimo': 10,
            'descripcion': 'Filtro de aceite universal',
            'estado': 'activo'
        },
        {
            'codigo': 'REP002',
            'nombre': 'Pastillas de Freno',
            'categoria': 'Frenos',
            'precio_compra': 45.00,
            'precio_venta': 75.00,
            'stock': 30,
            'stock_minimo': 5,
            'descripcion': 'Pastillas de freno delanteras',
            'estado': 'activo'
        },
        {
            'codigo': 'REP003',
            'nombre': 'Bujía',
            'categoria': 'Motor',
            'precio_compra': 8.00,
            'precio_venta': 15.00,
            'stock': 100,
            'stock_minimo': 20,
            'descripcion': 'Bujía de encendido',
            'estado': 'activo'
        }
    ]
    
    for rep_data in repuestos:
        # Verificar si ya existe
        existing = Repuesto.query.filter_by(codigo=rep_data['codigo']).first()
        if not existing:
            repuesto = Repuesto(**rep_data)
            db.session.add(repuesto)
    
    db.session.commit()
    print("Repuestos de prueba creados exitosamente")
    
    # Verificar que se crearon
    repuestos_count = Repuesto.query.count()
    print(f"Total de repuestos en la base de datos: {repuestos_count}") 
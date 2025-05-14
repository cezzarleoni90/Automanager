from app import create_app
from extensions import db
from models import Repuesto, Usuario
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    print("=== CREANDO DATOS DE PRUEBA ===")
    
    # 1. Crear usuario admin (si no existe)
    admin = Usuario.query.filter_by(email='admin@automanager.com').first()
    if not admin:
        admin = Usuario(
            nombre='Administrador',
            email='admin@automanager.com',
            password_hash=generate_password_hash('admin123'),
            rol='admin'
        )
        db.session.add(admin)
        db.session.commit()
        print("✅ Usuario admin creado")
    
    # 2. Crear repuestos de prueba
    repuestos_data = [
        {
            'codigo': 'FIL001',
            'nombre': 'Filtro de Aceite Toyota',
            'descripcion': 'Filtro de aceite para motores Toyota',
            'categoria': 'Filtros',
            'stock': 25,
            'stock_minimo': 5,
            'precio_compra': 12.50,
            'precio_venta': 20.00
        },
        {
            'codigo': 'FRE001',
            'nombre': 'Pastillas de Freno Delanteras',
            'descripcion': 'Pastillas de freno delanteras universales',
            'categoria': 'Frenos',
            'stock': 15,
            'stock_minimo': 3,
            'precio_compra': 45.00,
            'precio_venta': 80.00
        },
        {
            'codigo': 'MOT001',
            'nombre': 'Bujía NGK',
            'descripcion': 'Bujía de encendido NGK',
            'categoria': 'Motor',
            'stock': 50,
            'stock_minimo': 10,
            'precio_compra': 8.00,
            'precio_venta': 15.00
        }
    ]
    
    for rep_data in repuestos_data:
        if not Repuesto.query.filter_by(codigo=rep_data['codigo']).first():
            repuesto = Repuesto(**rep_data)
            db.session.add(repuesto)
    
    db.session.commit()
    print(f"✅ {len(repuestos_data)} repuestos de prueba creados")
    
    # 3. Verificar datos creados
    print(f"\nTotal repuestos: {Repuesto.query.count()}")
    print(f"Total usuarios: {Usuario.query.count()}")
    
    print("\n✅ Datos de prueba creados exitosamente") 
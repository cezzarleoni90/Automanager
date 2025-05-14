from app import create_app
from models import db, Cliente, Vehiculo, Repuesto, Mecanico, Usuario
from werkzeug.security import generate_password_hash
from datetime import datetime

app = create_app()

with app.app_context():
    print("Creando datos de prueba completos...")
    
    # 1. Crear usuario admin si no existe
    if not Usuario.query.filter_by(email='admin@automanager.com').first():
        admin = Usuario(
            nombre='Administrador',
            email='admin@automanager.com',
            password_hash=generate_password_hash('admin123'),
            rol='admin',
            activo=True
        )
        db.session.add(admin)
        print("✓ Usuario admin creado")
    
    # 2. Crear mecánicos
    mecanicos_data = [
        {
            'nombre': 'Pedro',
            'apellido': 'Martínez',
            'email': 'pedro@taller.com',
            'telefono': '555-1001',
            'especialidad': 'Mecánica General',
            'fecha_contratacion': datetime.now(),
            'estado': 'activo'
        },
        {
            'nombre': 'Ana',
            'apellido': 'Rodríguez', 
            'email': 'ana@taller.com',
            'telefono': '555-1002',
            'especialidad': 'Electricidad',
            'fecha_contratacion': datetime.now(),
            'estado': 'activo'
        },
        {
            'nombre': 'Carlos',
            'apellido': 'García',
            'email': 'carlos@taller.com',
            'telefono': '555-1003',
            'especialidad': 'Frenos y Suspensión',
            'fecha_contratacion': datetime.now(),
            'estado': 'activo'
        }
    ]
    
    for mec_data in mecanicos_data:
        if not Mecanico.query.filter_by(email=mec_data['email']).first():
            mecanico = Mecanico(**mec_data)
            db.session.add(mecanico)
    
    # 3. Crear clientes
    clientes_data = [
        {
            'nombre': 'Juan',
            'apellido': 'Pérez',
            'email': 'juan@email.com',
            'telefono': '555-2001',
            'direccion': 'Calle 123',
            'fecha_registro': datetime.now(),
            'estado': 'activo'
        },
        {
            'nombre': 'María',
            'apellido': 'García',
            'email': 'maria@email.com',
            'telefono': '555-2002',
            'direccion': 'Avenida 456',
            'fecha_registro': datetime.now(),
            'estado': 'activo'
        },
        {
            'nombre': 'Carlos',
            'apellido': 'López',
            'email': 'carlos@email.com',
            'telefono': '555-2003',
            'direccion': 'Boulevard 789',
            'fecha_registro': datetime.now(),
            'estado': 'activo'
        }
    ]
    
    for cli_data in clientes_data:
        if not Cliente.query.filter_by(email=cli_data['email']).first():
            cliente = Cliente(**cli_data)
            db.session.add(cliente)
    
    db.session.commit()
    
    print("Esperando que se vea la estructura del modelo Vehículo...")
    # Primero veamos qué campos tiene el modelo Vehículo
    print("Campos del modelo Vehículo:")
    for column in Vehiculo.__table__.columns:
        print(f"  - {column.name}: {column.type}")
    
    # 4. Crear vehículos (ajustaremos según la estructura real)
    clientes = Cliente.query.all()
    vehiculos_data = [
        {
            'placa': 'ABC123',
            'marca': 'Toyota',
            'modelo': 'Corolla',
            'año': 2020,
            'color': 'Blanco',
            'cliente_id': clientes[0].id if clientes else 1
        },
        {
            'placa': 'DEF456',
            'marca': 'Honda',
            'modelo': 'Civic', 
            'año': 2019,
            'color': 'Negro',
            'cliente_id': clientes[1].id if len(clientes) > 1 else 1
        },
        {
            'placa': 'GHI789',
            'marca': 'Ford',
            'modelo': 'Focus',
            'año': 2021,
            'color': 'Azul',
            'cliente_id': clientes[2].id if len(clientes) > 2 else 1
        }
    ]
    
    # Crear vehículos con manejo de errores
    vehiculos_creados = 0
    for veh_data in vehiculos_data:
        if not Vehiculo.query.filter_by(placa=veh_data['placa']).first():
            try:
                vehiculo = Vehiculo(**veh_data)
                db.session.add(vehiculo)
                vehiculos_creados += 1
            except Exception as e:
                print(f"Error creando vehículo {veh_data['placa']}: {e}")
                continue
    
    db.session.commit()
    
    print(f"\nDatos de prueba creados exitosamente:")
    print(f"- Usuarios: {Usuario.query.count()}")
    print(f"- Clientes: {Cliente.query.count()}")
    print(f"- Vehículos: {Vehiculo.query.count()}")
    print(f"- Mecánicos: {Mecanico.query.count()}")
    print(f"- Repuestos: {Repuesto.query.count()}") 
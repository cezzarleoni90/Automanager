from app import create_app
from models import db, Cliente, Vehiculo, Repuesto, Mecanico, Servicio, HoraTrabajo, MovimientoInventario, Factura, Usuario
from sqlalchemy import inspect

app = create_app()

with app.app_context():
    print("=== Verificación de Base de Datos ===")
    
    # Verificar tablas existentes
    print("\n1. Tablas existentes:")
    try:
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        for table in sorted(tables):
            print(f"  - {table}")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Verificar usuarios
    print("\n2. Usuarios:")
    try:
        usuarios = Usuario.query.all()
        print(f"  Total: {len(usuarios)}")
        for usuario in usuarios:
            print(f"  - {usuario.nombre} ({usuario.email}) - Rol: {getattr(usuario, 'rol', 'N/A')}")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Verificar clientes
    print("\n3. Clientes:")
    try:
        clientes = Cliente.query.all()
        print(f"  Total: {len(clientes)}")
        for cliente in clientes[:3]:  # Mostrar primeros 3
            print(f"  - {cliente.nombre} {cliente.apellido}")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Verificar vehículos
    print("\n4. Vehículos:")
    try:
        vehiculos = Vehiculo.query.all()
        print(f"  Total: {len(vehiculos)}")
        for vehiculo in vehiculos[:3]:  # Mostrar primeros 3
            print(f"  - {vehiculo.placa} ({vehiculo.marca} {vehiculo.modelo})")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Verificar mecánicos
    print("\n5. Mecánicos:")
    try:
        mecanicos = Mecanico.query.all()
        print(f"  Total: {len(mecanicos)}")
        for mecanico in mecanicos:
            print(f"  - {mecanico.nombre} {mecanico.apellido} - {getattr(mecanico, 'especialidad', 'N/A')}")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Verificar repuestos
    print("\n6. Repuestos:")
    try:
        repuestos = Repuesto.query.all()
        print(f"  Total: {len(repuestos)}")
        for repuesto in repuestos:
            print(f"  - {repuesto.codigo}: {repuesto.nombre} (Stock: {repuesto.stock})")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Verificar servicios
    print("\n7. Servicios:")
    try:
        servicios = Servicio.query.all()
        print(f"  Total: {len(servicios)}")
        for servicio in servicios[:3]:
            print(f"  - ID: {servicio.id} - {servicio.tipo_servicio} - Estado: {servicio.estado}")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Verificar facturas
    print("\n8. Facturas:")
    try:
        facturas = Factura.query.all()
        print(f"  Total: {len(facturas)}")
        for factura in facturas:
            print(f"  - {factura.numero} - Total: ${factura.total}")
    except Exception as e:
        print(f"  Error: {e}")
    
    # Verificar estructura de modelos
    print("\n9. Estructura del modelo Cliente:")
    try:
        for column in Cliente.__table__.columns:
            print(f"  - {column.name}: {column.type}")
    except Exception as e:
        print(f"  Error: {e}")
    
    print("\n10. Estructura del modelo Mecánico:")
    try:
        for column in Mecanico.__table__.columns:
            print(f"  - {column.name}: {column.type}")
    except Exception as e:
        print(f"  Error: {e}") 
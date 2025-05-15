from app import create_app
from models import db, Cliente, Vehiculo, Repuesto, Mecanico, Servicio, HoraTrabajo, MovimientoInventario, Factura, Usuario
from sqlalchemy import inspect
import sqlite3
import os

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

def check_database():
    app = create_app()
    
    # Ruta completa a la base de datos
    db_path = os.path.join(os.path.dirname(__file__), 'automanager.db')
    
    # Verificar que el archivo existe
    if not os.path.exists(db_path):
        print(f"❌ No se encuentra la base de datos en: {db_path}")
        return
    
    print(f"📂 Usando base de datos: {db_path}")
    
    # Conectar directamente a la base de datos
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Listar todas las tablas existentes
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("\n📋 Tablas existentes en la base de datos:")
        for table in tables:
            print(f"  - {table[0]}")
        
        # Verificar si existe la tabla mecanico
        if ('mecanico',) in tables:
            print("✅ La tabla mecanico existe")
        else:
            print("\n⚠️ La tabla mecanico NO existe, creándola...")
            
            # Script SQL para crear la tabla mecanico
            create_table_sql = '''
            CREATE TABLE mecanico (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                apellido TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                telefono TEXT,
                especialidad TEXT,
                tarifa_hora REAL DEFAULT 0.0,
                fecha_contratacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                estado TEXT DEFAULT 'activo'
            );
            '''
            
            cursor.execute(create_table_sql)
            conn.commit()
            print("✅ Tabla mecanico creada exitosamente")
            
            # Crear un mecánico de prueba
            cursor.execute('''
            INSERT INTO mecanico (nombre, apellido, email, telefono, especialidad, tarifa_hora, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', ('Juan', 'Pérez', 'juan.perez@automanager.com', '123456789', 'Mecánica General', 25.0, 'activo'))
            
            conn.commit()
            print("✅ Mecánico de prueba creado exitosamente")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print(f"Tipo de error: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    check_database() 
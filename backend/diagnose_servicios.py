from app import create_app
from models import db, Servicio, Mecanico, Cliente, Vehiculo, Usuario
import traceback
import sqlite3
import os

def diagnose_servicios():
    app = create_app()
    
    with app.app_context():
        print("=== Diagnóstico de Servicios ===")
        
        try:
            # Verificar campos del modelo Servicio
            print("\n1. Estructura del modelo Servicio:")
            for column in Servicio.__table__.columns:
                print(f"  - {column.name}: {column.type}")
            
            # Verificar estructura de la tabla en la base de datos
            db_path = os.path.join(os.path.dirname(__file__), 'automanager.db')
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            cursor.execute("PRAGMA table_info(servicio)")
            columns = cursor.fetchall()
            
            print("\n2. Estructura real de la tabla servicio:")
            for col in columns:
                print(f"  - {col[1]} ({col[2]})")
            
            # Verificar relaciones
            print("\n3. Relaciones requeridas:")
            
            # Verificar vehiculos
            vehiculos = Vehiculo.query.all()
            print(f"  - Vehículos: {len(vehiculos)}")
            
            # Verificar clientes
            clientes = Cliente.query.all()
            print(f"  - Clientes: {len(clientes)}")
            
            # Verificar mecánicos
            mecanicos = Mecanico.query.all()
            print(f"  - Mecánicos: {len(mecanicos)}")
            
            # Verificar usuarios
            usuarios = Usuario.query.all()
            print(f"  - Usuarios: {len(usuarios)}")
            
            # Intentar crear un servicio de prueba
            print("\n4. Intentando crear servicio de prueba:")
            
            if not vehiculos:
                print("  ⚠️ No hay vehículos disponibles, creando uno...")
                if not clientes:
                    print("  ⚠️ No hay clientes disponibles, creando uno...")
                    nuevo_cliente = Cliente(
                        nombre="Cliente",
                        apellido="Prueba",
                        email="cliente@test.com",
                        telefono="123456789",
                        estado="activo"
                    )
                    db.session.add(nuevo_cliente)
                    db.session.flush()
                    cliente_id = nuevo_cliente.id
                    print(f"  ✅ Cliente creado con ID: {cliente_id}")
                else:
                    cliente_id = clientes[0].id
                
                nuevo_vehiculo = Vehiculo(
                    marca="Toyota",
                    modelo="Corolla",
                    año=2020,
                    placa="TEST123",
                    color="Blanco",
                    cliente_id=cliente_id
                )
                db.session.add(nuevo_vehiculo)
                db.session.flush()
                vehiculo_id = nuevo_vehiculo.id
                print(f"  ✅ Vehículo creado con ID: {vehiculo_id}")
            else:
                vehiculo_id = vehiculos[0].id
                cliente_id = vehiculos[0].cliente_id
            
            if not usuarios:
                print("  ⚠️ No hay usuarios disponibles, creando uno...")
                admin = Usuario(
                    nombre="Admin",
                    apellido="Sistema",
                    email="admin@test.com",
                    rol="admin"
                )
                admin.set_password("admin123")
                db.session.add(admin)
                db.session.flush()
                usuario_id = admin.id
                print(f"  ✅ Usuario creado con ID: {usuario_id}")
            else:
                usuario_id = usuarios[0].id
            
            nuevo_servicio = Servicio(
                tipo_servicio="Diagnóstico",
                descripcion="Servicio de diagnóstico de prueba",
                fecha_inicio=db.func.current_timestamp(),
                estado="pendiente",
                vehiculo_id=vehiculo_id,
                cliente_id=cliente_id,
                usuario_id=usuario_id
            )
            
            db.session.add(nuevo_servicio)
            db.session.commit()
            
            print(f"  ✅ Servicio de prueba creado exitosamente con ID: {nuevo_servicio.id}")
            print("\n✅ Todo parece estar funcionando correctamente con el modelo Servicio")
            
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
            traceback.print_exc()
            db.session.rollback()
            
            # Sugerir soluciones basadas en el error
            if "foreign key constraint failed" in str(e).lower():
                print("\n🔧 Solución sugerida:")
                print("  - El error se debe a un problema con las claves foráneas")
                print("  - Verifica que todas las tablas relacionadas existan y tengan datos")
                print("  - Ejecuta el script de recreación de base de datos")
            elif "no such column" in str(e).lower():
                print("\n🔧 Solución sugerida:")
                print("  - El error se debe a una columna faltante en la tabla")
                print("  - Ejecuta el script de recreación de base de datos para añadir la columna")
            elif "not null constraint failed" in str(e).lower():
                print("\n🔧 Solución sugerida:")
                print("  - El error se debe a un campo obligatorio que es NULL")
                print("  - Verifica que estás proporcionando todos los campos requeridos")
            
            print("\n⚠️ Recomendación general: Ejecuta el script recreate_database.py para reiniciar la base de datos")

if __name__ == "__main__":
    diagnose_servicios() 
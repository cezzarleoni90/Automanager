from app import create_app
from extensions import db
from models import Usuario, Cliente, Vehiculo, Mecanico, Servicio

def recreate_database():
    app = create_app()
    
    with app.app_context():
        print("🔄 Recreando la base de datos...")
        
        # Confirmar con el usuario
        confirm = input("⚠️ ADVERTENCIA: Esto eliminará todos los datos. ¿Continuar? (S/N): ")
        if confirm.lower() != 's':
            print("❌ Operación cancelada")
            return
        
        try:
            # Recrear todas las tablas
            db.drop_all()
            db.create_all()
            print("✅ Tablas recreadas exitosamente")
            
            # Crear usuario admin
            admin = Usuario(
                nombre="Admin",
                apellido="Sistema",
                email="admin@automanager.com",
                rol="admin"
            )
            admin.set_password("admin123")
            db.session.add(admin)
            
            # Crear mecánico de prueba
            mecanico = Mecanico(
                nombre="Juan",
                apellido="Pérez",
                email="juan.perez@automanager.com",
                telefono="123456789",
                especialidad="Mecánica General",
                tarifa_hora=25.0,
                estado="activo"
            )
            db.session.add(mecanico)
            
            # Crear cliente de prueba
            cliente = Cliente(
                nombre="Carlos",
                apellido="Gómez",
                email="carlos@example.com",
                telefono="987654321",
                direccion="Calle Principal 123",
                estado="activo"
            )
            db.session.add(cliente)
            
            # Crear vehículo de prueba
            vehiculo = Vehiculo(
                marca="Toyota",
                modelo="Corolla",
                año=2018,
                placa="ABC123",
                color="Blanco",
                cliente_id=1,
                kilometraje=75000,
                tipo_combustible="Gasolina",
                transmision="Automática"
            )
            
            db.session.add(vehiculo)
            db.session.commit()
            
            print("✅ Datos iniciales creados exitosamente")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    recreate_database() 
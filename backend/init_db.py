from backend.app import create_app
from backend.models import db, Usuario, Repuesto, Proveedor, MovimientoInventario, Servicio, Cliente, Vehiculo, Mecanico, Factura, Pago, HistorialMantenimiento, Notificacion, Configuracion, Evento, HoraTrabajo, HistorialEstado, ArchivoServicio, FotoServicio
import time
import os

def init_db():
    app = create_app()
    with app.app_context():
        try:
            # Eliminar todas las tablas existentes
            db.drop_all()
            print("Tablas existentes eliminadas")
            
            # Crear todas las tablas
            db.create_all()
            print("Tablas creadas correctamente")

            # Verificar si ya existe un usuario administrador
            admin = Usuario.query.filter_by(email='admin@automanager.com').first()
            if not admin:
                # Crear usuario administrador
                admin = Usuario(
                    nombre='Administrador',
                    apellido='Sistema',
                    email='admin@automanager.com',
                    rol='administrador'
                )
                admin.set_password('admin123')
                db.session.add(admin)
                db.session.commit()
                print('Usuario administrador creado exitosamente')
            else:
                print('El usuario administrador ya existe')

        except Exception as e:
            print(f"Error al inicializar la base de datos: {str(e)}")
            db.session.rollback()

    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///automanager.db')

if __name__ == '__main__':
    init_db() 
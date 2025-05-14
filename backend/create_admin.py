from app import create_app
from extensions import db
from models import Usuario
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_admin():
    try:
        app = create_app()
        with app.app_context():
            logger.info("Iniciando creación de usuario administrador...")
            
            # Verificar si ya existe un usuario admin
            admin = Usuario.query.filter_by(email='admin@automanager.com').first()
            if not admin:
                logger.info("Creando nuevo usuario administrador...")
                admin = Usuario(
                    nombre='Administrador',
                    email='admin@automanager.com',
                    rol='admin',
                    activo=True
                )
                admin.set_password('admin123')
                db.session.add(admin)
                db.session.commit()
                logger.info('Usuario administrador creado exitosamente')
                
                # Verificar que el usuario se creó correctamente
                admin_verificado = Usuario.query.filter_by(email='admin@automanager.com').first()
                if admin_verificado:
                    logger.info(f"Usuario verificado: {admin_verificado.email} - Rol: {admin_verificado.rol}")
                    logger.info(f"Password hash: {admin_verificado.password_hash}")
                else:
                    logger.error("Error: El usuario no se creó correctamente")
            else:
                logger.info('El usuario administrador ya existe')
                logger.info(f"Usuario existente: {admin.email} - Rol: {admin.rol}")
                logger.info(f"Password hash: {admin.password_hash}")
    except Exception as e:
        logger.error(f'Error al crear usuario administrador: {str(e)}')
        raise

if __name__ == '__main__':
    create_admin() 
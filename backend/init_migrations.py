from app import create_app
from flask_migrate import init, migrate, upgrade
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_migrations():
    app = create_app()
    
    with app.app_context():
        try:
            # Inicializar migraciones
            init()
            logger.info("Directorio de migraciones inicializado")
            
            # Crear primera migración
            migrate(message="initial migration")
            logger.info("Primera migración creada")
            
            # Aplicar migraciones
            upgrade()
            logger.info("Migraciones aplicadas exitosamente")
            
        except Exception as e:
            logger.error(f"Error durante la inicialización de migraciones: {str(e)}")
            raise

if __name__ == '__main__':
    init_migrations() 
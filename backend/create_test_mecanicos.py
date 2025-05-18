from app import create_app
from extensions import db
from models import Mecanico
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_test_mecanicos():
    try:
        app = create_app()
        with app.app_context():
            logger.info("Iniciando creación de mecánicos de prueba...")
            
            # Lista de mecánicos de prueba
            mecanicos = [
                {
                    'nombre': 'Juan',
                    'apellido': 'Pérez',
                    'email': 'juan.perez@automanager.com',
                    'telefono': '3501234567',
                    'especialidad': 'Mecánica General',
                    'tarifa_hora': 25000,
                    'estado': 'activo',
                    'color': '#FFB6C1'
                },
                {
                    'nombre': 'María',
                    'apellido': 'González',
                    'email': 'maria.gonzalez@automanager.com',
                    'telefono': '3502345678',
                    'especialidad': 'Electricidad Automotriz',
                    'tarifa_hora': 28000,
                    'estado': 'activo',
                    'color': '#98FB98'
                },
                {
                    'nombre': 'Carlos',
                    'apellido': 'Rodríguez',
                    'email': 'carlos.rodriguez@automanager.com',
                    'telefono': '3503456789',
                    'especialidad': 'Pintura y Carrocería',
                    'tarifa_hora': 30000,
                    'estado': 'activo',
                    'color': '#87CEEB'
                }
            ]
            
            for datos in mecanicos:
                # Verificar si el mecánico ya existe
                if not Mecanico.query.filter_by(email=datos['email']).first():
                    logger.info(f"Creando mecánico: {datos['nombre']} {datos['apellido']}")
                    mecanico = Mecanico(**datos)
                    db.session.add(mecanico)
                else:
                    logger.info(f"El mecánico {datos['nombre']} {datos['apellido']} ya existe")
            
            db.session.commit()
            logger.info("Mecánicos de prueba creados exitosamente")
            
    except Exception as e:
        logger.error(f'Error al crear mecánicos de prueba: {str(e)}')
        raise

if __name__ == '__main__':
    create_test_mecanicos() 
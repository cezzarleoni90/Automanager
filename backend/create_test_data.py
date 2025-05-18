from app import create_app
from extensions import db
from models import Cliente, Vehiculo
import logging
from datetime import datetime, timezone

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_test_data():
    try:
        app = create_app()
        with app.app_context():
            logger.info("Iniciando creación de datos de prueba...")
            
            # Lista de clientes de prueba
            clientes = [
                {
                    'nombre': 'Roberto',
                    'apellido': 'Martínez',
                    'email': 'roberto.martinez@email.com',
                    'telefono': '3504567890',
                    'direccion': 'Calle 123 #45-67, Medellín',
                    'estado': 'activo',
                    'preferencias': {
                        'notificaciones': True,
                        'recordatorios': True,
                        'tipo_servicio_preferido': 'Mecánica General'
                    }
                },
                {
                    'nombre': 'Ana',
                    'apellido': 'Sánchez',
                    'email': 'ana.sanchez@email.com',
                    'telefono': '3505678901',
                    'direccion': 'Carrera 78 #90-12, Medellín',
                    'estado': 'activo',
                    'preferencias': {
                        'notificaciones': True,
                        'recordatorios': False,
                        'tipo_servicio_preferido': 'Electricidad'
                    }
                },
                {
                    'nombre': 'Pedro',
                    'apellido': 'Ramírez',
                    'email': 'pedro.ramirez@email.com',
                    'telefono': '3506789012',
                    'direccion': 'Avenida 34 #56-78, Medellín',
                    'estado': 'activo',
                    'preferencias': {
                        'notificaciones': False,
                        'recordatorios': True,
                        'tipo_servicio_preferido': 'Pintura'
                    }
                }
            ]
            
            # Lista de vehículos de prueba
            vehiculos = [
                {
                    'marca': 'Toyota',
                    'modelo': 'Corolla',
                    'año': 2020,
                    'placa': 'ABC123',
                    'color': 'Blanco',
                    'kilometraje': 25000,
                    'tipo_combustible': 'Gasolina',
                    'transmision': 'Automática',
                    'vin': '1HGCM82633A123456'
                },
                {
                    'marca': 'Honda',
                    'modelo': 'Civic',
                    'año': 2021,
                    'placa': 'DEF456',
                    'color': 'Negro',
                    'kilometraje': 15000,
                    'tipo_combustible': 'Gasolina',
                    'transmision': 'Automática',
                    'vin': '2HGES16575H123456'
                },
                {
                    'marca': 'Volkswagen',
                    'modelo': 'Golf',
                    'año': 2019,
                    'placa': 'GHI789',
                    'color': 'Rojo',
                    'kilometraje': 35000,
                    'tipo_combustible': 'Diesel',
                    'transmision': 'Manual',
                    'vin': 'WVWZZZ1KZAW123456'
                }
            ]
            
            # Crear clientes
            clientes_creados = []
            for datos_cliente in clientes:
                if not Cliente.query.filter_by(email=datos_cliente['email']).first():
                    logger.info(f"Creando cliente: {datos_cliente['nombre']} {datos_cliente['apellido']}")
                    cliente = Cliente(**datos_cliente)
                    db.session.add(cliente)
                    clientes_creados.append(cliente)
                else:
                    logger.info(f"El cliente {datos_cliente['nombre']} {datos_cliente['apellido']} ya existe")
            
            db.session.commit()
            
            # Crear vehículos
            for i, datos_vehiculo in enumerate(vehiculos):
                if clientes_creados and i < len(clientes_creados):
                    datos_vehiculo['cliente_id'] = clientes_creados[i].id
                    
                    if not Vehiculo.query.filter_by(placa=datos_vehiculo['placa']).first():
                        logger.info(f"Creando vehículo: {datos_vehiculo['marca']} {datos_vehiculo['modelo']} - {datos_vehiculo['placa']}")
                        vehiculo = Vehiculo(**datos_vehiculo)
                        db.session.add(vehiculo)
                    else:
                        logger.info(f"El vehículo con placa {datos_vehiculo['placa']} ya existe")
            
            db.session.commit()
            logger.info("Datos de prueba creados exitosamente")
            
    except Exception as e:
        logger.error(f'Error al crear datos de prueba: {str(e)}')
        raise

if __name__ == '__main__':
    create_test_data() 
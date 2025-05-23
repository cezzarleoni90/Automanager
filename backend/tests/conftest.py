import pytest
from datetime import datetime, timezone
from backend import create_app, db
from backend.models import Mecanico, Servicio, HoraTrabajo

@pytest.fixture
def app():
    """Crear y configurar una nueva instancia de la aplicación para cada prueba"""
    app = create_app('testing')
    
    # Crear el contexto de la aplicación
    with app.app_context():
        # Crear todas las tablas
        db.create_all()
        
        yield app
        
        # Limpiar después de cada prueba
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Cliente de prueba para hacer peticiones"""
    return app.test_client()

@pytest.fixture
def runner(app):
    """Runner de CLI para pruebas"""
    return app.test_cli_runner()

@pytest.fixture
def mecanico_ejemplo(app):
    """Crear un mecánico de ejemplo para pruebas"""
    with app.app_context():
        mecanico = Mecanico(
            nombre='Ejemplo',
            apellido='Mecánico',
            email='ejemplo@test.com',
            telefono='123456789',
            especialidad='General',
            tarifa_hora=50.0,
            tipo_pago='tarifa_hora'
        )
        db.session.add(mecanico)
        db.session.commit()
        return mecanico

@pytest.fixture
def servicio_ejemplo(app, mecanico_ejemplo):
    """Crear un servicio de ejemplo para pruebas"""
    with app.app_context():
        servicio = Servicio(
            titulo='Servicio de prueba',
            descripcion='Descripción de prueba',
            estado='en_progreso',
            fecha_inicio=datetime.now(timezone.utc),
            mecanico_id=mecanico_ejemplo.id
        )
        db.session.add(servicio)
        db.session.commit()
        return servicio

@pytest.fixture
def hora_trabajo_ejemplo(app, mecanico_ejemplo, servicio_ejemplo):
    """Crear un registro de horas de trabajo de ejemplo"""
    with app.app_context():
        hora = HoraTrabajo(
            mecanico_id=mecanico_ejemplo.id,
            servicio_id=servicio_ejemplo.id,
            fecha=datetime.now(timezone.utc),
            horas_trabajadas=4.0,
            descripcion='Trabajo de prueba'
        )
        db.session.add(hora)
        db.session.commit()
        return hora 
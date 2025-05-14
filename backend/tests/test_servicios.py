import pytest
from datetime import datetime
from app import create_app, db
from models import Servicio, Mecanico, Repuesto, MovimientoInventario

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def servicio_ejemplo(app):
    with app.app_context():
        servicio = Servicio(
            tipo_servicio='Mantenimiento',
            descripcion='Cambio de aceite',
            fecha_inicio=datetime.now(),
            estado='En Proceso'
        )
        db.session.add(servicio)
        db.session.commit()
        return servicio

@pytest.fixture
def mecanico_ejemplo(app):
    with app.app_context():
        mecanico = Mecanico(
            nombre='Juan',
            apellido='Pérez',
            especialidad='Mecánica General',
            telefono='123456789'
        )
        db.session.add(mecanico)
        db.session.commit()
        return mecanico

@pytest.fixture
def repuesto_ejemplo(app):
    with app.app_context():
        repuesto = Repuesto(
            codigo='R001',
            nombre='Aceite de Motor',
            descripcion='Aceite sintético 5W-30',
            precio=25.99,
            stock=10
        )
        db.session.add(repuesto)
        db.session.commit()
        return repuesto

def test_asignar_mecanico(client, servicio_ejemplo, mecanico_ejemplo):
    response = client.post(
        f'/api/servicios/{servicio_ejemplo.id}/asignar_mecanico',
        json={'mecanico_id': mecanico_ejemplo.id}
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data['mensaje'] == 'Mecánico asignado exitosamente'
    assert data['servicio']['mecanico'] == 'Juan Pérez'

def test_agregar_repuesto(client, servicio_ejemplo, repuesto_ejemplo):
    response = client.post(
        f'/api/servicios/{servicio_ejemplo.id}/repuestos',
        json={
            'repuesto_id': repuesto_ejemplo.id,
            'cantidad': 2
        }
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data['mensaje'] == 'Repuesto agregado exitosamente'
    assert len(data['servicio']['repuestos']) == 1
    assert data['servicio']['repuestos'][0]['nombre'] == 'Aceite de Motor'

def test_obtener_repuestos(client, servicio_ejemplo, repuesto_ejemplo):
    # Primero agregamos un repuesto
    client.post(
        f'/api/servicios/{servicio_ejemplo.id}/repuestos',
        json={
            'repuesto_id': repuesto_ejemplo.id,
            'cantidad': 2
        }
    )
    
    # Luego obtenemos la lista de repuestos
    response = client.get(f'/api/servicios/{servicio_ejemplo.id}/repuestos')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['repuestos']) == 1
    assert data['repuestos'][0]['nombre'] == 'Aceite de Motor'
    assert data['repuestos'][0]['cantidad'] == 2
    assert data['repuestos'][0]['precio_unitario'] == 25.99
    assert data['repuestos'][0]['subtotal'] == 51.98

def test_error_stock_insuficiente(client, servicio_ejemplo, repuesto_ejemplo):
    response = client.post(
        f'/api/servicios/{servicio_ejemplo.id}/repuestos',
        json={
            'repuesto_id': repuesto_ejemplo.id,
            'cantidad': 20  # Más que el stock disponible
        }
    )
    assert response.status_code == 400
    data = response.get_json()
    assert data['error'] == 'Stock insuficiente'

def test_error_mecanico_no_existe(client, servicio_ejemplo):
    response = client.post(
        f'/api/servicios/{servicio_ejemplo.id}/asignar_mecanico',
        json={'mecanico_id': 999}  # ID inexistente
    )
    assert response.status_code == 404 
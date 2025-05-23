"""
Pruebas para los endpoints de inventario
======================================
"""

import pytest
from app import create_app
from models import db, Repuesto, MovimientoInventario
from datetime import datetime

@pytest.fixture
def app():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_headers():
    # TODO: Implementar autenticación real
    return {'Authorization': 'Bearer test_token'}

@pytest.fixture
def test_repuesto():
    repuesto = Repuesto(
        codigo='TEST001',
        nombre='Repuesto de prueba',
        descripcion='Descripción de prueba',
        categoria='Prueba',
        stock=10,
        stock_minimo=5,
        precio_compra=100.0,
        precio_venta=150.0,
        estado='activo'
    )
    db.session.add(repuesto)
    db.session.commit()
    return repuesto

def test_get_repuestos(client, auth_headers, test_repuesto):
    """Prueba obtener lista de repuestos"""
    response = client.get('/api/inventario/repuestos', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert len(data['data']['items']) == 1
    assert data['data']['pagination']['total'] == 1

def test_get_repuesto(client, auth_headers, test_repuesto):
    """Prueba obtener un repuesto específico"""
    response = client.get(f'/api/inventario/repuestos/{test_repuesto.id}', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert data['data']['codigo'] == 'TEST001'
    assert data['data']['nombre'] == 'Repuesto de prueba'

def test_create_repuesto(client, auth_headers):
    """Prueba crear un nuevo repuesto"""
    data = {
        'codigo': 'TEST002',
        'nombre': 'Nuevo repuesto',
        'categoria': 'Prueba',
        'precio_compra': 200.0,
        'precio_venta': 300.0,
        'stock': 15,
        'stock_minimo': 5
    }
    response = client.post('/api/inventario/repuestos', json=data, headers=auth_headers)
    assert response.status_code == 201
    data = response.get_json()
    assert data['success'] is True
    assert data['data']['codigo'] == 'TEST002'

def test_create_repuesto_duplicate_code(client, auth_headers, test_repuesto):
    """Prueba crear repuesto con código duplicado"""
    data = {
        'codigo': 'TEST001',  # Código duplicado
        'nombre': 'Otro repuesto',
        'categoria': 'Prueba',
        'precio_compra': 200.0,
        'precio_venta': 300.0
    }
    response = client.post('/api/inventario/repuestos', json=data, headers=auth_headers)
    assert response.status_code == 400
    data = response.get_json()
    assert data['success'] is False
    assert 'código del repuesto' in data['errors'][0]

def test_update_repuesto(client, auth_headers, test_repuesto):
    """Prueba actualizar un repuesto"""
    data = {
        'nombre': 'Repuesto actualizado',
        'precio_venta': 200.0
    }
    response = client.put(f'/api/inventario/repuestos/{test_repuesto.id}', json=data, headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert data['data']['nombre'] == 'Repuesto actualizado'
    assert data['data']['precio_venta'] == 200.0

def test_delete_repuesto(client, auth_headers, test_repuesto):
    """Prueba eliminar un repuesto"""
    response = client.delete(f'/api/inventario/repuestos/{test_repuesto.id}', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    
    # Verificar que el repuesto ya no existe
    response = client.get(f'/api/inventario/repuestos/{test_repuesto.id}', headers=auth_headers)
    assert response.status_code == 404

def test_create_movimiento(client, auth_headers, test_repuesto):
    """Prueba crear un movimiento de inventario"""
    data = {
        'repuesto_id': test_repuesto.id,
        'tipo': 'entrada',
        'cantidad': 5,
        'motivo': 'Prueba de movimiento'
    }
    response = client.post('/api/inventario/movimientos', json=data, headers=auth_headers)
    assert response.status_code == 201
    data = response.get_json()
    assert data['success'] is True
    assert data['data']['movimiento']['cantidad'] == 5
    
    # Verificar que el stock se actualizó
    response = client.get(f'/api/inventario/repuestos/{test_repuesto.id}', headers=auth_headers)
    assert response.get_json()['data']['stock_actual'] == 15  # 10 + 5

def test_create_movimiento_stock_insuficiente(client, auth_headers, test_repuesto):
    """Prueba crear un movimiento de salida con stock insuficiente"""
    data = {
        'repuesto_id': test_repuesto.id,
        'tipo': 'salida',
        'cantidad': 20,  # Más que el stock disponible
        'motivo': 'Prueba de movimiento'
    }
    response = client.post('/api/inventario/movimientos', json=data, headers=auth_headers)
    assert response.status_code == 400
    data = response.get_json()
    assert data['success'] is False
    assert 'Stock insuficiente' in data['errors'][0]

def test_get_movimientos_repuesto(client, auth_headers, test_repuesto):
    """Prueba obtener movimientos de un repuesto"""
    # Crear algunos movimientos
    movimiento1 = MovimientoInventario(
        repuesto_id=test_repuesto.id,
        tipo='entrada',
        cantidad=5,
        fecha=datetime.utcnow(),
        motivo='Prueba 1'
    )
    movimiento2 = MovimientoInventario(
        repuesto_id=test_repuesto.id,
        tipo='salida',
        cantidad=2,
        fecha=datetime.utcnow(),
        motivo='Prueba 2'
    )
    db.session.add_all([movimiento1, movimiento2])
    db.session.commit()
    
    response = client.get(f'/api/inventario/repuestos/{test_repuesto.id}/movimientos', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert len(data['data']['movimientos']) == 2 
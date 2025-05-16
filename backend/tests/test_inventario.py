import pytest
from app import create_app
from models import db, Repuesto, Proveedor, MovimientoInventario
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
def proveedor_ejemplo(app):
    with app.app_context():
        proveedor = Proveedor(
            nombre="Proveedor Test",
            contacto="Contacto Test",
            telefono="1234567890",
            email="test@example.com",
            direccion="Dirección Test",
            estado="activo"
        )
        db.session.add(proveedor)
        db.session.commit()
        return proveedor

@pytest.fixture
def repuesto_ejemplo(app, proveedor_ejemplo):
    with app.app_context():
        repuesto = Repuesto(
            codigo="TEST001",
            nombre="Repuesto Test",
            descripcion="Descripción Test",
            precio_compra=100.0,
            precio_venta=150.0,
            stock=10,
            stock_minimo=5,
            proveedor_id=proveedor_ejemplo.id,
            estado="activo"
        )
        db.session.add(repuesto)
        db.session.commit()
        return repuesto

# ========== PRUEBAS DE PROVEEDORES ==========

def test_crear_proveedor(client):
    """Prueba la creación de un proveedor"""
    data = {
        "nombre": "Nuevo Proveedor",
        "contacto": "Nuevo Contacto",
        "telefono": "9876543210",
        "email": "nuevo@example.com",
        "direccion": "Nueva Dirección"
    }
    
    response = client.post('/proveedores', json=data)
    assert response.status_code == 201
    assert "proveedor" in response.json
    assert response.json["proveedor"]["nombre"] == data["nombre"]

def test_crear_proveedor_duplicado(client, proveedor_ejemplo):
    """Prueba la creación de un proveedor con nombre duplicado"""
    data = {
        "nombre": proveedor_ejemplo.nombre,
        "contacto": "Otro Contacto",
        "telefono": "1234567890"
    }
    
    response = client.post('/proveedores', json=data)
    assert response.status_code == 400
    assert "error" in response.json

def test_actualizar_proveedor(client, proveedor_ejemplo):
    """Prueba la actualización de un proveedor"""
    data = {
        "nombre": "Proveedor Actualizado",
        "telefono": "9999999999"
    }
    
    response = client.put(f'/proveedores/{proveedor_ejemplo.id}', json=data)
    assert response.status_code == 200
    assert response.json["proveedor"]["nombre"] == data["nombre"]

# ========== PRUEBAS DE REPUESTOS ==========

def test_crear_repuesto(client, proveedor_ejemplo):
    """Prueba la creación de un repuesto"""
    data = {
        "codigo": "REP001",
        "nombre": "Nuevo Repuesto",
        "precio_compra": 100.0,
        "precio_venta": 150.0,
        "proveedor_id": proveedor_ejemplo.id
    }
    
    response = client.post('/repuestos', json=data)
    assert response.status_code == 201
    assert "repuesto" in response.json
    assert response.json["repuesto"]["codigo"] == data["codigo"]

def test_crear_repuesto_codigo_duplicado(client, repuesto_ejemplo):
    """Prueba la creación de un repuesto con código duplicado"""
    data = {
        "codigo": repuesto_ejemplo.codigo,
        "nombre": "Otro Repuesto",
        "precio_compra": 100.0,
        "precio_venta": 150.0
    }
    
    response = client.post('/repuestos', json=data)
    assert response.status_code == 400
    assert "error" in response.json

def test_actualizar_repuesto(client, repuesto_ejemplo):
    """Prueba la actualización de un repuesto"""
    data = {
        "nombre": "Repuesto Actualizado",
        "precio_venta": 200.0
    }
    
    response = client.put(f'/repuestos/{repuesto_ejemplo.id}', json=data)
    assert response.status_code == 200
    assert response.json["repuesto"]["nombre"] == data["nombre"]

# ========== PRUEBAS DE MOVIMIENTOS ==========

def test_crear_movimiento_entrada(client, repuesto_ejemplo):
    """Prueba la creación de un movimiento de entrada"""
    data = {
        "repuesto_id": repuesto_ejemplo.id,
        "cantidad": 5,
        "tipo": "entrada",
        "notas": "Prueba de entrada"
    }
    
    response = client.post('/movimientos', json=data)
    assert response.status_code == 201
    assert "movimiento" in response.json
    
    # Verificar que el stock se actualizó
    repuesto = Repuesto.query.get(repuesto_ejemplo.id)
    assert repuesto.stock == 15  # 10 inicial + 5 entrada

def test_crear_movimiento_salida(client, repuesto_ejemplo):
    """Prueba la creación de un movimiento de salida"""
    data = {
        "repuesto_id": repuesto_ejemplo.id,
        "cantidad": 3,
        "tipo": "salida",
        "notas": "Prueba de salida"
    }
    
    response = client.post('/movimientos', json=data)
    assert response.status_code == 201
    assert "movimiento" in response.json
    
    # Verificar que el stock se actualizó
    repuesto = Repuesto.query.get(repuesto_ejemplo.id)
    assert repuesto.stock == 7  # 10 inicial - 3 salida

def test_crear_movimiento_salida_sin_stock(client, repuesto_ejemplo):
    """Prueba la creación de un movimiento de salida sin stock suficiente"""
    data = {
        "repuesto_id": repuesto_ejemplo.id,
        "cantidad": 20,  # Más que el stock disponible
        "tipo": "salida",
        "notas": "Prueba de salida sin stock"
    }
    
    response = client.post('/movimientos', json=data)
    assert response.status_code == 400
    assert "error" in response.json

# ========== PRUEBAS DE ALERTAS Y REPORTES ==========

def test_alertas_stock_bajo(client, repuesto_ejemplo):
    """Prueba la obtención de alertas de stock bajo"""
    # Modificar el stock para que esté bajo el mínimo
    repuesto_ejemplo.stock = 2  # stock_minimo es 5
    db.session.commit()
    
    response = client.get('/alertas/stock-bajo')
    assert response.status_code == 200
    assert "alertas" in response.json
    assert len(response.json["alertas"]) > 0
    assert response.json["alertas"][0]["id"] == repuesto_ejemplo.id

def test_valor_inventario(client, repuesto_ejemplo):
    """Prueba el reporte de valor de inventario"""
    response = client.get('/reportes/valor-inventario')
    assert response.status_code == 200
    assert "valor_total_compra" in response.json
    assert "valor_total_venta" in response.json
    assert "margen_bruto" in response.json

# ========== PRUEBAS DE SINCRONIZACIÓN ==========

def test_sincronizar_proveedor(client, proveedor_ejemplo):
    """Prueba la sincronización de repuestos con un proveedor"""
    data = {
        "repuestos": [
            {
                "codigo": "SYNC001",
                "nombre": "Repuesto Sincronizado",
                "precio_compra": 100.0,
                "precio_venta": 150.0
            }
        ]
    }
    
    response = client.post(f'/proveedores/{proveedor_ejemplo.id}/sincronizar', json=data)
    assert response.status_code == 200
    assert "resultados" in response.json
    assert response.json["resultados"]["creados"] == 1

# ========== PRUEBAS AVANZADAS DE INTEGRACIÓN ==========

def test_flujo_completo_inventario(client, proveedor_ejemplo):
    """Prueba un flujo completo de operaciones de inventario"""
    # 1. Crear repuesto
    repuesto_data = {
        "codigo": "FLOW001",
        "nombre": "Repuesto Flujo",
        "precio_compra": 100.0,
        "precio_venta": 150.0,
        "proveedor_id": proveedor_ejemplo.id,
        "stock_minimo": 5
    }
    response = client.post('/repuestos', json=repuesto_data)
    assert response.status_code == 201
    repuesto_id = response.json["repuesto"]["id"]
    
    # 2. Realizar entrada de stock
    entrada_data = {
        "repuesto_id": repuesto_id,
        "cantidad": 10,
        "tipo": "entrada",
        "notas": "Stock inicial"
    }
    response = client.post('/movimientos', json=entrada_data)
    assert response.status_code == 201
    
    # 3. Verificar alertas (no debería haber)
    response = client.get('/alertas/stock-bajo')
    assert response.status_code == 200
    assert len(response.json["alertas"]) == 0
    
    # 4. Realizar salida de stock
    salida_data = {
        "repuesto_id": repuesto_id,
        "cantidad": 7,
        "tipo": "salida",
        "notas": "Venta"
    }
    response = client.post('/movimientos', json=salida_data)
    assert response.status_code == 201
    
    # 5. Verificar alertas (debería aparecer)
    response = client.get('/alertas/stock-bajo')
    assert response.status_code == 200
    assert len(response.json["alertas"]) == 1
    assert response.json["alertas"][0]["id"] == repuesto_id

def test_movimientos_batch_atomicos(client, repuesto_ejemplo):
    """Prueba la atomicidad de movimientos en lote"""
    # Crear lista de movimientos
    movimientos = [
        {
            "repuesto_id": repuesto_ejemplo.id,
            "cantidad": 5,
            "tipo": "entrada",
            "notas": "Entrada 1"
        },
        {
            "repuesto_id": repuesto_ejemplo.id,
            "cantidad": 3,
            "tipo": "salida",
            "notas": "Salida 1"
        },
        {
            "repuesto_id": repuesto_ejemplo.id,
            "cantidad": 20,  # Este movimiento debería fallar
            "tipo": "salida",
            "notas": "Salida 2"
        }
    ]
    
    # Intentar procesar todos los movimientos
    response = client.post('/movimientos/batch', json=movimientos)
    assert response.status_code == 200
    
    # Verificar resultados
    resultados = response.json["resultados"]
    assert resultados["exitosos"] == 2
    assert resultados["fallidos"] == 1
    
    # Verificar que el stock final es correcto (10 + 5 - 3 = 12)
    repuesto = Repuesto.query.get(repuesto_ejemplo.id)
    assert repuesto.stock == 12

def test_sincronizacion_con_actualizacion_precios(client, proveedor_ejemplo):
    """Prueba la sincronización con actualización de precios"""
    # 1. Crear repuesto inicial
    repuesto_data = {
        "codigo": "SYNC002",
        "nombre": "Repuesto Sinc",
        "precio_compra": 100.0,
        "precio_venta": 150.0,
        "proveedor_id": proveedor_ejemplo.id
    }
    response = client.post('/repuestos', json=repuesto_data)
    assert response.status_code == 201
    
    # 2. Sincronizar con nuevos precios
    sync_data = {
        "repuestos": [
            {
                "codigo": "SYNC002",
                "nombre": "Repuesto Sinc",
                "precio_compra": 120.0,  # Precio actualizado
                "precio_venta": 180.0    # Precio actualizado
            }
        ]
    }
    response = client.post(f'/proveedores/{proveedor_ejemplo.id}/sincronizar', json=sync_data)
    assert response.status_code == 200
    assert response.json["resultados"]["actualizados"] == 1
    
    # 3. Verificar precios actualizados
    repuesto = Repuesto.query.filter_by(codigo="SYNC002").first()
    assert repuesto.precio_compra == 120.0
    assert repuesto.precio_venta == 180.0

def test_validaciones_avanzadas_repuesto(client, proveedor_ejemplo):
    """Prueba validaciones avanzadas de repuestos"""
    casos_prueba = [
        {
            "data": {
                "codigo": "TEST001",
                "nombre": "Repuesto Test",
                "precio_compra": -100.0,  # Precio negativo
                "precio_venta": 150.0
            },
            "error_esperado": "El precio de compra no puede ser negativo"
        },
        {
            "data": {
                "codigo": "TEST002",
                "nombre": "Repuesto Test",
                "precio_compra": 200.0,
                "precio_venta": 100.0  # Precio venta menor que compra
            },
            "error_esperado": "El precio de venta no puede ser menor al precio de compra"
        },
        {
            "data": {
                "codigo": "TEST003",
                "nombre": "Repuesto Test",
                "precio_compra": 100.0,
                "precio_venta": 150.0,
                "stock": -5  # Stock negativo
            },
            "error_esperado": "El stock no puede ser negativo"
        }
    ]
    
    for caso in casos_prueba:
        response = client.post('/repuestos', json=caso["data"])
        assert response.status_code == 400
        assert caso["error_esperado"] in str(response.json["error"])

def test_reportes_avanzados(client, repuesto_ejemplo):
    """Prueba reportes avanzados de inventario"""
    # 1. Crear varios movimientos
    movimientos = [
        {"cantidad": 10, "tipo": "entrada"},
        {"cantidad": 3, "tipo": "salida"},
        {"cantidad": 5, "tipo": "entrada"}
    ]
    
    for mov in movimientos:
        data = {
            "repuesto_id": repuesto_ejemplo.id,
            "cantidad": mov["cantidad"],
            "tipo": mov["tipo"],
            "notas": f"Movimiento {mov['tipo']}"
        }
        client.post('/movimientos', json=data)
    
    # 2. Obtener reporte de movimientos
    response = client.get('/reportes/movimientos')
    assert response.status_code == 200
    movimientos = response.json["movimientos"]
    
    # Verificar orden cronológico
    fechas = [m["fecha"] for m in movimientos]
    assert fechas == sorted(fechas, reverse=True)
    
    # 3. Verificar valor de inventario
    response = client.get('/reportes/valor-inventario')
    assert response.status_code == 200
    valor = response.json
    
    # Calcular valores esperados
    stock_final = 10 + 10 - 3 + 5  # Stock inicial + entradas - salidas
    valor_compra_esperado = stock_final * repuesto_ejemplo.precio_compra
    valor_venta_esperado = stock_final * repuesto_ejemplo.precio_venta
    
    assert valor["valor_total_compra"] == valor_compra_esperado
    assert valor["valor_total_venta"] == valor_venta_esperado
    assert valor["margen_bruto"] == valor_venta_esperado - valor_compra_esperado 
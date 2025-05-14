from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from models import Cliente, Vehiculo, Servicio, Factura, Repuesto, Usuario
from extensions import db
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
import random
from models.inventario import MovimientoInventario

test_data_bp = Blueprint('test_data', __name__)

@test_data_bp.route('/api/create-admin', methods=['POST'])
def create_admin():
    try:
        # Verificar si ya existe un administrador
        admin = Usuario.query.filter_by(email='admin@automanager.com').first()
        if admin:
            return jsonify({'message': 'El usuario administrador ya existe'}), 200

        # Crear usuario administrador
        admin = Usuario(
            nombre='Administrador',
            apellido='Sistema',
            email='admin@automanager.com',
            password=generate_password_hash('admin123'),
            rol='administrador'
        )
        db.session.add(admin)
        db.session.commit()

        return jsonify({
            'message': 'Usuario administrador creado correctamente',
            'credentials': {
                'email': 'admin@automanager.com',
                'password': 'admin123'
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@test_data_bp.route('/api/test-data', methods=['POST'])
@jwt_required()
def create_test_data():
    try:
        # Crear usuario administrador por defecto
        admin = Usuario.query.filter_by(email='admin@automanager.com').first()
        if not admin:
            admin = Usuario(
                nombre='Administrador',
                apellido='Sistema',
                email='admin@automanager.com',
                password=generate_password_hash('admin123'),
                rol='administrador'
            )
            db.session.add(admin)
            db.session.commit()

        # Crear clientes de prueba
        clientes = [
            Cliente(
                nombre="Juan",
                apellido="Pérez",
                email="juan@example.com",
                telefono="123456789",
                direccion="Calle Principal 123"
            ),
            Cliente(
                nombre="María",
                apellido="García",
                email="maria@example.com",
                telefono="987654321",
                direccion="Avenida Central 456"
            )
        ]
        db.session.add_all(clientes)
        db.session.commit()

        # Crear vehículos de prueba
        vehiculos = [
            Vehiculo(
                marca="Toyota",
                modelo="Corolla",
                año=2020,
                placa="ABC123",
                cliente_id=clientes[0].id
            ),
            Vehiculo(
                marca="Honda",
                modelo="Civic",
                año=2021,
                placa="XYZ789",
                cliente_id=clientes[1].id
            )
        ]
        db.session.add_all(vehiculos)
        db.session.commit()

        # Crear servicios de prueba
        estados_servicio = ['Pendiente', 'En Proceso', 'Completado']
        servicios = [
            Servicio(
                tipo_servicio="Mantenimiento",
                descripcion="Cambio de aceite y filtros",
                estado=random.choice(estados_servicio),
                fecha_inicio=datetime.now() - timedelta(days=random.randint(1, 30)),
                vehiculo_id=vehiculos[0].id
            ),
            Servicio(
                tipo_servicio="Reparación",
                descripcion="Cambio de frenos",
                estado=random.choice(estados_servicio),
                fecha_inicio=datetime.now() - timedelta(days=random.randint(1, 30)),
                vehiculo_id=vehiculos[1].id
            )
        ]
        db.session.add_all(servicios)
        db.session.commit()

        # Crear facturas de prueba
        estados_factura = ['Pendiente', 'Pagada', 'Anulada']
        facturas = [
            Factura(
                numero="F001",
                fecha_emision=datetime.now() - timedelta(days=random.randint(1, 30)),
                total=random.randint(100, 1000),
                estado=random.choice(estados_factura),
                cliente_id=clientes[0].id,
                subtotal=random.randint(100, 1000),
                impuestos=random.randint(10, 100)
            ),
            Factura(
                numero="F002",
                fecha_emision=datetime.now() - timedelta(days=random.randint(1, 30)),
                total=random.randint(100, 1000),
                estado=random.choice(estados_factura),
                cliente_id=clientes[1].id,
                subtotal=random.randint(100, 1000),
                impuestos=random.randint(10, 100)
            )
        ]
        db.session.add_all(facturas)
        db.session.commit()

        # Crear repuestos de prueba
        repuestos = [
            {
                'codigo': 'R001',
                'nombre': 'Filtro de Aceite',
                'descripcion': 'Filtro de aceite para motor',
                'marca': 'Bosch',
                'modelo': '0986AF0062',
                'stock': 20,
                'stock_minimo': 5,
                'precio_compra': 15.99,
                'precio_venta': 25.99,
                'categoria': 'Filtros',
                'ubicacion': 'Estante A1'
            },
            {
                'codigo': 'R002',
                'nombre': 'Pastillas de Freno',
                'descripcion': 'Pastillas de freno delanteras',
                'marca': 'Brembo',
                'modelo': 'P85077',
                'stock': 10,
                'stock_minimo': 3,
                'precio_compra': 45.99,
                'precio_venta': 75.99,
                'categoria': 'Frenos',
                'ubicacion': 'Estante B2'
            },
            {
                'codigo': 'R003',
                'nombre': 'Aceite de Motor',
                'descripcion': 'Aceite sintético 5W-30',
                'marca': 'Mobil',
                'modelo': '1L',
                'stock': 30,
                'stock_minimo': 10,
                'precio_compra': 8.99,
                'precio_venta': 14.99,
                'categoria': 'Lubricantes',
                'ubicacion': 'Estante C3'
            },
            {
                'codigo': 'R004',
                'nombre': 'Bujía',
                'descripcion': 'Bujía de encendido',
                'marca': 'NGK',
                'modelo': 'BKR6E',
                'stock': 15,
                'stock_minimo': 5,
                'precio_compra': 4.99,
                'precio_venta': 8.99,
                'categoria': 'Encendido',
                'ubicacion': 'Estante D4'
            },
            {
                'codigo': 'R005',
                'nombre': 'Filtro de Aire',
                'descripcion': 'Filtro de aire para motor',
                'marca': 'Mann',
                'modelo': 'C 25 010',
                'stock': 8,
                'stock_minimo': 3,
                'precio_compra': 12.99,
                'precio_venta': 19.99,
                'categoria': 'Filtros',
                'ubicacion': 'Estante A2'
            }
        ]

        for repuesto_data in repuestos:
            repuesto = Repuesto(**repuesto_data)
            db.session.add(repuesto)
        
        db.session.commit()

        # Crear algunos movimientos de inventario
        repuestos = Repuesto.query.all()
        usuarios = Usuario.query.all()
        servicios = Servicio.query.all()

        for _ in range(20):
            repuesto = random.choice(repuestos)
            usuario = random.choice(usuarios)
            servicio = random.choice(servicios) if random.random() > 0.5 else None
            
            movimiento = MovimientoInventario(
                repuesto_id=repuesto.id,
                tipo=random.choice(['entrada', 'salida']),
                cantidad=random.randint(1, 5),
                fecha=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
                motivo=f"Movimiento de prueba {random.randint(1, 100)}",
                usuario_id=usuario.id,
                servicio_id=servicio.id if servicio else None
            )
            
            db.session.add(movimiento)
        
        db.session.commit()

        return jsonify({'message': 'Datos de prueba creados correctamente'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500 
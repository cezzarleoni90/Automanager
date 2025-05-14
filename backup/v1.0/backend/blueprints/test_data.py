from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from models import Cliente, Vehiculo, Servicio, Factura, Repuesto, Usuario
from extensions import db
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
import random

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
            Repuesto(
                nombre="Filtro de aceite",
                codigo="FA001",
                descripcion="Filtro de aceite para Toyota Corolla",
                stock=5,
                stock_minimo=10,
                precio=15.99
            ),
            Repuesto(
                nombre="Pastillas de freno",
                codigo="PF001",
                descripcion="Pastillas de freno para Honda Civic",
                stock=3,
                stock_minimo=5,
                precio=45.99
            )
        ]
        db.session.add_all(repuestos)
        db.session.commit()

        return jsonify({'message': 'Datos de prueba creados correctamente'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500 
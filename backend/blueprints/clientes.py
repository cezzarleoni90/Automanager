from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models import Cliente, Vehiculo, Servicio, Factura
from datetime import datetime, timezone
from sqlalchemy import or_

bp = Blueprint('clientes', __name__)

@bp.route('/', methods=['GET'])
@jwt_required()
def listar_clientes():
    try:
        # Obtener parámetros de filtrado
        estado = request.args.get('estado')
        busqueda = request.args.get('q')
        
        # Construir query base
        query = Cliente.query
        
        # Aplicar filtros
        if estado:
            query = query.filter_by(estado=estado)
        if busqueda:
            query = query.filter(
                or_(
                    Cliente.nombre.ilike(f'%{busqueda}%'),
                    Cliente.apellido.ilike(f'%{busqueda}%'),
                    Cliente.email.ilike(f'%{busqueda}%'),
                    Cliente.telefono.ilike(f'%{busqueda}%')
                )
            )
        
        clientes = query.order_by(Cliente.apellido, Cliente.nombre).all()
        
        return jsonify({
            'clientes': [{
                'id': c.id,
                'nombre': c.nombre,
                'apellido': c.apellido,
                'email': c.email,
                'telefono': c.telefono,
                'direccion': c.direccion,
                'estado': c.estado,
                'vehiculos': [{
                    'id': v.id,
                    'placa': v.placa,
                    'marca': v.marca,
                    'modelo': v.modelo,
                    'año': v.año,
                    'color': v.color
                } for v in c.vehiculos],
                'servicios': sum(len(v.servicios) for v in c.vehiculos)
            } for c in clientes]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_cliente(id):
    try:
        cliente = Cliente.query.get_or_404(id)
        return jsonify({
            'id': cliente.id,
            'nombre': cliente.nombre,
            'apellido': cliente.apellido,
            'email': cliente.email,
            'telefono': cliente.telefono,
            'direccion': cliente.direccion
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/', methods=['POST'])
@jwt_required()
def create_cliente():
    try:
        data = request.get_json()
        nuevo_cliente = Cliente(
            nombre=data['nombre'],
            apellido=data['apellido'],
            email=data['email'],
            telefono=data['telefono'],
            direccion=data['direccion']
        )
        db.session.add(nuevo_cliente)
        db.session.commit()
        return jsonify({'message': 'Cliente creado exitosamente', 'id': nuevo_cliente.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_cliente(id):
    try:
        cliente = Cliente.query.get_or_404(id)
        data = request.get_json()
        
        cliente.nombre = data.get('nombre', cliente.nombre)
        cliente.apellido = data.get('apellido', cliente.apellido)
        cliente.email = data.get('email', cliente.email)
        cliente.telefono = data.get('telefono', cliente.telefono)
        cliente.direccion = data.get('direccion', cliente.direccion)
        
        db.session.commit()
        return jsonify({'message': 'Cliente actualizado exitosamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_cliente(id):
    try:
        cliente = Cliente.query.get_or_404(id)
        db.session.delete(cliente)
        db.session.commit()
        return jsonify({'message': 'Cliente eliminado exitosamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Obtener cliente por ID
@bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def obtener_cliente(id):
    try:
        cliente = Cliente.query.get_or_404(id)
        
        return jsonify({
            'id': cliente.id,
            'nombre': cliente.nombre,
            'apellido': cliente.apellido,
            'email': cliente.email,
            'telefono': cliente.telefono,
            'direccion': cliente.direccion,
            'estado': cliente.estado,
            'vehiculos': [{
                'id': v.id,
                'placa': v.placa,
                'marca': v.marca,
                'modelo': v.modelo,
                'año': v.año,
                'servicios': len(v.servicios)
            } for v in cliente.vehiculos],
            'servicios': [{
                'id': s.id,
                'tipo': s.tipo_servicio,
                'fecha_inicio': s.fecha_inicio.isoformat(),
                'fecha_fin': s.fecha_fin.isoformat() if s.fecha_fin else None,
                'estado': s.estado,
                'vehiculo': s.vehiculo.placa
            } for s in Servicio.query.join(Vehiculo).filter(Vehiculo.cliente_id == id).order_by(Servicio.fecha_inicio.desc()).all()]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Obtener vehículos de un cliente
@bp.route('/<int:id>/vehiculos', methods=['GET'])
@jwt_required()
def listar_vehiculos_cliente(id):
    try:
        cliente = Cliente.query.get_or_404(id)
        
        return jsonify({
            'cliente': {
                'id': cliente.id,
                'nombre': f"{cliente.nombre} {cliente.apellido}"
            },
            'vehiculos': [{
                'id': v.id,
                'placa': v.placa,
                'marca': v.marca,
                'modelo': v.modelo,
                'año': v.año,
                'color': v.color,
                'estado': v.estado,
                'servicios': [{
                    'id': s.id,
                    'tipo': s.tipo_servicio,
                    'fecha_inicio': s.fecha_inicio.isoformat(),
                    'fecha_fin': s.fecha_fin.isoformat() if s.fecha_fin else None,
                    'estado': s.estado
                } for s in v.servicios]
            } for v in cliente.vehiculos]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Agregar vehículo a cliente
@bp.route('/<int:id>/vehiculos', methods=['POST'])
@jwt_required()
def agregar_vehiculo(id):
    try:
        cliente = Cliente.query.get_or_404(id)
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['placa', 'marca', 'modelo', 'año']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Campo {field} es requerido y no puede estar vacío'}), 400
        
        # Validar que el año sea un número válido
        try:
            año = int(data['año'])
            if año <= 0:
                return jsonify({'error': 'El año debe ser un número positivo'}), 400
        except ValueError:
            return jsonify({'error': 'El año debe ser un número válido'}), 400
        
        # Verificar si la placa ya existe
        if Vehiculo.query.filter_by(placa=data['placa']).first():
            return jsonify({'error': 'La placa ya está registrada'}), 400
        
        # Crear nuevo vehículo
        nuevo_vehiculo = Vehiculo(
            cliente_id=cliente.id,
            placa=data['placa'],
            marca=data['marca'],
            modelo=data['modelo'],
            año=año,
            color=data.get('color', ''),
            kilometraje=data.get('kilometraje'),
            tipo_combustible=data.get('tipo_combustible'),
            transmision=data.get('transmision'),
            vin=data.get('vin')
        )
        
        db.session.add(nuevo_vehiculo)
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Vehículo agregado exitosamente',
            'vehiculo': {
                'id': nuevo_vehiculo.id,
                'placa': nuevo_vehiculo.placa,
                'marca': nuevo_vehiculo.marca,
                'modelo': nuevo_vehiculo.modelo,
                'año': nuevo_vehiculo.año,
                'color': nuevo_vehiculo.color,
                'cliente': f"{cliente.nombre} {cliente.apellido}"
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Rutas para Vehículos
@bp.route('/vehiculos', methods=['GET'])
@jwt_required()
def get_vehiculos():
    try:
        vehiculos = Vehiculo.query.all()
        return jsonify([{
            'id': v.id,
            'marca': v.marca,
            'modelo': v.modelo,
            'año': v.año,
            'placa': v.placa,
            'cliente_id': v.cliente_id,
            'cliente_nombre': v.cliente.nombre if v.cliente else None,
            'servicios': [{
                'id': s.id,
                'descripcion': s.descripcion,
                'fecha': s.fecha.isoformat(),
                'estado': s.estado
            } for s in v.servicios]
        } for v in vehiculos]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/vehiculos/<int:id>', methods=['GET'])
@jwt_required()
def get_vehiculo(id):
    try:
        vehiculo = Vehiculo.query.get_or_404(id)
        return jsonify({
            'id': vehiculo.id,
            'marca': vehiculo.marca,
            'modelo': vehiculo.modelo,
            'año': vehiculo.año,
            'placa': vehiculo.placa,
            'cliente_id': vehiculo.cliente_id,
            'cliente_nombre': vehiculo.cliente.nombre if vehiculo.cliente else None,
            'servicios': [{
                'id': s.id,
                'descripcion': s.descripcion,
                'fecha': s.fecha.isoformat(),
                'estado': s.estado,
                'mecanico': {
                    'id': s.mecanico.id,
                    'nombre': s.mecanico.nombre
                } if s.mecanico else None
            } for s in vehiculo.servicios],
            'facturas': [{
                'id': f.id,
                'numero': f.numero,
                'fecha': f.fecha.isoformat(),
                'total': f.total
            } for f in vehiculo.facturas]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/vehiculos/<int:id>', methods=['PUT'])
@jwt_required()
def update_vehiculo(id):
    try:
        vehiculo = Vehiculo.query.get_or_404(id)
        data = request.get_json()
        
        # Verificar si se está cambiando la placa
        if 'placa' in data and data['placa'] != vehiculo.placa:
            if Vehiculo.query.filter_by(placa=data['placa']).first():
                return jsonify({"error": "Ya existe un vehículo con esta placa"}), 400
        
        vehiculo.marca = data.get('marca', vehiculo.marca)
        vehiculo.modelo = data.get('modelo', vehiculo.modelo)
        vehiculo.año = data.get('año', vehiculo.año)
        vehiculo.placa = data.get('placa', vehiculo.placa)
        
        db.session.commit()
        return jsonify({"mensaje": "Vehículo actualizado exitosamente"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@bp.route('/vehiculos/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_vehiculo(id):
    try:
        vehiculo = Vehiculo.query.get_or_404(id)
        
        # Verificar si tiene servicios o facturas asociadas
        if vehiculo.servicios or vehiculo.facturas:
            return jsonify({"error": "No se puede eliminar un vehículo con servicios o facturas asociadas"}), 400
            
        db.session.delete(vehiculo)
        db.session.commit()
        return jsonify({"mensaje": "Vehículo eliminado exitosamente"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@bp.route('/vehiculos/cliente/<int:cliente_id>', methods=['GET'])
@jwt_required()
def get_vehiculos_cliente(cliente_id):
    try:
        vehiculos = Vehiculo.query.filter_by(cliente_id=cliente_id).all()
        return jsonify([{
            'id': v.id,
            'marca': v.marca,
            'modelo': v.modelo,
            'año': v.año,
            'placa': v.placa,
            'servicios': [{
                'id': s.id,
                'descripcion': s.descripcion,
                'fecha': s.fecha.isoformat(),
                'estado': s.estado
            } for s in v.servicios]
        } for v in vehiculos]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500 
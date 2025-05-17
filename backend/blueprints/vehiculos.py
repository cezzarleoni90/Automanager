from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from backend.models import Vehiculo, Cliente, Servicio, db
from datetime import datetime
from sqlalchemy import or_

bp = Blueprint('vehiculos', __name__)

@bp.route('/', methods=['GET'])
@jwt_required()
def get_vehiculos():
    try:
        vehiculos = Vehiculo.query.all()
        return jsonify({
            'vehiculos': [{
                'id': v.id,
                'placa': v.placa,
                'marca': v.marca,
                'modelo': v.modelo,
                'año': v.año,
                'color': v.color,
                'kilometraje': v.kilometraje,
                'cliente_id': v.cliente_id,
                'cliente': {
                    'id': v.cliente.id,
                    'nombre': v.cliente.nombre,
                    'apellido': v.cliente.apellido,
                    'email': v.cliente.email,
                    'telefono': v.cliente.telefono
                } if v.cliente else None,
                'servicios_recientes': [{
                    'id': s.id,
                    'tipo_servicio': s.tipo_servicio,
                    'descripcion': s.descripcion,
                    'fecha_inicio': s.fecha_inicio.isoformat() if s.fecha_inicio else None,
                    'fecha_fin': s.fecha_fin.isoformat() if s.fecha_fin else None,
                    'estado': s.estado,
                    'mecanico': {
                        'id': s.mecanico.id,
                        'nombre': f"{s.mecanico.nombre} {s.mecanico.apellido}"
                    } if s.mecanico else None
                } for s in sorted(v.servicios, key=lambda x: x.fecha_inicio or datetime.min, reverse=True)[:5]]
            } for v in vehiculos]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/', methods=['POST'])
@jwt_required()
def create_vehiculo():
    try:
        data = request.get_json()
        
        # Validar campos requeridos
        required_fields = ['placa', 'marca', 'modelo', 'año', 'cliente_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'El campo {field} es requerido'}), 400
        
        # Verificar si el cliente existe
        cliente = Cliente.query.get(data['cliente_id'])
        if not cliente:
            return jsonify({'error': 'Cliente no encontrado'}), 404
            
        # Verificar si la placa ya existe
        if Vehiculo.query.filter_by(placa=data['placa']).first():
            return jsonify({'error': 'Ya existe un vehículo con esta placa'}), 400
            
        nuevo_vehiculo = Vehiculo(
            placa=data['placa'],
            marca=data['marca'],
            modelo=data['modelo'],
            año=data['año'],
            color=data.get('color'),
            kilometraje=data.get('kilometraje'),
            cliente_id=data['cliente_id'],
            tipo_combustible=data.get('tipo_combustible'),
            transmision=data.get('transmision'),
            vin=data.get('vin')
        )
        
        db.session.add(nuevo_vehiculo)
        db.session.commit()
        
        return jsonify({
            'message': 'Vehículo creado exitosamente',
            'vehiculo': {
                'id': nuevo_vehiculo.id,
                'placa': nuevo_vehiculo.placa,
                'marca': nuevo_vehiculo.marca,
                'modelo': nuevo_vehiculo.modelo,
                'año': nuevo_vehiculo.año,
                'color': nuevo_vehiculo.color,
                'kilometraje': nuevo_vehiculo.kilometraje,
                'cliente_id': nuevo_vehiculo.cliente_id
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_vehiculo(id):
    try:
        vehiculo = Vehiculo.query.get_or_404(id)
        data = request.get_json()
        
        vehiculo.placa = data.get('placa', vehiculo.placa)
        vehiculo.marca = data.get('marca', vehiculo.marca)
        vehiculo.modelo = data.get('modelo', vehiculo.modelo)
        vehiculo.año = data.get('año', vehiculo.año)
        vehiculo.color = data.get('color', vehiculo.color)
        vehiculo.kilometraje = data.get('kilometraje', vehiculo.kilometraje)
        vehiculo.cliente_id = data.get('cliente_id', vehiculo.cliente_id)
        
        db.session.commit()
        return jsonify({'message': 'Vehículo actualizado exitosamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_vehiculo(id):
    try:
        vehiculo = Vehiculo.query.get_or_404(id)
        db.session.delete(vehiculo)
        db.session.commit()
        return jsonify({'message': 'Vehículo eliminado exitosamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Obtener vehículo por ID
@bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def obtener_vehiculo(id):
    try:
        vehiculo = Vehiculo.query.get_or_404(id)
        
        # Obtener servicios recientes
        servicios = Servicio.query.filter_by(vehiculo_id=id).order_by(Servicio.fecha_inicio.desc()).limit(10).all()
        
        return jsonify({
            'id': vehiculo.id,
            'placa': vehiculo.placa,
            'marca': vehiculo.marca,
            'modelo': vehiculo.modelo,
            'año': vehiculo.año,
            'color': vehiculo.color,
            'kilometraje': vehiculo.kilometraje,
            'cliente_id': vehiculo.cliente_id,
            'cliente': {
                'id': vehiculo.cliente.id,
                'nombre': vehiculo.cliente.nombre,
                'apellido': vehiculo.cliente.apellido,
                'email': vehiculo.cliente.email,
                'telefono': vehiculo.cliente.telefono
            } if vehiculo.cliente else None,
            'servicios_recientes': [{
                'id': s.id,
                'tipo': s.tipo_servicio,
                'descripcion': s.descripcion,
                'fecha_inicio': s.fecha_inicio.isoformat() if s.fecha_inicio else None,
                'fecha_fin': s.fecha_fin.isoformat() if s.fecha_fin else None,
                'estado': s.estado,
                'mecanico': {
                    'id': s.mecanico.id,
                    'nombre': f"{s.mecanico.nombre} {s.mecanico.apellido}"
                } if s.mecanico else None
            } for s in servicios],
            'estadisticas': {
                'total_servicios': len([s for s in vehiculo.servicios]),
                'servicios_pendientes': len([s for s in vehiculo.servicios if s.estado == 'pendiente']),
                'servicios_completados': len([s for s in vehiculo.servicios if s.estado == 'completado']),
                'ultimo_servicio': vehiculo.servicios[0].fecha_inicio.isoformat() if vehiculo.servicios and len(vehiculo.servicios) > 0 else None
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Obtener servicios de un vehículo
@bp.route('/<int:id>/servicios', methods=['GET'])
@jwt_required()
def listar_servicios_vehiculo(id):
    try:
        vehiculo = Vehiculo.query.get_or_404(id)
        
        # Obtener parámetros de filtrado
        estado = request.args.get('estado')
        
        # Construir query base
        query = Servicio.query.filter_by(vehiculo_id=id)
        
        # Aplicar filtros
        if estado:
            query = query.filter_by(estado=estado)
        
        servicios = query.order_by(Servicio.fecha_inicio.desc()).all()
        
        return jsonify({
            'vehiculo': {
                'id': vehiculo.id,
                'placa': vehiculo.placa,
                'marca': vehiculo.marca,
                'modelo': vehiculo.modelo,
                'cliente': f"{vehiculo.cliente.nombre} {vehiculo.cliente.apellido}"
            },
            'servicios': [{
                'id': s.id,
                'tipo': s.tipo_servicio,
                'descripcion': s.descripcion,
                'fecha_inicio': s.fecha_inicio.isoformat(),
                'fecha_fin': s.fecha_fin.isoformat() if s.fecha_fin else None,
                'estado': s.estado,
                'mecanico': f"{s.mecanico.nombre} {s.mecanico.apellido}" if s.mecanico else None,
                'repuestos': len(s.repuestos),
                'horas_trabajo': sum(h.horas for h in s.horas_trabajo),
                'factura': {
                    'id': s.facturas[0].id,
                    'numero': s.facturas[0].numero,
                    'total': s.facturas[0].total,
                    'estado': s.facturas[0].estado
                } if s.facturas else None
            } for s in servicios]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500 
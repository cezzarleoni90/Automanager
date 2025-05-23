from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone
from ..models import db, HoraTrabajo, Mecanico, Servicio
from ..validators import HoraTrabajoValidator

horas_trabajo_bp = Blueprint('horas_trabajo', __name__)

@horas_trabajo_bp.route('/horas-trabajo', methods=['GET'])
@jwt_required()
def get_horas_trabajo():
    try:
        # Obtener parámetros de filtrado
        mecanico_id = request.args.get('mecanico_id', type=int)
        servicio_id = request.args.get('servicio_id', type=int)
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')

        # Construir query base
        query = HoraTrabajo.query

        # Aplicar filtros
        if mecanico_id:
            query = query.filter_by(mecanico_id=mecanico_id)
        if servicio_id:
            query = query.filter_by(servicio_id=servicio_id)
        if fecha_inicio:
            fecha_inicio = datetime.fromisoformat(fecha_inicio.replace('Z', '+00:00'))
            query = query.filter(HoraTrabajo.fecha >= fecha_inicio)
        if fecha_fin:
            fecha_fin = datetime.fromisoformat(fecha_fin.replace('Z', '+00:00'))
            query = query.filter(HoraTrabajo.fecha <= fecha_fin)

        # Ordenar por fecha
        query = query.order_by(HoraTrabajo.fecha.desc())

        horas = query.all()
        return jsonify([{
            'id': h.id,
            'mecanico_id': h.mecanico_id,
            'servicio_id': h.servicio_id,
            'fecha': h.fecha.isoformat(),
            'horas_trabajadas': h.horas_trabajadas,
            'descripcion': h.descripcion,
            'fecha_registro': h.fecha_registro.isoformat(),
            'costo': h.calcular_costo()
        } for h in horas]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@horas_trabajo_bp.route('/horas-trabajo/<int:id>', methods=['GET'])
@jwt_required()
def get_hora_trabajo(id):
    try:
        hora = HoraTrabajo.query.get_or_404(id)
        return jsonify({
            'id': hora.id,
            'mecanico_id': hora.mecanico_id,
            'servicio_id': hora.servicio_id,
            'fecha': hora.fecha.isoformat(),
            'horas_trabajadas': hora.horas_trabajadas,
            'descripcion': hora.descripcion,
            'fecha_registro': hora.fecha_registro.isoformat(),
            'costo': hora.calcular_costo()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@horas_trabajo_bp.route('/horas-trabajo', methods=['POST'])
@jwt_required()
def create_hora_trabajo():
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['mecanico_id', 'servicio_id', 'fecha', 'horas_trabajadas']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo requerido: {field}'}), 400

        # Convertir fecha
        fecha = datetime.fromisoformat(data['fecha'].replace('Z', '+00:00'))

        # Crear registro de horas
        hora = HoraTrabajo(
            mecanico_id=data['mecanico_id'],
            servicio_id=data['servicio_id'],
            fecha=fecha,
            horas_trabajadas=data['horas_trabajadas'],
            descripcion=data.get('descripcion')
        )

        db.session.add(hora)
        db.session.commit()

        return jsonify({
            'id': hora.id,
            'mecanico_id': hora.mecanico_id,
            'servicio_id': hora.servicio_id,
            'fecha': hora.fecha.isoformat(),
            'horas_trabajadas': hora.horas_trabajadas,
            'descripcion': hora.descripcion,
            'fecha_registro': hora.fecha_registro.isoformat(),
            'costo': hora.calcular_costo()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@horas_trabajo_bp.route('/horas-trabajo/<int:id>', methods=['PUT'])
@jwt_required()
def update_hora_trabajo(id):
    try:
        hora = HoraTrabajo.query.get_or_404(id)
        data = request.get_json()

        # Actualizar campos
        if 'fecha' in data:
            hora.fecha = datetime.fromisoformat(data['fecha'].replace('Z', '+00:00'))
        if 'horas_trabajadas' in data:
            hora.horas_trabajadas = data['horas_trabajadas']
        if 'descripcion' in data:
            hora.descripcion = data['descripcion']

        db.session.commit()

        return jsonify({
            'id': hora.id,
            'mecanico_id': hora.mecanico_id,
            'servicio_id': hora.servicio_id,
            'fecha': hora.fecha.isoformat(),
            'horas_trabajadas': hora.horas_trabajadas,
            'descripcion': hora.descripcion,
            'fecha_registro': hora.fecha_registro.isoformat(),
            'costo': hora.calcular_costo()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@horas_trabajo_bp.route('/horas-trabajo/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_hora_trabajo(id):
    try:
        hora = HoraTrabajo.query.get_or_404(id)
        db.session.delete(hora)
        db.session.commit()
        return jsonify({'mensaje': 'Registro de horas eliminado exitosamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500 
from flask import Blueprint, jsonify, request
from backend.extensions import db
from backend.models import Evento, Servicio, Mecanico, Vehiculo, Cliente
from backend.utils.logger import log_activity
from backend.utils.security import require_roles
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

calendario_bp = Blueprint('calendario', __name__)

# Rutas para Eventos
@calendario_bp.route('/', methods=['GET'])
@jwt_required()
def get_eventos():
    try:
        eventos = Evento.query.all()
        return jsonify({
            'eventos': [{
                'id': e.id,
                'title': e.title,
                'start': e.start.isoformat(),
                'end': e.end.isoformat(),
                'descripcion': e.descripcion,
                'cliente_id': e.cliente_id,
                'vehiculo_id': e.vehiculo_id,
                'estado': e.estado,
                'backgroundColor': e.color,
                'borderColor': e.color
            } for e in eventos]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@calendario_bp.route('/', methods=['POST'])
@jwt_required()
def create_evento():
    try:
        data = request.get_json()
        evento = Evento(
            title=data['title'],
            start=datetime.fromisoformat(data['start']),
            end=datetime.fromisoformat(data['end']),
            descripcion=data.get('descripcion', ''),
            cliente_id=data.get('cliente_id'),
            vehiculo_id=data.get('vehiculo_id'),
            estado=data.get('estado', 'pendiente'),
            color=data.get('backgroundColor', '#B0E0E6')
        )
        db.session.add(evento)
        db.session.commit()
        return jsonify({
            'mensaje': 'Evento creado exitosamente',
            'evento': {
                'id': evento.id,
                'title': evento.title,
                'start': evento.start.isoformat(),
                'end': evento.end.isoformat()
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@calendario_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_evento(id):
    try:
        evento = Evento.query.get_or_404(id)
        data = request.get_json()
        
        evento.title = data.get('title', evento.title)
        evento.start = datetime.fromisoformat(data['start']) if 'start' in data else evento.start
        evento.end = datetime.fromisoformat(data['end']) if 'end' in data else evento.end
        evento.descripcion = data.get('descripcion', evento.descripcion)
        evento.cliente_id = data.get('cliente_id', evento.cliente_id)
        evento.vehiculo_id = data.get('vehiculo_id', evento.vehiculo_id)
        evento.estado = data.get('estado', evento.estado)
        evento.color = data.get('backgroundColor', evento.color)
        
        db.session.commit()
        return jsonify({
            'mensaje': 'Evento actualizado exitosamente',
            'evento': {
                'id': evento.id,
                'title': evento.title,
                'start': evento.start.isoformat(),
                'end': evento.end.isoformat()
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@calendario_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_evento(id):
    try:
        evento = Evento.query.get_or_404(id)
        db.session.delete(evento)
        db.session.commit()
        return jsonify({'mensaje': 'Evento eliminado exitosamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# Rutas para Disponibilidad
@calendario_bp.route('/api/mecanicos/<int:mecanico_id>/disponibilidad', methods=['GET'])
@jwt_required()
def get_disponibilidad_mecanico(mecanico_id):
    try:
        fecha = request.args.get('fecha')
        if not fecha:
            return jsonify({"error": "Se requiere la fecha"}), 400
            
        fecha = datetime.fromisoformat(fecha)
        fecha_fin = fecha + timedelta(days=1)
        
        # Obtener eventos del mecánico para la fecha
        eventos = Evento.query.filter(
            Evento.mecanico_id == mecanico_id,
            Evento.fecha_inicio >= fecha,
            Evento.fecha_inicio < fecha_fin
        ).all()
        
        # Generar slots de disponibilidad
        slots = []
        hora_actual = fecha.replace(hour=8, minute=0)  # Comienza a las 8 AM
        hora_fin = fecha.replace(hour=18, minute=0)    # Termina a las 6 PM
        
        while hora_actual < hora_fin:
            slot_disponible = True
            for evento in eventos:
                if hora_actual >= evento.fecha_inicio and hora_actual < evento.fecha_fin:
                    slot_disponible = False
                    break
                    
            if slot_disponible:
                slots.append(hora_actual.isoformat())
                
            hora_actual += timedelta(minutes=30)  # Slots de 30 minutos
            
        return jsonify({
            'fecha': fecha.isoformat(),
            'mecanico_id': mecanico_id,
            'slots_disponibles': slots
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@calendario_bp.route('/api/eventos/sugerir', methods=['POST'])
@jwt_required()
def sugerir_evento():
    """
    Sugerir horario y mecánico óptimo para una cita de servicio.
    """
    try:
        data = request.get_json()
        fecha_inicio = datetime.fromisoformat(data['fecha_inicio'])
        duracion = int(data['duracion'])  # en minutos
        fecha_fin = fecha_inicio + timedelta(minutes=duracion)
        mecanicos = Mecanico.query.all()
        mejor_opcion = None
        menor_citas = None

        for mecanico in mecanicos:
            eventos = Evento.query.filter(
                Evento.mecanico_id == mecanico.id,
                Evento.fecha_inicio < fecha_fin,
                Evento.fecha_fin > fecha_inicio
            ).all()
            if not eventos:
                return jsonify({
                    "mecanico_id": mecanico.id,
                    "mecanico_nombre": f"{mecanico.nombre} {mecanico.apellido}",
                    "color": mecanico.color,
                    "fecha_inicio": fecha_inicio.isoformat(),
                    "fecha_fin": fecha_fin.isoformat()
                }), 200
            if menor_citas is None or len(eventos) < menor_citas:
                menor_citas = len(eventos)
                mejor_opcion = mecanico

        return jsonify({
            "mecanico_id": mejor_opcion.id,
            "mecanico_nombre": f"{mejor_opcion.nombre} {mejor_opcion.apellido}",
            "color": mejor_opcion.color,
            "mensaje": "Todos los mecánicos tienen eventos, se sugiere el de menor carga."
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500 
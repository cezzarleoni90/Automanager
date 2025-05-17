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
@calendario_bp.route('/api/eventos', methods=['GET'])
@jwt_required()
def get_eventos():
    try:
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        mecanico_id = request.args.get('mecanico_id')
        
        query = Evento.query
        
        if fecha_inicio:
            query = query.filter(Evento.fecha_inicio >= datetime.fromisoformat(fecha_inicio))
        if fecha_fin:
            query = query.filter(Evento.fecha_fin <= datetime.fromisoformat(fecha_fin))
        if mecanico_id:
            query = query.filter(Evento.mecanico_id == mecanico_id)
            
        eventos = query.all()
        return jsonify([{
            'id': e.id,
            'titulo': e.titulo,
            'descripcion': e.descripcion,
            'fecha_inicio': e.fecha_inicio.isoformat(),
            'fecha_fin': e.fecha_fin.isoformat(),
            'tipo': e.tipo,
            'estado': e.estado,
            'mecanico_id': e.mecanico_id,
            'mecanico': {
                'id': e.mecanico.id,
                'nombre': e.mecanico.nombre,
                'especialidad': e.mecanico.especialidad
            } if e.mecanico else None,
            'servicio_id': e.servicio_id,
            'servicio': {
                'id': e.servicio.id,
                'descripcion': e.servicio.descripcion,
                'estado': e.servicio.estado,
                'vehiculo': {
                    'id': e.servicio.vehiculo.id,
                    'marca': e.servicio.vehiculo.marca,
                    'modelo': e.servicio.vehiculo.modelo,
                    'placa': e.servicio.vehiculo.placa,
                    'cliente': {
                        'id': e.servicio.vehiculo.cliente.id,
                        'nombre': e.servicio.vehiculo.cliente.nombre,
                        'telefono': e.servicio.vehiculo.cliente.telefono
                    } if e.servicio.vehiculo.cliente else None
                } if e.servicio.vehiculo else None
            } if e.servicio else None
        } for e in eventos]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@calendario_bp.route('/api/eventos/<int:id>', methods=['GET'])
@jwt_required()
def get_evento(id):
    try:
        evento = Evento.query.get_or_404(id)
        return jsonify({
            'id': evento.id,
            'titulo': evento.titulo,
            'descripcion': evento.descripcion,
            'fecha_inicio': evento.fecha_inicio.isoformat(),
            'fecha_fin': evento.fecha_fin.isoformat(),
            'tipo': evento.tipo,
            'estado': evento.estado,
            'mecanico_id': evento.mecanico_id,
            'mecanico': {
                'id': evento.mecanico.id,
                'nombre': evento.mecanico.nombre,
                'especialidad': evento.mecanico.especialidad,
                'telefono': evento.mecanico.telefono,
                'email': evento.mecanico.email
            } if evento.mecanico else None,
            'servicio_id': evento.servicio_id,
            'servicio': {
                'id': evento.servicio.id,
                'descripcion': evento.servicio.descripcion,
                'estado': evento.servicio.estado,
                'fecha': evento.servicio.fecha.isoformat(),
                'vehiculo': {
                    'id': evento.servicio.vehiculo.id,
                    'marca': evento.servicio.vehiculo.marca,
                    'modelo': evento.servicio.vehiculo.modelo,
                    'placa': evento.servicio.vehiculo.placa,
                    'cliente': {
                        'id': evento.servicio.vehiculo.cliente.id,
                        'nombre': evento.servicio.vehiculo.cliente.nombre,
                        'telefono': evento.servicio.vehiculo.cliente.telefono,
                        'email': evento.servicio.vehiculo.cliente.email
                    } if evento.servicio.vehiculo.cliente else None
                } if evento.servicio.vehiculo else None,
                'repuestos': [{
                    'id': r.id,
                    'nombre': r.nombre,
                    'cantidad': r.cantidad,
                    'precio': r.precio
                } for r in evento.servicio.repuestos]
            } if evento.servicio else None
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@calendario_bp.route('/api/eventos', methods=['POST'])
@jwt_required()
def create_evento():
    try:
        data = request.get_json()
        
        # Verificar si el mecánico existe
        if 'mecanico_id' in data:
            mecanico = Mecanico.query.get(data['mecanico_id'])
            if not mecanico:
                return jsonify({"error": "Mecánico no encontrado"}), 404
                
        # Verificar si el servicio existe
        if 'servicio_id' in data:
            servicio = Servicio.query.get(data['servicio_id'])
            if not servicio:
                return jsonify({"error": "Servicio no encontrado"}), 404
                
        # Verificar disponibilidad del mecánico
        if 'mecanico_id' in data:
            fecha_inicio = datetime.fromisoformat(data['fecha_inicio'])
            fecha_fin = datetime.fromisoformat(data['fecha_fin'])
            
            eventos_solapados = Evento.query.filter(
                Evento.mecanico_id == data['mecanico_id'],
                Evento.fecha_inicio < fecha_fin,
                Evento.fecha_fin > fecha_inicio
            ).all()
            
            if eventos_solapados:
                return jsonify({"error": "El mecánico ya tiene eventos programados en ese horario"}), 400
        
        nuevo_evento = Evento(
            titulo=data['titulo'],
            descripcion=data.get('descripcion'),
            fecha_inicio=datetime.fromisoformat(data['fecha_inicio']),
            fecha_fin=datetime.fromisoformat(data['fecha_fin']),
            tipo=data['tipo'],
            estado='programado',
            mecanico_id=data.get('mecanico_id'),
            servicio_id=data.get('servicio_id')
        )
        
        db.session.add(nuevo_evento)
        db.session.commit()
        return jsonify({"mensaje": "Evento creado exitosamente", "id": nuevo_evento.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@calendario_bp.route('/api/eventos/<int:id>', methods=['PUT'])
@jwt_required()
def update_evento(id):
    try:
        evento = Evento.query.get_or_404(id)
        data = request.get_json()
        
        # Verificar disponibilidad del mecánico si se cambia la fecha o el mecánico
        if ('fecha_inicio' in data or 'fecha_fin' in data or 'mecanico_id' in data):
            fecha_inicio = datetime.fromisoformat(data.get('fecha_inicio', evento.fecha_inicio.isoformat()))
            fecha_fin = datetime.fromisoformat(data.get('fecha_fin', evento.fecha_fin.isoformat()))
            mecanico_id = data.get('mecanico_id', evento.mecanico_id)
            
            eventos_solapados = Evento.query.filter(
                Evento.id != id,
                Evento.mecanico_id == mecanico_id,
                Evento.fecha_inicio < fecha_fin,
                Evento.fecha_fin > fecha_inicio
            ).all()
            
            if eventos_solapados:
                return jsonify({"error": "El mecánico ya tiene eventos programados en ese horario"}), 400
        
        evento.titulo = data.get('titulo', evento.titulo)
        evento.descripcion = data.get('descripcion', evento.descripcion)
        evento.fecha_inicio = datetime.fromisoformat(data['fecha_inicio']) if 'fecha_inicio' in data else evento.fecha_inicio
        evento.fecha_fin = datetime.fromisoformat(data['fecha_fin']) if 'fecha_fin' in data else evento.fecha_fin
        evento.tipo = data.get('tipo', evento.tipo)
        evento.estado = data.get('estado', evento.estado)
        evento.mecanico_id = data.get('mecanico_id', evento.mecanico_id)
        evento.servicio_id = data.get('servicio_id', evento.servicio_id)
        
        db.session.commit()
        return jsonify({"mensaje": "Evento actualizado exitosamente"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@calendario_bp.route('/api/eventos/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_evento(id):
    try:
        evento = Evento.query.get_or_404(id)
        db.session.delete(evento)
        db.session.commit()
        return jsonify({"mensaje": "Evento eliminado exitosamente"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

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
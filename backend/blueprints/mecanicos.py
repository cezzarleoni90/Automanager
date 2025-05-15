from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Mecanico, Servicio, HoraTrabajo
from datetime import datetime, timedelta
from sqlalchemy import func

mecanicos_bp = Blueprint('mecanicos', __name__)

@mecanicos_bp.route('/', methods=['GET'])
@jwt_required()
def get_mecanicos():
    try:
        mecanicos = Mecanico.query.all()
        
        # Contar servicios activos para cada mecánico
        result = []
        for mecanico in mecanicos:
            servicios_activos = Servicio.query.filter(
                Servicio.mecanico_id == mecanico.id,
                Servicio.estado.in_(['pendiente', 'diagnostico', 'en_progreso', 'pausado'])
            ).count()
            
            result.append({
                'id': mecanico.id,
                'nombre': mecanico.nombre,
                'apellido': mecanico.apellido,
                'especialidad': mecanico.especialidad,
                'telefono': mecanico.telefono,
                'email': mecanico.email,
                'estado': mecanico.estado,
                'tarifa_hora': mecanico.tarifa_hora,
                'servicios_activos': servicios_activos
            })
        
        return jsonify({"mecanicos": result}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@mecanicos_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_mecanico(id):
    try:
        mecanico = Mecanico.query.get_or_404(id)
        
        return jsonify({
            'id': mecanico.id,
            'nombre': mecanico.nombre,
            'apellido': mecanico.apellido,
            'especialidad': mecanico.especialidad,
            'telefono': mecanico.telefono,
            'email': mecanico.email,
            'estado': mecanico.estado,
            'tarifa_hora': mecanico.tarifa_hora
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@mecanicos_bp.route('/', methods=['POST'])
@jwt_required()
def create_mecanico():
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['nombre', 'apellido', 'email', 'especialidad']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Campo {field} es requerido"}), 400
        
        # Verificar si ya existe un mecánico con ese email
        if Mecanico.query.filter_by(email=data['email']).first():
            return jsonify({"error": "Ya existe un mecánico con ese email"}), 400
        
        nuevo_mecanico = Mecanico(
            nombre=data['nombre'],
            apellido=data['apellido'],
            email=data['email'],
            telefono=data.get('telefono', ''),
            especialidad=data['especialidad'],
            tarifa_hora=data.get('tarifa_hora', 0),
            estado=data.get('estado', 'activo')
        )
        
        db.session.add(nuevo_mecanico)
        db.session.commit()
        
        return jsonify({
            "mensaje": "Mecánico creado exitosamente",
            "mecanico": {
                'id': nuevo_mecanico.id,
                'nombre': nuevo_mecanico.nombre,
                'apellido': nuevo_mecanico.apellido
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@mecanicos_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_mecanico(id):
    try:
        mecanico = Mecanico.query.get_or_404(id)
        data = request.get_json()
        
        # Actualizar campos
        if 'nombre' in data:
            mecanico.nombre = data['nombre']
        if 'apellido' in data:
            mecanico.apellido = data['apellido']
        if 'email' in data:
            # Verificar que el email no esté en uso por otro mecánico
            existing = Mecanico.query.filter_by(email=data['email']).first()
            if existing and existing.id != id:
                return jsonify({"error": "Email ya está en uso por otro mecánico"}), 400
            mecanico.email = data['email']
        if 'telefono' in data:
            mecanico.telefono = data['telefono']
        if 'especialidad' in data:
            mecanico.especialidad = data['especialidad']
        if 'tarifa_hora' in data:
            mecanico.tarifa_hora = data['tarifa_hora']
        if 'estado' in data:
            mecanico.estado = data['estado']
        
        db.session.commit()
        
        return jsonify({
            "mensaje": "Mecánico actualizado exitosamente",
            "mecanico": {
                'id': mecanico.id,
                'nombre': mecanico.nombre,
                'apellido': mecanico.apellido,
                'especialidad': mecanico.especialidad,
                'email': mecanico.email,
                'telefono': mecanico.telefono,
                'estado': mecanico.estado,
                'tarifa_hora': mecanico.tarifa_hora
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@mecanicos_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_mecanico(id):
    try:
        mecanico = Mecanico.query.get_or_404(id)
        
        # Verificar si tiene servicios activos
        servicios_activos = Servicio.query.filter(
            Servicio.mecanico_id == mecanico.id,
            Servicio.estado.in_(['pendiente', 'diagnostico', 'en_progreso', 'pausado'])
        ).count()
        
        if servicios_activos > 0:
            return jsonify({
                "error": f"No se puede eliminar el mecánico porque tiene {servicios_activos} servicios activos"
            }), 400
        
        db.session.delete(mecanico)
        db.session.commit()
        
        return jsonify({"mensaje": "Mecánico eliminado exitosamente"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@mecanicos_bp.route('/<int:id>/servicios', methods=['GET'])
@jwt_required()
def get_servicios_mecanico(id):
    try:
        mecanico = Mecanico.query.get_or_404(id)
        
        # Obtener todos los servicios del mecánico
        servicios = Servicio.query.filter(Servicio.mecanico_id == mecanico.id).all()
        
        resultado = []
        for s in servicios:
            resultado.append({
                'id': s.id,
                'tipo_servicio': s.tipo_servicio,
                'descripcion': s.descripcion,
                'estado': s.estado,
                'fecha_inicio': s.fecha_inicio.isoformat() if s.fecha_inicio else None,
                'fecha_fin': s.fecha_fin.isoformat() if s.fecha_fin else None,
                'vehiculo': {
                    'id': s.vehiculo.id,
                    'placa': s.vehiculo.placa,
                    'marca': s.vehiculo.marca,
                    'modelo': s.vehiculo.modelo
                } if s.vehiculo else None
            })
        
        return jsonify({"servicios": resultado}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@mecanicos_bp.route('/<int:id>/estadisticas', methods=['GET'])
@jwt_required()
def get_estadisticas_mecanico(id):
    try:
        mecanico = Mecanico.query.get_or_404(id)
        
        # Obtener servicios por estado
        servicios_por_estado = {}
        for estado in Servicio.ESTADOS.keys():
            count = Servicio.query.filter(
                Servicio.mecanico_id == mecanico.id,
                Servicio.estado == estado
            ).count()
            servicios_por_estado[estado] = count
        
        # Obtener total de servicios
        total_servicios = Servicio.query.filter(Servicio.mecanico_id == mecanico.id).count()
        
        # Calcular horas trabajadas en el mes actual
        inicio_mes = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        fin_mes = inicio_mes.replace(month=inicio_mes.month+1 if inicio_mes.month < 12 else 1) - timedelta(seconds=1)
        
        horas_mes = db.session.query(func.sum(HoraTrabajo.horas_trabajadas)).filter(
            HoraTrabajo.mecanico_id == mecanico.id,
            HoraTrabajo.fecha >= inicio_mes,
            HoraTrabajo.fecha <= fin_mes
        ).scalar() or 0
        
        # Calcular ingresos generados (horas × tarifa)
        ingresos_mes = horas_mes * mecanico.tarifa_hora
        
        return jsonify({
            'servicios_por_estado': servicios_por_estado,
            'total_servicios': total_servicios,
            'horas_trabajadas_mes': horas_mes,
            'ingresos_generados_mes': round(ingresos_mes, 2),
            'tarifa_actual': mecanico.tarifa_hora
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500 
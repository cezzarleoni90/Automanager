from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Mecanico, Servicio, HoraTrabajo
from datetime import datetime, timedelta
from sqlalchemy import func
from utils.colors import obtener_color_pastel_disponible, obtener_categoria_color

mecanicos_bp = Blueprint('mecanicos', __name__)

@mecanicos_bp.route('/', methods=['GET'])
@jwt_required()
def get_mecanicos():
    try:
        mecanicos = Mecanico.query.all()
        return jsonify({
            'mecanicos': [{
                'id': m.id,
                'nombre': m.nombre,
                'apellido': m.apellido,
                'especialidad': m.especialidad,
                'color': m.color,
                'estado': m.estado,
                'telefono': m.telefono,
                'email': m.email
            } for m in mecanicos]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mecanicos_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_mecanico(id):
    try:
        mecanico = Mecanico.query.get_or_404(id)
        
        return jsonify({
            'id': mecanico.id,
            'nombre': mecanico.nombre,
            'especialidad': mecanico.especialidad,
            'color': mecanico.color,
            'estado': mecanico.estado,
            'telefono': mecanico.telefono,
            'email': mecanico.email
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@mecanicos_bp.route('/', methods=['POST'])
@jwt_required()
def create_mecanico():
    try:
        data = request.get_json()
        
        # Validar campos requeridos
        required_fields = ['nombre', 'apellido', 'email']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'El campo {field} es requerido'}), 400
        
        # Verificar si el email ya existe
        if Mecanico.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'El email ya está registrado'}), 400
        
        mecanico = Mecanico(
            nombre=data['nombre'],
            apellido=data['apellido'],
            especialidad=data.get('especialidad', ''),
            color=data.get('color', '#B0E0E6'),
            estado=data.get('estado', 'activo'),
            telefono=data.get('telefono', ''),
            email=data['email'],
            tarifa_hora=data.get('tarifa_hora', 0.0)
        )
        db.session.add(mecanico)
        db.session.commit()
        return jsonify({
            'mensaje': 'Mecánico creado exitosamente',
            'mecanico': {
                'id': mecanico.id,
                'nombre': mecanico.nombre,
                'apellido': mecanico.apellido,
                'especialidad': mecanico.especialidad,
                'email': mecanico.email
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@mecanicos_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_mecanico(id):
    try:
        mecanico = Mecanico.query.get_or_404(id)
        data = request.get_json()
        
        mecanico.nombre = data.get('nombre', mecanico.nombre)
        mecanico.especialidad = data.get('especialidad', mecanico.especialidad)
        mecanico.color = data.get('color', mecanico.color)
        mecanico.estado = data.get('estado', mecanico.estado)
        mecanico.telefono = data.get('telefono', mecanico.telefono)
        mecanico.email = data.get('email', mecanico.email)
        
        db.session.commit()
        return jsonify({
            'mensaje': 'Mecánico actualizado exitosamente',
            'mecanico': {
                'id': mecanico.id,
                'nombre': mecanico.nombre,
                'especialidad': mecanico.especialidad
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@mecanicos_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_mecanico(id):
    try:
        mecanico = Mecanico.query.get_or_404(id)
        db.session.delete(mecanico)
        db.session.commit()
        return jsonify({'mensaje': 'Mecánico eliminado exitosamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@mecanicos_bp.route('/<int:id>/servicios', methods=['GET'])
@jwt_required()
def get_servicios_mecanico(id):
    try:
        mecanico = Mecanico.query.get_or_404(id)
        
        # Obtener parámetros de paginación y filtros
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        estado = request.args.get('estado')
        search = request.args.get('search', '')
        
        # Construir la consulta base
        query = Servicio.query.filter(Servicio.mecanico_id == mecanico.id)
        
        # Aplicar filtros
        if estado:
            query = query.filter(Servicio.estado == estado)
        if search:
            query = query.filter(
                db.or_(
                    Servicio.tipo_servicio.ilike(f'%{search}%'),
                    Servicio.descripcion.ilike(f'%{search}%')
                )
            )
        
        # Obtener el total de registros
        total = query.count()
        
        # Aplicar paginación
        servicios = query.order_by(Servicio.fecha_inicio.desc())\
            .offset((page - 1) * per_page)\
            .limit(per_page)\
            .all()
        
        resultado = []
        for s in servicios:
            resultado.append({
                'id': s.id,
                'tipo_servicio': s.tipo_servicio,
                'descripcion': s.descripcion,
                'estado': s.estado,
                'fecha_inicio': s.fecha_inicio.isoformat() if s.fecha_inicio else None,
                'fecha_fin': s.fecha_fin.isoformat() if s.fecha_fin else None,
                'honorarios': s.honorarios,
                'vehiculo': {
                    'id': s.vehiculo.id,
                    'placa': s.vehiculo.placa,
                    'marca': s.vehiculo.marca,
                    'modelo': s.vehiculo.modelo
                } if s.vehiculo else None
            })
        
        return jsonify({
            "servicios": resultado,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page
        }), 200
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
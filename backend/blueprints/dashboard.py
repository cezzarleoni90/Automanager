from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import Cliente, Vehiculo, Servicio, Mecanico, Factura
from backend.extensions import db
from sqlalchemy import func
from datetime import datetime, timedelta

bp = Blueprint('dashboard', __name__)

@bp.route('/', methods=['GET'])
@jwt_required()
def get_estadisticas():
    try:
        # Estadísticas generales
        total_clientes = Cliente.query.count()
        total_vehiculos = Vehiculo.query.count()
        total_servicios = Servicio.query.count()
        total_mecanicos = Mecanico.query.count()
        
        # Servicios por estado
        servicios_por_estado = db.session.query(
            Servicio.estado, 
            func.count(Servicio.id)
        ).group_by(Servicio.estado).all()
        
        # Servicios de los últimos 30 días
        fecha_limite = datetime.now() - timedelta(days=30)
        servicios_recientes = Servicio.query.filter(
            Servicio.fecha_inicio >= fecha_limite
        ).count()
        
        # Ingresos de los últimos 30 días
        ingresos_recientes = db.session.query(
            func.sum(Factura.total)
        ).join(Servicio).filter(
            Servicio.fecha_inicio >= fecha_limite,
            Servicio.estado == 'completado'
        ).scalar() or 0
        
        return jsonify({
            'estadisticas_generales': {
                'total_clientes': total_clientes,
                'total_vehiculos': total_vehiculos,
                'total_servicios': total_servicios,
                'total_mecanicos': total_mecanicos
            },
            'servicios_por_estado': dict(servicios_por_estado),
            'ultimos_30_dias': {
                'servicios': servicios_recientes,
                'ingresos': float(ingresos_recientes)
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

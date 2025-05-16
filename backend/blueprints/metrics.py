from flask import Blueprint, jsonify, request
from services.metrics_service import MetricsService
from utils.logger import log_activity
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from functools import wraps

metrics_bp = Blueprint('metrics', __name__)
metrics_service = MetricsService()

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # TODO: Implementar verificación de rol de administrador
        return f(*args, **kwargs)
    return decorated_function

@metrics_bp.route('/metrics/system', methods=['GET'])
@jwt_required()
@admin_required
def get_system_metrics():
    """Obtiene métricas del sistema"""
    try:
        resultado = metrics_service.get_system_metrics()
        return jsonify(resultado)
        
    except Exception as e:
        log_activity('metrics_error', f"Error obteniendo métricas del sistema: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Error interno del servidor'
        }), 500

@metrics_bp.route('/metrics/business', methods=['GET'])
@jwt_required()
@admin_required
def get_business_metrics():
    """Obtiene métricas de negocio"""
    try:
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        
        if fecha_inicio:
            fecha_inicio = datetime.fromisoformat(fecha_inicio)
        if fecha_fin:
            fecha_fin = datetime.fromisoformat(fecha_fin)
        
        resultado = metrics_service.get_business_metrics(fecha_inicio, fecha_fin)
        return jsonify(resultado)
        
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        log_activity('metrics_error', f"Error obteniendo métricas de negocio: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Error interno del servidor'
        }), 500

@metrics_bp.route('/metrics/user', methods=['GET'])
@jwt_required()
def get_user_metrics():
    """Obtiene métricas de usuario"""
    try:
        usuario_id = get_jwt_identity()
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        
        if fecha_inicio:
            fecha_inicio = datetime.fromisoformat(fecha_inicio)
        if fecha_fin:
            fecha_fin = datetime.fromisoformat(fecha_fin)
        
        resultado = metrics_service.get_user_metrics(usuario_id, fecha_inicio, fecha_fin)
        return jsonify(resultado)
        
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        log_activity('metrics_error', f"Error obteniendo métricas de usuario: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Error interno del servidor'
        }), 500

@metrics_bp.route('/metrics/performance', methods=['GET'])
@jwt_required()
@admin_required
def get_performance_metrics():
    """Obtiene métricas de rendimiento"""
    try:
        resultado = metrics_service.get_performance_metrics()
        return jsonify(resultado)
        
    except Exception as e:
        log_activity('metrics_error', f"Error obteniendo métricas de rendimiento: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Error interno del servidor'
        }), 500 
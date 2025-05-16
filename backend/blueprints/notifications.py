from flask import Blueprint, jsonify, request
from services.notification_service import NotificationService
from utils.logger import log_activity
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

notifications_bp = Blueprint('notifications', __name__)
notification_service = NotificationService()

@notifications_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Obtiene notificaciones con filtros"""
    try:
        usuario_id = get_jwt_identity()
        tipo = request.args.get('tipo')
        leida = request.args.get('leida', type=bool)
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        resultado = notification_service.get_notifications(
            usuario_id=usuario_id,
            tipo=tipo,
            leida=leida,
            limit=limit,
            offset=offset
        )
        return jsonify(resultado)
        
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        log_activity('notification_error', f"Error obteniendo notificaciones: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Error interno del servidor'
        }), 500

@notifications_bp.route('/notifications/read', methods=['POST'])
@jwt_required()
def mark_as_read():
    """Marca notificaciones como leídas"""
    try:
        usuario_id = get_jwt_identity()
        data = request.get_json()
        
        notificacion_id = data.get('notificacion_id')
        todas = data.get('todas', False)
        
        resultado = notification_service.mark_as_read(
            notificacion_id=notificacion_id,
            usuario_id=usuario_id,
            todas=todas
        )
        return jsonify(resultado)
        
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        log_activity('notification_error', f"Error marcando notificaciones: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Error interno del servidor'
        }), 500

@notifications_bp.route('/notifications/unread/count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Obtiene el conteo de notificaciones no leídas"""
    try:
        usuario_id = get_jwt_identity()
        resultado = notification_service.get_unread_count(usuario_id)
        return jsonify(resultado)
        
    except Exception as e:
        log_activity('notification_error', f"Error contando notificaciones: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Error interno del servidor'
        }), 500

@notifications_bp.route('/notifications/cleanup', methods=['POST'])
@jwt_required()
def cleanup_notifications():
    """Elimina notificaciones antiguas"""
    try:
        dias = request.args.get('dias', 30, type=int)
        resultado = notification_service.delete_old_notifications(dias)
        return jsonify(resultado)
        
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        log_activity('notification_error', f"Error limpiando notificaciones: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Error interno del servidor'
        }), 500 
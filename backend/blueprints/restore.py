from flask import Blueprint, jsonify, request
from backend.utils.logger import log_activity
from backend.utils.security import require_roles
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.tasks.restore import restore_database, list_available_backups
from datetime import datetime
from typing import Dict, Any

restore_bp = Blueprint('restore', __name__)

@restore_bp.route('/restore', methods=['POST'])
@jwt_required()
def restore():
    """Endpoint para restaurar la base de datos"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Obtener parámetros
        backup_file = data.get('backup_file')
        from_s3 = data.get('from_s3', False)
        point_in_time = data.get('point_in_time')
        tables = data.get('tables')
        verify_only = data.get('verify_only', False)
        dry_run = data.get('dry_run', False)
        
        # Validar punto en el tiempo si se proporciona
        if point_in_time:
            try:
                datetime.fromisoformat(point_in_time)
            except ValueError:
                return jsonify({
                    'status': 'error',
                    'message': 'Formato de fecha inválido. Use ISO format (YYYY-MM-DDTHH:MM:SS)'
                }), 400
        
        # Ejecutar restauración
        result = restore_database.delay(
            backup_file=backup_file,
            from_s3=from_s3,
            point_in_time=point_in_time,
            tables=tables,
            verify_only=verify_only,
            dry_run=dry_run
        )
        
        # Registrar actividad
        action = 'verify' if verify_only else 'dry_run' if dry_run else 'restore'
        log_activity(
            f'backup_{action}',
            f'Usuario {user_id} inició {action} de backup',
            user_id=user_id,
            metadata={
                'backup_file': backup_file,
                'from_s3': from_s3,
                'point_in_time': point_in_time,
                'tables': tables
            }
        )
        
        return jsonify({
            'status': 'success',
            'message': f'Tarea de {action} iniciada',
            'task_id': result.id
        })
        
    except Exception as e:
        log_activity('restore_error', f"Error en restauración: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@restore_bp.route('/restore/list', methods=['GET'])
@jwt_required()
def list_backups():
    """Endpoint para listar backups disponibles"""
    try:
        from_s3 = request.args.get('from_s3', 'false').lower() == 'true'
        user_id = get_jwt_identity()
        
        # Obtener lista de backups
        result = list_available_backups.delay(from_s3)
        
        # Registrar actividad
        log_activity(
            'backup_list',
            f'Usuario {user_id} listó backups disponibles',
            user_id=user_id,
            metadata={'from_s3': from_s3}
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Obteniendo lista de backups',
            'task_id': result.id
        })
        
    except Exception as e:
        log_activity('backup_list_error', f"Error listando backups: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@restore_bp.route('/restore/status/<task_id>', methods=['GET'])
@jwt_required()
def check_status(task_id):
    """Endpoint para verificar el estado de una tarea de restauración"""
    try:
        from celery.result import AsyncResult
        result = AsyncResult(task_id)
        
        if result.ready():
            if result.successful():
                return jsonify({
                    'status': 'success',
                    'result': result.result
                })
            else:
                return jsonify({
                    'status': 'error',
                    'message': str(result.result)
                }), 500
        else:
            return jsonify({
                'status': 'pending',
                'message': 'Tarea en progreso'
            })
            
    except Exception as e:
        log_activity('restore_status_error', f"Error verificando estado: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
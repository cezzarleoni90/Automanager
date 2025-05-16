from flask import Blueprint, jsonify, request
from services.sync_service import SyncService
from utils.logger import log_activity
from utils.security import require_roles, block_sql_injection, prevent_xss
from utils.cache import cache_decorator
from typing import Dict, Any

sync_bp = Blueprint('sync', __name__)
sync_service = SyncService()

@sync_bp.route('/status', methods=['GET'])
@require_roles('admin', 'manager')
@cache_decorator(ttl=300)  # Cache por 5 minutos
def get_sync_status() -> Dict[str, Any]:
    """Obtiene el estado de sincronización"""
    try:
        status = sync_service.get_sync_status()
        return jsonify(status)
    except Exception as e:
        log_activity('sync_error', f"Error obteniendo estado: {str(e)}")
        return jsonify({'error': str(e)}), 500

@sync_bp.route('/inventory', methods=['POST'])
@require_roles('admin', 'manager')
@block_sql_injection
@prevent_xss
def sync_inventory() -> Dict[str, Any]:
    """Sincroniza el inventario con los proveedores"""
    try:
        supplier_id = request.json.get('supplier_id')
        result = sync_service.sync_inventory(supplier_id)
        return jsonify(result)
    except Exception as e:
        log_activity('sync_error', f"Error sincronizando inventario: {str(e)}")
        return jsonify({'error': str(e)}), 500

@sync_bp.route('/offline/data', methods=['POST'])
@require_roles('admin', 'manager')
@block_sql_injection
@prevent_xss
def save_offline_data() -> Dict[str, Any]:
    """Guarda datos para uso offline"""
    try:
        data = request.json.get('data')
        entity_type = request.json.get('entity_type')
        
        if not data or not entity_type:
            return jsonify({'error': 'Datos y tipo de entidad requeridos'}), 400
        
        sync_service.save_offline_data(data, entity_type)
        return jsonify({'status': 'success'})
    except Exception as e:
        log_activity('sync_error', f"Error guardando datos offline: {str(e)}")
        return jsonify({'error': str(e)}), 500

@sync_bp.route('/offline/cleanup', methods=['POST'])
@require_roles('admin')
@block_sql_injection
def cleanup_offline_data() -> Dict[str, Any]:
    """Limpia datos offline antiguos"""
    try:
        sync_service._cleanup_old_offline_data()
        return jsonify({'status': 'success'})
    except Exception as e:
        log_activity('sync_error', f"Error limpiando datos offline: {str(e)}")
        return jsonify({'error': str(e)}), 500

@sync_bp.route('/storage/check', methods=['GET'])
@require_roles('admin', 'manager')
@cache_decorator(ttl=300)  # Cache por 5 minutos
def check_storage() -> Dict[str, Any]:
    """Verifica límites de almacenamiento"""
    try:
        within_limits = sync_service.check_storage_limits()
        return jsonify({
            'status': 'success',
            'within_limits': within_limits,
            'max_storage_mb': sync_service.config.MAX_LOCAL_STORAGE_MB
        })
    except Exception as e:
        log_activity('sync_error', f"Error verificando almacenamiento: {str(e)}")
        return jsonify({'error': str(e)}), 500 
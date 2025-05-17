from celery import shared_task
from backend.extensions import db
from backend.models import Repuesto, MovimientoInventario, Proveedor
from backend.utils.logger import log_activity
from backend.services.sync_service import SyncService
from backend.services.notification_service import NotificationService
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import json

@shared_task(name='tasks.sync_inventory', bind=True, max_retries=3)
def sync_inventory(self, supplier_id: Optional[int] = None) -> Dict:
    """Sincroniza el inventario con los proveedores"""
    try:
        sync_service = SyncService()
        result = sync_service.sync_with_supplier(supplier_id) if supplier_id else sync_service.sync_all()
        
        log_activity(
            'inventory_sync',
            f"Sincronización completada para proveedor {supplier_id if supplier_id else 'todos'}"
        )
        
        return {
            'status': 'success',
            'message': 'Sincronización completada',
            'details': result
        }
        
    except Exception as e:
        log_activity('inventory_sync_error', f"Error en sincronización: {str(e)}")
        self.retry(exc=e, countdown=300)  # Reintentar en 5 minutos

@shared_task(name='tasks.check_stock_alerts')
def check_stock_alerts() -> Dict:
    """Verifica alertas de stock bajo"""
    try:
        # Obtener repuestos con stock bajo
        low_stock = Repuesto.query.filter(
            Repuesto.stock <= Repuesto.stock_minimo
        ).all()
        
        if not low_stock:
            return {
                'status': 'success',
                'message': 'No hay alertas de stock',
                'alerts': []
            }
        
        # Crear notificaciones
        notification_service = NotificationService()
        
        alerts = []
        for part in low_stock:
            alert = {
                'part_id': part.id,
                'name': part.nombre,
                'current_stock': part.stock,
                'min_stock': part.stock_minimo
            }
            
            # Crear notificación
            notification_service.create_notification(
                tipo='stock_alert',
                mensaje=f"Stock bajo para {part.nombre}: {part.stock} unidades",
                metadata=alert
            )
            
            alerts.append(alert)
        
        log_activity(
            'stock_alerts',
            f"Verificadas {len(alerts)} alertas de stock"
        )
        
        return {
            'status': 'success',
            'message': f'Encontradas {len(alerts)} alertas de stock',
            'alerts': alerts
        }
        
    except Exception as e:
        log_activity('stock_alerts_error', f"Error verificando alertas: {str(e)}")
        raise

@shared_task(name='tasks.cleanup_old_data')
def cleanup_old_data() -> Dict:
    """Limpia datos antiguos del sistema"""
    try:
        # Configurar fechas
        now = datetime.utcnow()
        old_date = now - timedelta(days=90)  # 90 días
        
        # Limpiar movimientos antiguos
        old_movements = MovimientoInventario.query.filter(
            MovimientoInventario.fecha < old_date
        ).delete()
        
        # Limpiar notificaciones antiguas
        from backend.models import Notificacion
        old_notifications = Notificacion.query.filter(
            Notificacion.fecha < old_date
        ).delete()
        
        db.session.commit()
        
        log_activity(
            'data_cleanup',
            f"Limpieza completada: {old_movements} movimientos y {old_notifications} notificaciones"
        )
        
        return {
            'status': 'success',
            'message': 'Limpieza completada',
            'details': {
                'movements_deleted': old_movements,
                'notifications_deleted': old_notifications
            }
        }
        
    except Exception as e:
        db.session.rollback()
        log_activity('data_cleanup_error', f"Error en limpieza: {str(e)}")
        raise
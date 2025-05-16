from celery import Celery
from utils.logger import log_activity
from utils.cache import invalidate_cache
import os

# Configurar Celery
celery = Celery(
    'automanager',
    broker=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
)

celery.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,
    worker_max_tasks_per_child=1000
)

@celery.task(name='tasks.sync_inventory')
def sync_inventory(proveedor_id=None):
    """Tarea asíncrona para sincronizar inventario"""
    try:
        from services.sync_service import SyncService
        sync_service = SyncService()
        if proveedor_id:
            return sync_service.sync_proveedor(proveedor_id)
        return sync_service.sync_all_proveedores()
    except Exception as e:
        log_activity('sync_error', f"Error en sincronización: {str(e)}")
        raise

@celery.task(name='tasks.generate_report')
def generate_report(report_type, params):
    """Tarea asíncrona para generar reportes"""
    try:
        from services.report_service import ReportService
        report_service = ReportService()
        return report_service.generate_report(report_type, params)
    except Exception as e:
        log_activity('report_error', f"Error generando reporte: {str(e)}")
        raise

@celery.task(name='tasks.cleanup_old_data')
def cleanup_old_data():
    """Tarea asíncrona para limpieza de datos antiguos"""
    try:
        from services.notification_service import NotificationService
        from datetime import datetime, timedelta
        
        # Limpiar notificaciones antiguas
        notification_service = NotificationService()
        retention_days = int(os.getenv('NOTIFICATION_RETENTION_DAYS', 30))
        notification_service.delete_old_notifications(retention_days)
        
        # Invalidar caché antiguo
        invalidate_cache('reports')
        
        log_activity('cleanup', 'Limpieza de datos completada')
    except Exception as e:
        log_activity('cleanup_error', f"Error en limpieza: {str(e)}")
        raise

@celery.task(name='tasks.check_stock_alerts')
def check_stock_alerts():
    """Tarea asíncrona para verificar alertas de stock"""
    try:
        from models import Repuesto
        from services.notification_service import NotificationService
        
        notification_service = NotificationService()
        repuestos_bajo_stock = Repuesto.query.filter(
            Repuesto.stock_actual <= Repuesto.stock_minimo
        ).all()
        
        for repuesto in repuestos_bajo_stock:
            notification_service.create_notification(
                tipo='stock_alert',
                mensaje=f'Stock bajo para {repuesto.nombre}',
                datos={'repuesto_id': repuesto.id}
            )
            
        log_activity('stock_check', f'Verificadas {len(repuestos_bajo_stock)} alertas de stock')
    except Exception as e:
        log_activity('stock_check_error', f"Error verificando stock: {str(e)}")
        raise 
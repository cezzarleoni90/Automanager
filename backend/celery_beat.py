from celery.schedules import crontab
from tasks import celery

# Configurar tareas programadas
celery.conf.beat_schedule = {
    'sync-inventory-daily': {
        'task': 'tasks.sync_inventory',
        'schedule': crontab(hour=0, minute=0),  # Ejecutar a medianoche
        'args': (None,)
    },
    'check-stock-alerts': {
        'task': 'tasks.check_stock_alerts',
        'schedule': crontab(hour='*/4'),  # Cada 4 horas
        'args': ()
    },
    'cleanup-old-data': {
        'task': 'tasks.cleanup_old_data',
        'schedule': crontab(hour=1, minute=0),  # 1 AM
        'args': ()
    },
    'backup-database': {
        'task': 'tasks.backup_database',
        'schedule': crontab(hour=2, minute=0),  # 2 AM
        'args': ()
    },
    'verify-latest-backup': {
        'task': 'tasks.verify_backup',
        'schedule': crontab(hour=2, minute=30),  # 2:30 AM
        'args': (None,)
    },
    'cleanup-old-backups': {
        'task': 'tasks.cleanup_old_backups',
        'schedule': crontab(hour=3, minute=0),  # 3 AM
        'args': ()
    }
} 
from celery import Celery
from celery.schedules import crontab
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de Celery
celery = Celery(
    'automanager',
    broker=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0'),
    include=['tasks']
)

# Configuración de Celery
celery.conf.update(
    # Configuración general
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='America/Mexico_City',
    enable_utc=True,
    
    # Configuración de tareas
    task_track_started=True,
    task_time_limit=3600,  # 1 hora
    task_soft_time_limit=3000,  # 50 minutos
    worker_max_tasks_per_child=1000,
    worker_prefetch_multiplier=1,
    
    # Configuración de reintentos
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_default_retry_delay=300,  # 5 minutos
    task_max_retries=3,
    
    # Configuración de colas
    task_queues={
        'default': {
            'exchange': 'default',
            'routing_key': 'default',
        },
        'high_priority': {
            'exchange': 'high_priority',
            'routing_key': 'high_priority',
        },
        'low_priority': {
            'exchange': 'low_priority',
            'routing_key': 'low_priority',
        }
    },
    
    # Configuración de tareas programadas
    beat_schedule={
        'sync-inventory-daily': {
            'task': 'tasks.sync_inventory',
            'schedule': crontab(hour=0, minute=0),  # Medianoche
            'args': (None,),
            'options': {'queue': 'high_priority'}
        },
        'check-stock-alerts': {
            'task': 'tasks.check_stock_alerts',
            'schedule': crontab(hour='*/4'),  # Cada 4 horas
            'options': {'queue': 'default'}
        },
        'cleanup-old-data': {
            'task': 'tasks.cleanup_old_data',
            'schedule': crontab(hour=1, minute=0),  # 1 AM
            'options': {'queue': 'low_priority'}
        },
        'backup-database': {
            'task': 'tasks.backup_database',
            'schedule': crontab(hour=2, minute=0),  # 2 AM
            'options': {'queue': 'high_priority'}
        },
        'verify-latest-backup': {
            'task': 'tasks.verify_backup',
            'schedule': crontab(hour=2, minute=30),  # 2:30 AM
            'args': (None,),
            'options': {'queue': 'high_priority'}
        },
        'cleanup-old-backups': {
            'task': 'tasks.cleanup_old_backups',
            'schedule': crontab(hour=3, minute=0),  # 3 AM
            'options': {'queue': 'low_priority'}
        }
    }
) 
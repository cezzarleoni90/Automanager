import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

class Config:
    """Configuración base de la aplicación"""
    
    # Configuración básica
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-change-in-production')
    DEBUG = os.getenv('FLASK_ENV', 'development') == 'development'
    
    # Configuración de base de datos
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///automanager.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Configuración JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-jwt-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 86400))  # 24 horas
    JWT_REFRESH_TOKEN_EXPIRES = int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES', 604800))  # 7 días
    
    # Configuración de Redis
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    CACHE_TYPE = 'redis'
    CACHE_REDIS_URL = REDIS_URL
    CACHE_DEFAULT_TIMEOUT = int(os.getenv('CACHE_TTL', 3600))
    
    # Configuración de Celery
    CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', REDIS_URL)
    CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', REDIS_URL)
    CELERY_TASK_SERIALIZER = 'json'
    CELERY_ACCEPT_CONTENT = ['json']
    CELERY_RESULT_SERIALIZER = 'json'
    CELERY_TIMEZONE = 'UTC'
    
    # Configuración de S3
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    AWS_BUCKET_NAME = os.getenv('AWS_BUCKET_NAME')
    AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
    
    # Configuración de Sentry
    SENTRY_DSN = os.getenv('SENTRY_DSN')
    SENTRY_TRACES_SAMPLE_RATE = float(os.getenv('SENTRY_TRACES_SAMPLE_RATE', 0.1))
    
    # Configuración de sincronización
    SYNC_INTERVAL = int(os.getenv('SYNC_INTERVAL', 300))  # 5 minutos
    OFFLINE_MODE_ENABLED = os.getenv('OFFLINE_MODE_ENABLED', 'true').lower() == 'true'
    MAX_OFFLINE_DAYS = int(os.getenv('MAX_OFFLINE_DAYS', 7))
    
    # Configuración de almacenamiento
    MAX_LOCAL_STORAGE_MB = int(os.getenv('MAX_LOCAL_STORAGE_MB', 100))
    
    # Configuración de notificaciones
    NOTIFICATION_RETENTION_DAYS = int(os.getenv('NOTIFICATION_RETENTION_DAYS', 30))
    NOTIFICATION_BATCH_SIZE = int(os.getenv('NOTIFICATION_BATCH_SIZE', 50))
    
    # Configuración de reportes
    REPORT_MAX_ROWS = int(os.getenv('REPORT_MAX_ROWS', 10000))
    REPORT_CACHE_TTL = int(os.getenv('REPORT_CACHE_TTL', 3600))
    
    # Configuración de seguridad
    BLOCKED_IPS = os.getenv('BLOCKED_IPS', '').split(',')
    RATE_LIMIT = int(os.getenv('RATE_LIMIT', '100'))
    RATE_LIMIT_WINDOW = int(os.getenv('RATE_LIMIT_WINDOW', '3600'))
    
    # Configuración de backup
    BACKUP_RETENTION_DAYS = int(os.getenv('BACKUP_RETENTION_DAYS', 30))
    BACKUP_PATH = os.getenv('BACKUP_PATH', 'backups')
    
    # Configuración de logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_FILE = os.getenv('LOG_FILE', 'app.log')
    
    # Configuración de CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    CORS_HEADERS = ['Content-Type', 'Authorization']
    
    # Configuración de Swagger
    SWAGGER_URL = '/api/docs'
    API_URL = '/static/swagger.json'
    
    @classmethod
    def init_app(cls, app):
        """Inicializa la aplicación con la configuración"""
        app.config.from_object(cls)
        
        # Crear directorios necesarios
        os.makedirs(cls.BACKUP_PATH, exist_ok=True)
        
        # Configurar logging
        import logging
        logging.basicConfig(
            level=getattr(logging, cls.LOG_LEVEL),
            format=cls.LOG_FORMAT,
            filename=cls.LOG_FILE
        ) 
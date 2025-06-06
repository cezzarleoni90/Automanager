import os
import sys

# Agregar el directorio raíz al path de Python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.extensions import db
from backend.config import Config
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from backend.middleware import setup_cors, handle_preflight
from datetime import timedelta
<<<<<<< HEAD
import logging
from dotenv import load_dotenv
from backend.blueprints.auth import auth_bp
from backend.blueprints.clientes import bp as clientes_bp
from backend.blueprints.vehiculos import bp as vehiculos_bp
from backend.blueprints.servicios import servicios_bp
from backend.blueprints.mecanicos import mecanicos_bp
from backend.blueprints.usuarios import usuarios_bp
from backend.blueprints.configuracion import configuracion_bp
from backend.blueprints.dashboard import bp as dashboard_bp
from backend.blueprints.inventario import inventario_bp
from backend.blueprints.metrics import metrics_bp
from backend.blueprints.sync import sync_bp
from backend.blueprints.notifications import notifications_bp
from backend.blueprints.reports import reports_bp
from backend.api_docs import api_bp
from backend.utils.logger import StructuredLogger, log_request, metrics, init_logger
from backend.utils.error_monitor import init_error_monitoring
from backend.utils.cache import cache
from backend.blueprints.restore import restore_bp
from flask_swagger_ui import get_swaggerui_blueprint
from backend.middleware.security import SecurityMiddleware
from backend.middleware.query_monitor import QueryMonitor

# Cargar variables de entorno
load_dotenv()
=======
from blueprints.auth import auth_bp
from blueprints.clientes import bp as clientes_bp
from blueprints.vehiculos import bp as vehiculos_bp
from blueprints.servicios import servicios_bp
from blueprints.mecanicos import mecanicos_bp
from blueprints.usuarios import usuarios_bp
from blueprints.configuracion import configuracion_bp
from blueprints.dashboard import bp as dashboard_bp
from blueprints.inventario import inventario_bp
from blueprints.calendario import calendario_bp
<<<<<<< HEAD
from blueprints.facturas import facturas_bp
import os
=======
>>>>>>> respaldo-AutoManager-v1.0
>>>>>>> cc4bc33f90ff4f4cfed9d9b715b5818b6f50788d

def create_app():
    app = Flask(__name__)
    
<<<<<<< HEAD
    # Configuración
    app.config['SECRET_KEY'] = 'tu_clave_secreta_aqui'  # Cambiar en producción
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///automanager.db'  # Usar SQLite para desarrollo
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'tu-clave-secreta-aqui')
=======
    # Configuración desde variables de entorno
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-key-change-in-production')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///automanager.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
<<<<<<< HEAD
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-jwt-key-change-in-production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 86400))
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES', 604800))
=======
    app.config['JWT_SECRET_KEY'] = 'tu_clave_secreta_aqui'  # Cambiar en producción
>>>>>>> cc4bc33f90ff4f4cfed9d9b715b5818b6f50788d
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
>>>>>>> respaldo-AutoManager-v1.0
    
    # Configuración de sincronización
    app.config['SYNC_INTERVAL'] = int(os.getenv('SYNC_INTERVAL', 300))
    app.config['OFFLINE_MODE_ENABLED'] = os.getenv('OFFLINE_MODE_ENABLED', 'true').lower() == 'true'
    app.config['MAX_OFFLINE_DAYS'] = int(os.getenv('MAX_OFFLINE_DAYS', 7))
    
    # Configuración de almacenamiento
    app.config['MAX_LOCAL_STORAGE_MB'] = int(os.getenv('MAX_LOCAL_STORAGE_MB', 100))
    app.config['CACHE_TTL'] = int(os.getenv('CACHE_TTL', 3600))
    
    # Configuración de notificaciones
    app.config['NOTIFICATION_RETENTION_DAYS'] = int(os.getenv('NOTIFICATION_RETENTION_DAYS', 30))
    app.config['NOTIFICATION_BATCH_SIZE'] = int(os.getenv('NOTIFICATION_BATCH_SIZE', 50))
    
    # Configuración de reportes
    app.config['REPORT_MAX_ROWS'] = int(os.getenv('REPORT_MAX_ROWS', 10000))
    app.config['REPORT_CACHE_TTL'] = int(os.getenv('REPORT_CACHE_TTL', 3600))
    
    # Configuración de seguridad
    app.config['BLOCKED_IPS'] = os.getenv('BLOCKED_IPS', '').split(',')
    app.config['RATE_LIMIT'] = int(os.getenv('RATE_LIMIT', '100'))
    app.config['RATE_LIMIT_WINDOW'] = int(os.getenv('RATE_LIMIT_WINDOW', '3600'))
    
    # Inicializar extensiones
    db.init_app(app)
    migrate = Migrate(app, db)
    jwt = JWTManager(app)
    logger = StructuredLogger(app)
    
    # Configurar CORS
    setup_cors(app)
    
    # Inicializar monitoreo de errores
    init_error_monitoring(app)
    
    # Inicializar middlewares
    SecurityMiddleware(app)
    QueryMonitor(app)
    
    # Registrar blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(usuarios_bp, url_prefix='/api/usuarios')
    app.register_blueprint(configuracion_bp, url_prefix='/api/configuracion')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(clientes_bp, url_prefix='/api/clientes')
    app.register_blueprint(vehiculos_bp, url_prefix='/api/vehiculos')
    app.register_blueprint(servicios_bp, url_prefix='/api/servicios')
    app.register_blueprint(mecanicos_bp, url_prefix='/api/mecanicos')
    app.register_blueprint(inventario_bp, url_prefix='/api/inventario')
<<<<<<< HEAD
    app.register_blueprint(metrics_bp, url_prefix='/api/metrics')
    app.register_blueprint(sync_bp, url_prefix='/api/sync')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(restore_bp, url_prefix='/api/restore')
    app.register_blueprint(api_bp)  # Registrar blueprint de documentación
    
    # Configurar Swagger
    swagger_url = '/api/docs'
    api_url = '/static/swagger.json'
    swaggerui_blueprint = get_swaggerui_blueprint(
        swagger_url,
        api_url,
        config={
            'app_name': "AutoManager API"
        }
    )
    app.register_blueprint(swaggerui_blueprint, url_prefix=swagger_url)
=======
    app.register_blueprint(calendario_bp, url_prefix='/api/eventos')
<<<<<<< HEAD
    app.register_blueprint(facturas_bp, url_prefix='/api/facturas')
=======
>>>>>>> respaldo-AutoManager-v1.0
>>>>>>> cc4bc33f90ff4f4cfed9d9b715b5818b6f50788d
    
    # Ruta de health check
    @app.route('/api/health')
    @log_request
    def health_check():
        return jsonify({
            "status": "ok",
            "version": "1.0",
            "environment": os.getenv('FLASK_ENV', 'development'),
            "offline_mode": app.config['OFFLINE_MODE_ENABLED']
        })
    
    # Ruta raíz para documentación
    @app.route('/')
    @log_request
    def root():
        return jsonify({
            "api_version": "1.0",
            "documentation": "/api/docs",
            "environment": os.getenv('FLASK_ENV', 'development'),
            "endpoints": {
                "auth": "/api/auth",
                "usuarios": "/api/usuarios",
                "configuracion": "/api/configuracion",
                "clientes": "/api/clientes",
                "vehiculos": "/api/vehiculos",
                "servicios": "/api/servicios",
                "mecanicos": "/api/mecanicos",
                "inventario": "/api/inventario",
                "metrics": "/api/metrics",
                "sync": "/api/sync",
                "notifications": "/api/notifications",
                "reports": "/api/reports"
            }
        })
    
    # Manejador de errores global
    @app.errorhandler(404)
    def not_found(error):
        metrics.increment('http_errors', 1, {'status_code': 404})
        return jsonify({"error": "Recurso no encontrado"}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        metrics.increment('http_errors', 1, {'status_code': 500})
        app.logger.error(f"Error interno: {str(error)}")
        return jsonify({"error": "Error interno del servidor"}), 500
    
    # Middleware para manejar CORS preflight
    @app.before_request
    def handle_preflight_request():
        return handle_preflight()
    
    # Crear tablas si no existen
    with app.app_context():
<<<<<<< HEAD
        db.create_all()  # Usar create_all para SQLite
=======
<<<<<<< HEAD
        db.create_all()
        app.logger.info("Tablas verificadas correctamente")
=======
        # db.create_all()  # Comentamos esta línea para usar migraciones
>>>>>>> cc4bc33f90ff4f4cfed9d9b715b5818b6f50788d
        logger.info("Tablas verificadas correctamente")
>>>>>>> respaldo-AutoManager-v1.0
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(
        debug=os.getenv('FLASK_ENV', 'development') == 'development',
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000))
    ) 
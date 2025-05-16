from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from extensions import db
from middleware import setup_cors, handle_preflight
from flask_cors import CORS
from flask_migrate import Migrate
import logging
from datetime import timedelta
from blueprints.auth import auth_bp
from blueprints.clientes import bp as clientes_bp
from blueprints.vehiculos import bp as vehiculos_bp
from blueprints.servicios import servicios_bp
from blueprints.mecanicos import mecanicos_bp
from blueprints.usuarios import usuarios_bp
from blueprints.configuracion import configuracion_bp
from blueprints.dashboard import bp as dashboard_bp
from blueprints.inventario import inventario_bp

def create_app():
    app = Flask(__name__)
    
    # Configuración
    app.config['SECRET_KEY'] = 'tu_clave_secreta_aqui'  # Cambiar en producción
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///automanager.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'tu-clave-secreta'  # Cambiar en producción
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 86400  # 24 horas
    
    # Configurar logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    # Inicializar extensiones
    db.init_app(app)
    migrate = Migrate(app, db)
    jwt = JWTManager(app)
    
    # Configurar CORS
    setup_cors(app)
    
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
    
    # Ruta de health check
    @app.route('/api/health')
    def health_check():
        return jsonify({"status": "ok"})
    
    # Ruta raíz para documentación
    @app.route('/')
    def root():
        return jsonify({
            "api_version": "1.0",
            "documentation": "/api/docs",
            "endpoints": {
                "auth": "/api/auth",
                "usuarios": "/api/usuarios",
                "configuracion": "/api/configuracion",
                "clientes": "/api/clientes",
                "vehiculos": "/api/vehiculos",
                "servicios": "/api/servicios",
                "mecanicos": "/api/mecanicos"
            }
        })
    
    # Manejador de errores global
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Recurso no encontrado"}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Error interno: {str(error)}")
        return jsonify({"error": "Error interno del servidor"}), 500
    
    # Middleware para manejar CORS preflight
    @app.before_request
    def handle_preflight_request():
        return handle_preflight()
    
    # Crear tablas si no existen
    with app.app_context():
        db.create_all()
        logger.info("Tablas verificadas correctamente")
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000) 
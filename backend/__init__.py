from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_name='default'):
    app = Flask(__name__)
    
    # Configuración
    app.config.from_object(config[config_name])
    
    # Inicializar extensiones
    db.init_app(app)
    jwt.init_app(app)
    
    # Registrar blueprints
    from .blueprints.auth import auth_bp
    from .blueprints.clientes import clientes_bp
    from .blueprints.vehiculos import vehiculos_bp
    from .blueprints.servicios import servicios_bp
    from .blueprints.mecanicos import mecanicos_bp
    from .blueprints.horas_trabajo import horas_trabajo_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(clientes_bp, url_prefix='/api')
    app.register_blueprint(vehiculos_bp, url_prefix='/api')
    app.register_blueprint(servicios_bp, url_prefix='/api')
    app.register_blueprint(mecanicos_bp, url_prefix='/api')
    app.register_blueprint(horas_trabajo_bp, url_prefix='/api')
    
    return app 
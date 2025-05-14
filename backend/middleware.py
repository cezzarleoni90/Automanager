from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from flask_cors import CORS
from models import Usuario

def setup_cors(app):
    """Configura CORS para la aplicación"""
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "Accept"],
            "expose_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "max_age": 3600
        }
    })

def handle_preflight():
    """Maneja las peticiones OPTIONS para CORS"""
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization,Accept")
        response.headers.add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        response.headers.add("Access-Control-Max-Age", "3600")
        return response
    return None

def require_roles(*roles):
    """Decorador para requerir roles específicos"""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get("rol") not in roles:
                return jsonify({"error": "No autorizado"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def handle_errors(fn):
    """Decorador para manejar errores de manera centralizada"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            # Log del error
            print(f"Error en {fn.__name__}: {str(e)}")
            return jsonify({"error": str(e)}), 500
    return wrapper

def validate_json(*required_fields):
    """Decorador para validar campos JSON requeridos"""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if not request.is_json:
                return jsonify({"error": "Se requiere JSON"}), 400
            
            data = request.get_json()
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                return jsonify({
                    "error": f"Campos requeridos faltantes: {', '.join(missing_fields)}"
                }), 400
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def get_current_user():
    """Obtiene el usuario actual basado en el token JWT"""
    verify_jwt_in_request()
    user_id = get_jwt()["sub"]
    return Usuario.query.get(user_id) 
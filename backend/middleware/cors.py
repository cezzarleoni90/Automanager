from flask import request, jsonify, current_app
from functools import wraps
from typing import Callable, Any, List, Optional

def setup_cors(app) -> None:
    """Configura CORS para la aplicación"""
    # Configurar orígenes permitidos
    allowed_origins = app.config.get('CORS_ORIGINS', ['*'])
    allowed_methods = app.config.get('CORS_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    allowed_headers = app.config.get('CORS_HEADERS', ['Content-Type', 'Authorization'])
    exposed_headers = app.config.get('CORS_EXPOSE_HEADERS', ['X-Query-Count', 'X-Query-Time'])
    max_age = app.config.get('CORS_MAX_AGE', 3600)
    
    @app.after_request
    def after_request(response):
        """Agrega headers CORS a la respuesta"""
        origin = request.headers.get('Origin')
        
        # Verificar origen
        if origin and (allowed_origins == ['*'] or origin in allowed_origins):
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Methods'] = ', '.join(allowed_methods)
            response.headers['Access-Control-Allow-Headers'] = ', '.join(allowed_headers)
            response.headers['Access-Control-Expose-Headers'] = ', '.join(exposed_headers)
            response.headers['Access-Control-Max-Age'] = str(max_age)
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        
        return response

def handle_preflight() -> Optional[tuple]:
    """Maneja solicitudes preflight OPTIONS"""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    return None

def cors_required(origins: Optional[List[str]] = None) -> Callable:
    """Decorador para requerir CORS en una ruta específica"""
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args: Any, **kwargs: Any) -> Any:
            # Verificar origen
            origin = request.headers.get('Origin')
            allowed_origins = origins or current_app.config.get('CORS_ORIGINS', ['*'])
            
            if origin and (allowed_origins == ['*'] or origin in allowed_origins):
                return f(*args, **kwargs)
            
            return jsonify({"error": "Origen no permitido"}), 403
        
        return decorated_function
    return decorator 
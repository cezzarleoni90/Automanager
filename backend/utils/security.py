from flask import request, current_app, jsonify
from functools import wraps
from utils.logger import log_activity
import re
import hashlib
import secrets
from typing import Callable, Any, Optional, List
import jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import logging

# Cargar variables de entorno
load_dotenv()

logger = logging.getLogger(__name__)

class SecurityManager:
    """Gestor de seguridad para la aplicación"""
    
    @staticmethod
    def validate_password(password: str) -> bool:
        """Valida que la contraseña cumpla con los requisitos mínimos"""
        if len(password) < 8:
            return False
            
        # Requisitos: mayúscula, minúscula, número y carácter especial
        patterns = [
            r'[A-Z]',  # Mayúscula
            r'[a-z]',  # Minúscula
            r'[0-9]',  # Número
            r'[!@#$%^&*(),.?":{}|<>]'  # Carácter especial
        ]
        
        return all(re.search(pattern, password) for pattern in patterns)
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Genera un hash seguro de la contraseña"""
        salt = secrets.token_hex(16)
        hash_obj = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000  # Número de iteraciones
        )
        return f"{salt}${hash_obj.hex()}"
    
    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """Verifica si la contraseña coincide con el hash"""
        try:
            salt, stored_hash = hashed.split('$')
            hash_obj = hashlib.pbkdf2_hmac(
                'sha256',
                password.encode('utf-8'),
                salt.encode('utf-8'),
                100000
            )
            return hash_obj.hex() == stored_hash
        except Exception:
            return False
    
    @staticmethod
    def generate_token(user_id: int, role: str) -> str:
        """Genera un token JWT"""
        payload = {
            'user_id': user_id,
            'role': role,
            'exp': datetime.utcnow() + timedelta(hours=1),
            'iat': datetime.utcnow()
        }
        return jwt.encode(
            payload,
            os.getenv('JWT_SECRET_KEY', 'dev-key-change-in-production'),
            algorithm='HS256'
        )
    
    @staticmethod
    def verify_token(token: str) -> Optional[dict]:
        """Verifica un token JWT"""
        try:
            return jwt.decode(
                token,
                os.getenv('JWT_SECRET_KEY', 'dev-key-change-in-production'),
                algorithms=['HS256']
            )
        except jwt.ExpiredSignatureError:
            log_activity('security', "Token expirado")
            return None
        except jwt.InvalidTokenError:
            log_activity('security', "Token inválido")
            return None
    
    @staticmethod
    def sanitize_input(data: str) -> str:
        """Sanitiza la entrada de datos"""
        # Eliminar caracteres especiales y scripts
        data = re.sub(r'<[^>]*>', '', data)  # Eliminar HTML
        data = re.sub(r'javascript:', '', data, flags=re.IGNORECASE)  # Eliminar javascript
        return data.strip()
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Valida formato de email"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))

def require_roles(*roles: str) -> Callable:
    """Decorador para requerir roles específicos
    
    Args:
        *roles: Lista de roles permitidos
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args: Any, **kwargs: Any) -> Any:
            # Obtener el rol del usuario del token JWT
            user_role = getattr(request, 'user_role', None)
            
            if not user_role:
                return jsonify({'error': 'No se proporcionó rol de usuario'}), 401
            
            if user_role not in roles:
                return jsonify({'error': 'No tiene permisos para acceder a este recurso'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def block_sql_injection(f: Callable) -> Callable:
    """Decorador para prevenir inyección SQL
    
    Args:
        f: Función a decorar
    """
    @wraps(f)
    def decorated_function(*args: Any, **kwargs: Any) -> Any:
        # Patrones comunes de inyección SQL
        sql_patterns = [
            r'(\%27)|(\')|(\-\-)|(\%23)|(#)',
            r'((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))',
            r'/\*.*\*/',
            r'(\%27)|(\')|(\-\-)|(\%23)|(#)',
            r'((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))',
            r'/\*.*\*/',
            r'(\%27)|(\')|(\-\-)|(\%23)|(#)',
            r'((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))',
            r'/\*.*\*/'
        ]
        
        # Verificar parámetros de URL
        for key, value in request.args.items():
            for pattern in sql_patterns:
                if re.search(pattern, str(value), re.IGNORECASE):
                    logger.warning(f"Intento de inyección SQL detectado en parámetros URL: {key}={value}")
                    return jsonify({'error': 'Parámetros inválidos'}), 400
        
        # Verificar datos del cuerpo
        if request.is_json:
            for key, value in request.json.items():
                for pattern in sql_patterns:
                    if re.search(pattern, str(value), re.IGNORECASE):
                        logger.warning(f"Intento de inyección SQL detectado en cuerpo JSON: {key}={value}")
                        return jsonify({'error': 'Datos inválidos'}), 400
        
        return f(*args, **kwargs)
    return decorated_function

def prevent_xss(f: Callable) -> Callable:
    """Decorador para prevenir ataques XSS
    
    Args:
        f: Función a decorar
    """
    @wraps(f)
    def decorated_function(*args: Any, **kwargs: Any) -> Any:
        # Patrones comunes de XSS
        xss_patterns = [
            r'<script.*?>.*?</script>',
            r'javascript:',
            r'vbscript:',
            r'onload=',
            r'onerror=',
            r'onmouseover=',
            r'<img.*?src=.*?>',
            r'<iframe.*?>.*?</iframe>',
            r'<object.*?>.*?</object>',
            r'<embed.*?>.*?</embed>'
        ]
        
        def check_value(value: str) -> bool:
            """Verifica si un valor contiene patrones XSS"""
            if not isinstance(value, str):
                return False
            for pattern in xss_patterns:
                if re.search(pattern, value, re.IGNORECASE):
                    return True
            return False
        
        # Verificar parámetros de URL
        for key, value in request.args.items():
            if check_value(str(value)):
                logger.warning(f"Intento de XSS detectado en parámetros URL: {key}={value}")
                return jsonify({'error': 'Parámetros inválidos'}), 400
        
        # Verificar datos del cuerpo
        if request.is_json:
            for key, value in request.json.items():
                if check_value(str(value)):
                    logger.warning(f"Intento de XSS detectado en cuerpo JSON: {key}={value}")
                    return jsonify({'error': 'Datos inválidos'}), 400
        
        return f(*args, **kwargs)
    return decorated_function

def validate_request_data(required_fields: List[str]) -> Callable:
    """Decorador para validar campos requeridos en la solicitud
    
    Args:
        required_fields: Lista de campos requeridos
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args: Any, **kwargs: Any) -> Any:
            if not request.is_json:
                return jsonify({'error': 'Se requiere JSON'}), 400
            
            missing_fields = [field for field in required_fields if field not in request.json]
            if missing_fields:
                return jsonify({
                    'error': 'Campos requeridos faltantes',
                    'missing_fields': missing_fields
                }), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def rate_limit(limit: int = 100, window: int = 3600):
    """Decorador para limitar el número de peticiones"""
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args: Any, **kwargs: Any) -> Any:
            # Implementar lógica de rate limiting con Redis
            # Por ahora solo un placeholder
            return f(*args, **kwargs)
        return decorated_function
    return decorator 
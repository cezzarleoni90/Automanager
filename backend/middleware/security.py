from flask import request, g, current_app, jsonify
from utils.logger import log_activity
from utils.security import SecurityManager
import time
from functools import wraps
from typing import Callable, Any, Dict, List, Optional
import re

class SecurityMiddleware:
    """Middleware para implementar medidas de seguridad básicas"""
    
    def __init__(self, app):
        self.app = app
        self.rate_limits: Dict[str, List[float]] = {}
        self.blocked_ips: List[str] = app.config.get('BLOCKED_IPS', [])
        self.rate_limit = app.config.get('RATE_LIMIT', 100)
        self.rate_limit_window = app.config.get('RATE_LIMIT_WINDOW', 3600)
        
        # Patrones de SQL injection
        self.sql_patterns = [
            r'(\%27)|(\')|(\-\-)|(\%23)|(#)',
            r'((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))',
            r'/\*.*\*/',
            r'exec\s+xp_cmdshell',
            r'select\s+.*\s+from',
            r'union\s+.*\s+select',
            r'insert\s+.*\s+into',
            r'delete\s+.*\s+from',
            r'drop\s+.*\s+table',
            r'truncate\s+.*\s+table'
        ]
        
        # Patrones de XSS
        self.xss_patterns = [
            r'<script.*?>.*?</script>',
            r'javascript:',
            r'onerror=',
            r'onload=',
            r'eval\(',
            r'document\.cookie',
            r'alert\(',
            r'confirm\(',
            r'prompt\('
        ]
        
        # Registrar middleware
        @app.before_request
        def before_request():
            self._check_ip()
            self._check_rate_limit()
            self._check_sql_injection()
            self._check_xss()
        
        @app.after_request
        def after_request(response):
            # Agregar headers de seguridad
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            response.headers['Content-Security-Policy'] = "default-src 'self'"
            
            return response
    
    def _check_ip(self) -> None:
        """Verifica si la IP está bloqueada"""
        client_ip = request.remote_addr
        if client_ip in self.blocked_ips:
            current_app.logger.warning(f"Intento de acceso desde IP bloqueada: {client_ip}")
            return jsonify({"error": "Acceso denegado"}), 403
    
    def _check_rate_limit(self) -> None:
        """Verifica el límite de tasa de solicitudes"""
        client_ip = request.remote_addr
        current_time = time.time()
        
        # Limpiar solicitudes antiguas
        if client_ip in self.rate_limits:
            self.rate_limits[client_ip] = [
                t for t in self.rate_limits[client_ip]
                if current_time - t < self.rate_limit_window
            ]
        
        # Verificar límite
        if client_ip in self.rate_limits and len(self.rate_limits[client_ip]) >= self.rate_limit:
            current_app.logger.warning(f"Límite de tasa excedido para IP: {client_ip}")
            return jsonify({"error": "Demasiadas solicitudes"}), 429
        
        # Registrar solicitud
        if client_ip not in self.rate_limits:
            self.rate_limits[client_ip] = []
        self.rate_limits[client_ip].append(current_time)
    
    def _check_sql_injection(self) -> None:
        """Verifica intentos de SQL injection"""
        # Verificar parámetros de URL
        for key, value in request.args.items():
            if self._matches_patterns(value, self.sql_patterns):
                current_app.logger.warning(f"Posible SQL injection detectado en parámetro {key}")
                return jsonify({"error": "Solicitud inválida"}), 400
        
        # Verificar datos JSON
        if request.is_json:
            for key, value in request.get_json().items():
                if isinstance(value, str) and self._matches_patterns(value, self.sql_patterns):
                    current_app.logger.warning(f"Posible SQL injection detectado en campo {key}")
                    return jsonify({"error": "Solicitud inválida"}), 400
    
    def _check_xss(self) -> None:
        """Verifica intentos de XSS"""
        # Verificar parámetros de URL
        for key, value in request.args.items():
            if self._matches_patterns(value, self.xss_patterns):
                current_app.logger.warning(f"Posible XSS detectado en parámetro {key}")
                return jsonify({"error": "Solicitud inválida"}), 400
        
        # Verificar datos JSON
        if request.is_json:
            for key, value in request.get_json().items():
                if isinstance(value, str) and self._matches_patterns(value, self.xss_patterns):
                    current_app.logger.warning(f"Posible XSS detectado en campo {key}")
                    return jsonify({"error": "Solicitud inválida"}), 400
    
    def _matches_patterns(self, value: str, patterns: List[str]) -> bool:
        """Verifica si un valor coincide con alguno de los patrones"""
        if not isinstance(value, str):
            return False
        return any(re.search(pattern, value, re.IGNORECASE) for pattern in patterns)
    
    def block_ip(self, ip: str) -> None:
        """Bloquea una IP"""
        if ip not in self.blocked_ips:
            self.blocked_ips.append(ip)
            current_app.logger.info(f"IP bloqueada: {ip}")
    
    def unblock_ip(self, ip: str) -> None:
        """Desbloquea una IP"""
        if ip in self.blocked_ips:
            self.blocked_ips.remove(ip)
            current_app.logger.info(f"IP desbloqueada: {ip}")
    
    def get_blocked_ips(self) -> List[str]:
        """Obtiene la lista de IPs bloqueadas"""
        return self.blocked_ips.copy()
    
    def get_rate_limits(self) -> Dict[str, int]:
        """Obtiene el número de solicitudes por IP"""
        return {
            ip: len(times)
            for ip, times in self.rate_limits.items()
        }

def block_sql_injection(f: Callable) -> Callable:
    """Decorador para prevenir SQL Injection"""
    @wraps(f)
    def decorated_function(*args: Any, **kwargs: Any) -> Any:
        # Patrones de SQL Injection
        sql_patterns = [
            r'(\%27)|(\')|(\-\-)|(\%23)|(#)',
            r'((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))',
            r'/\*.*\*/',
            r'exec\s+xp_cmdshell',
            r'select.*from',
            r'insert.*into',
            r'delete.*from',
            r'drop.*table',
            r'truncate.*table',
            r'update.*set'
        ]
        
        # Verificar parámetros de URL
        for key, value in request.args.items():
            if any(re.search(pattern, value, re.IGNORECASE) for pattern in sql_patterns):
                log_activity(
                    'security',
                    f"Intento de SQL Injection detectado en URL: {value}"
                )
                return {'error': 'Parámetros inválidos'}, 400
        
        # Verificar datos del body
        if request.is_json:
            data = request.get_json()
            for key, value in data.items():
                if isinstance(value, str):
                    if any(re.search(pattern, value, re.IGNORECASE) for pattern in sql_patterns):
                        log_activity(
                            'security',
                            f"Intento de SQL Injection detectado en body: {value}"
                        )
                        return {'error': 'Datos inválidos'}, 400
        
        return f(*args, **kwargs)
    return decorated_function

def prevent_xss(f: Callable) -> Callable:
    """Decorador para prevenir XSS"""
    @wraps(f)
    def decorated_function(*args: Any, **kwargs: Any) -> Any:
        # Patrones de XSS
        xss_patterns = [
            r'<script.*?>.*?</script>',
            r'javascript:',
            r'onerror=',
            r'onload=',
            r'eval\(',
            r'document\.cookie',
            r'window\.location'
        ]
        
        # Verificar datos del body
        if request.is_json:
            data = request.get_json()
            for key, value in data.items():
                if isinstance(value, str):
                    if any(re.search(pattern, value, re.IGNORECASE) for pattern in xss_patterns):
                        log_activity(
                            'security',
                            f"Intento de XSS detectado: {value}"
                        )
                        return {'error': 'Datos inválidos'}, 400
        
        return f(*args, **kwargs)
    return decorated_function 
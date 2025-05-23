import logging
import json
from datetime import datetime
from functools import wraps
from flask import request, g, current_app
import time
import psutil
import threading
from typing import Any, Callable, Dict, Optional
import traceback
import os

class StructuredLogger:
    """Logger estructurado para la aplicación"""
    
    def __init__(self, app):
        """Inicializa el logger
        
        Args:
            app: Aplicación Flask
        """
        self.app = app
        self.logger = logging.getLogger('automanager')
        self.logger.setLevel(logging.INFO)
        
        # Crear directorio de logs si no existe
        if not os.path.exists('logs'):
            os.makedirs('logs')
        
        # Configurar handler para archivo
        file_handler = logging.FileHandler('logs/app.log')
        file_handler.setLevel(logging.INFO)
        
        # Configurar formato
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        file_handler.setFormatter(formatter)
        
        # Agregar handler
        self.logger.addHandler(file_handler)
        
        # Configurar logger para la aplicación
        app.logger = self.logger
    
    def info(self, message: str, extra_data: Optional[Dict] = None):
        """Registra un mensaje de nivel INFO"""
        self._log(logging.INFO, message, extra_data)
    
    def error(self, message: str, extra_data: Optional[Dict] = None):
        """Registra un mensaje de nivel ERROR"""
        self._log(logging.ERROR, message, extra_data)
    
    def warning(self, message: str, extra_data: Optional[Dict] = None):
        """Registra un mensaje de nivel WARNING"""
        self._log(logging.WARNING, message, extra_data)
    
    def debug(self, message: str, extra_data: Optional[Dict] = None):
        """Registra un mensaje de nivel DEBUG"""
        self._log(logging.DEBUG, message, extra_data)
    
    def _log(self, level: int, message: str, extra_data: Optional[Dict] = None):
        """Registra un mensaje con datos adicionales"""
        if extra_data is None:
            extra_data = {}
        
        self.logger.log(level, message, extra={'extra_data': extra_data})

def init_logger(app):
    """Inicializa el sistema de logging
    
    Args:
        app: Instancia de la aplicación Flask
    """
    # Configurar logger principal
    logger = StructuredLogger(app)
    
    # Configurar nivel de logging según el entorno
    if app.config.get('FLASK_ENV') == 'development':
        logger.logger.setLevel(logging.DEBUG)
    else:
        logger.logger.setLevel(logging.INFO)
    
    return logger

def log_request(f: Callable) -> Callable:
    """Decorador para registrar información de las peticiones HTTP"""
    @wraps(f)
    def decorated_function(*args: Any, **kwargs: Any) -> Any:
        start_time = time.time()
        
        # Obtener información de la petición
        request_data = {
            'method': request.method,
            'path': request.path,
            'remote_addr': request.remote_addr,
            'user_agent': request.user_agent.string
        }
        
        # Registrar inicio de la petición
        current_app.logger.info(
            f"Iniciando petición {request.method} {request.path}",
            extra_data=request_data
        )
        
        try:
            response = f(*args, **kwargs)
            duration = time.time() - start_time
            
            # Registrar fin de la petición exitosa
            current_app.logger.info(
                f"Petición completada en {duration:.2f}s",
                extra_data={
                    **request_data,
                    'duration': duration,
                    'status_code': getattr(response, 'status_code', 200)
                }
            )
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            
            # Registrar error
            current_app.logger.error(
                f"Error en petición: {str(e)}",
                extra_data={
                    **request_data,
                    'duration': duration,
                    'error': str(e)
                }
            )
            
            raise
    
    return decorated_function

def measure_time(operation: str) -> Callable:
    """Decorador para medir el tiempo de ejecución de operaciones"""
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args: Any, **kwargs: Any) -> Any:
            start_time = time.time()
            
            try:
                result = f(*args, **kwargs)
                duration = time.time() - start_time
                
                # Registrar duración de la operación
                current_app.logger.info(
                    f"Operación {operation} completada",
                    extra_data={
                        'operation': operation,
                        'duration': duration
                    }
                )
                
                return result
                
            except Exception as e:
                duration = time.time() - start_time
                
                # Registrar error
                current_app.logger.error(
                    f"Error en operación {operation}: {str(e)}",
                    extra_data={
                        'operation': operation,
                        'duration': duration,
                        'error': str(e)
                    }
                )
                
                raise
        
        return decorated_function
    return decorator

def metrics(metric_name: str) -> Callable:
    """Decorador para registrar métricas de operaciones"""
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args: Any, **kwargs: Any) -> Any:
            start_time = time.time()
            
            try:
                result = f(*args, **kwargs)
                duration = time.time() - start_time
                
                # Registrar métrica
                current_app.logger.info(
                    f"Métrica {metric_name} registrada",
                    extra_data={
                        'metric': metric_name,
                        'value': duration,
                        'type': 'duration'
                    }
                )
                
                return result
                
            except Exception as e:
                duration = time.time() - start_time
                
                # Registrar error
                current_app.logger.error(
                    f"Error en métrica {metric_name}: {str(e)}",
                    extra_data={
                        'metric': metric_name,
                        'duration': duration,
                        'error': str(e)
                    }
                )
                
                raise
        
        return decorated_function
    return decorator

def log_activity(activity_type: str, description: str, **kwargs: Any) -> None:
    """Función para registrar actividades del sistema"""
    current_app.logger.info(
        description,
        extra_data={
            'activity_type': activity_type,
            'user_id': g.get('user_id'),
            'timestamp': datetime.utcnow().isoformat(),
            **kwargs
        }
    )

# Métricas básicas
class Metrics:
    def __init__(self):
        self._metrics = {}
        self._metrics_lock = threading.Lock()
    
    def increment(self, metric_name: str, value: int = 1, labels: Optional[Dict] = None) -> None:
        """Incrementar un contador"""
        with self._metrics_lock:
            key = self._get_metric_key(metric_name, labels)
            if key not in self._metrics:
                self._metrics[key] = 0
            self._metrics[key] += value
    
    def set(self, metric_name: str, value: float, labels: Optional[Dict] = None) -> None:
        """Establecer un valor para una métrica"""
        with self._metrics_lock:
            key = self._get_metric_key(metric_name, labels)
            self._metrics[key] = value
    
    def get(self, metric_name: str, labels: Optional[Dict] = None) -> float:
        """Obtener el valor de una métrica"""
        with self._metrics_lock:
            key = self._get_metric_key(metric_name, labels)
            return self._metrics.get(key, 0)
    
    def _get_metric_key(self, metric_name: str, labels: Optional[Dict] = None) -> str:
        """Generar una clave única para la métrica con sus etiquetas"""
        if not labels:
            return metric_name
        label_str = ','.join(f"{k}={v}" for k, v in sorted(labels.items()))
        return f"{metric_name}{{{label_str}}}"
    
    def get_all_metrics(self) -> Dict:
        """Obtener todas las métricas"""
        with self._metrics_lock:
            return self._metrics.copy()
    
    def get_metric_summary(self) -> Dict:
        """Obtener un resumen de las métricas más importantes"""
        with self._metrics_lock:
            return {
                'http_requests': {
                    'total': sum(v for k, v in self._metrics.items() if k.startswith('http_requests_total')),
                    'errors': sum(v for k, v in self._metrics.items() if k.startswith('http_errors_total')),
                    'avg_duration': sum(v for k, v in self._metrics.items() if k.startswith('http_request_duration_seconds')) / 
                                  max(1, sum(1 for k in self._metrics if k.startswith('http_request_duration_seconds')))
                },
                'system': {
                    'cpu_percent': self._metrics.get('system_cpu_percent', 0),
                    'memory_percent': self._metrics.get('system_memory_percent', 0),
                    'disk_percent': self._metrics.get('system_disk_percent', 0)
                },
                'activities': {
                    'total': sum(v for k, v in self._metrics.items() if k.startswith('activity_total'))
                }
            }

# Instancia global de métricas
metrics = Metrics() 
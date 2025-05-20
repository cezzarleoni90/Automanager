import logging
from datetime import datetime
from typing import Dict, Any, Optional
from flask import current_app, request

class ErrorMonitor:
    """Sistema simple de monitoreo de errores"""
    
    def __init__(self):
        self.logger = logging.getLogger('error_monitor')
        self.logger.setLevel(logging.ERROR)
        
        # Configurar handler para archivo
        handler = logging.FileHandler('error.log')
        handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        ))
        self.logger.addHandler(handler)
        
        # Métricas de errores
        self._error_counts: Dict[str, int] = {}
        self._last_errors: Dict[str, datetime] = {}
    
    def capture_exception(self, exc: Exception, context: Optional[Dict[str, Any]] = None) -> None:
        """Captura una excepción y la registra"""
        error_type = type(exc).__name__
        
        # Actualizar métricas
        self._error_counts[error_type] = self._error_counts.get(error_type, 0) + 1
        self._last_errors[error_type] = datetime.utcnow()
        
        # Preparar contexto
        error_context = {
            'error_type': error_type,
            'error_message': str(exc),
            'timestamp': datetime.utcnow().isoformat(),
            'request_path': request.path if request else None,
            'request_method': request.method if request else None,
            'user_id': getattr(request, 'user_id', None) if request else None
        }
        
        if context:
            error_context.update(context)
        
        # Registrar error
        self.logger.error(
            f"Error capturado: {error_type}",
            extra={'error_context': error_context}
        )
    
    def get_error_stats(self) -> Dict[str, Any]:
        """Obtiene estadísticas de errores"""
        return {
            'total_errors': sum(self._error_counts.values()),
            'error_counts': self._error_counts,
            'last_errors': {
                error_type: last_time.isoformat()
                for error_type, last_time in self._last_errors.items()
            }
        }

# Instancia global del monitor de errores
error_monitor = ErrorMonitor()

def init_error_monitoring(app) -> None:
    """Inicializa el sistema de monitoreo de errores"""
    # Configurar el logger de la aplicación
    app.logger.setLevel(logging.ERROR)
    
    # Agregar handler para archivo
    handler = logging.FileHandler('app.log')
    handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))
    app.logger.addHandler(handler)
    
    # Registrar inicio del sistema
    app.logger.info("Sistema de monitoreo de errores inicializado")

def capture_exception(exc: Exception, context: Optional[Dict[str, Any]] = None) -> None:
    """Función de conveniencia para capturar excepciones"""
    error_monitor.capture_exception(exc, context)

def get_error_stats() -> Dict[str, Any]:
    """Función de conveniencia para obtener estadísticas de errores"""
    return error_monitor.get_error_stats() 
from flask import request, g, current_app, has_request_context
from utils.logger import log_activity
from utils.query_optimizer import QueryOptimizer
import time
from functools import wraps
from typing import Callable, Any, Dict, List, Optional
import threading
from sqlalchemy import event
from sqlalchemy.engine import Engine

def monitor_queries(f: Callable) -> Callable:
    """Decorador para monitorear consultas en una ruta"""
    @wraps(f)
    def decorated_function(*args: Any, **kwargs: Any) -> Any:
        # Inicializar métricas
        g.query_count = 0
        g.query_time = 0
        g.slow_queries = []
        
        # Ejecutar función
        start_time = time.time()
        result = f(*args, **kwargs)
        total_time = time.time() - start_time
        
        # Registrar métricas
        if g.query_count > 0:
            log_activity(
                'query_metrics',
                f"Ruta: {request.path} - Queries: {g.query_count} - Tiempo total: {total_time:.2f}s",
                metadata={
                    'path': request.path,
                    'method': request.method,
                    'query_count': g.query_count,
                    'total_time': total_time,
                    'avg_query_time': g.query_time / g.query_count,
                    'slow_queries': g.slow_queries
                }
            )
        
        return result
    return decorated_function

def track_query(query: Any) -> Any:
    """Monitorea una consulta individual"""
    if not hasattr(g, 'query_count'):
        g.query_count = 0
        g.query_time = 0
        g.slow_queries = []
    
    # Analizar consulta
    stats = QueryOptimizer.analyze_query(query)
    
    # Actualizar métricas
    g.query_count += 1
    g.query_time += stats['execution_time']
    
    # Registrar consultas lentas
    if stats['execution_time'] > 1.0:  # Más de 1 segundo
        g.slow_queries.append({
            'query': str(query),
            'time': stats['execution_time'],
            'plan': stats['plan']
        })
    
    return query

class QueryMonitor:
    """Monitor de consultas SQL"""
    
    def __init__(self, app=None):
        """Inicializa el monitor de consultas
        
        Args:
            app: Aplicación Flask (opcional)
        """
        self._query_logs = {}
        self._query_stats = {}
        self._lock = threading.Lock()
        
        # Registrar listeners
        event.listen(Engine, 'before_cursor_execute', self._before_cursor_execute)
        event.listen(Engine, 'after_cursor_execute', self._after_cursor_execute)
        
        # Configurar aplicación si se proporciona
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Inicializa el monitor con la aplicación Flask
        
        Args:
            app: Aplicación Flask
        """
        # Registrar eventos
        @app.before_request
        def before_request():
            g.query_count = 0
            g.query_time = 0
            g.slow_queries = []
        
        @app.after_request
        def after_request(response):
            if hasattr(g, 'query_count') and g.query_count > 0:
                # Agregar headers de métricas
                response.headers['X-Query-Count'] = str(g.query_count)
                response.headers['X-Query-Time'] = f"{g.query_time:.2f}"
                
                # Registrar métricas
                log_activity(
                    'request_metrics',
                    f"Ruta: {request.path} - Queries: {g.query_count} - Tiempo: {g.query_time:.2f}s",
                    metadata={
                        'path': request.path,
                        'method': request.method,
                        'status': response.status_code,
                        'query_count': g.query_count,
                        'query_time': g.query_time,
                        'slow_queries': g.slow_queries
                    }
                )
            
            return response
    
    def _before_cursor_execute(self, conn, cursor, statement, parameters, context, executemany):
        """Callback antes de ejecutar una consulta"""
        context._query_start_time = time.time()
    
    def _after_cursor_execute(self, conn, cursor, statement, parameters, context, executemany):
        """Callback después de ejecutar una consulta"""
        try:
            # Obtener tiempo de ejecución
            duration = time.time() - context._query_start_time
            
            # Obtener endpoint o usar 'system' para operaciones fuera de request
            endpoint = 'system'
            if has_request_context():
                endpoint = request.endpoint or 'unknown'
            
            # Registrar consulta
            with self._lock:
                if endpoint not in self._query_logs:
                    self._query_logs[endpoint] = []
                
                self._query_logs[endpoint].append({
                    'statement': statement,
                    'parameters': parameters,
                    'duration': duration,
                    'timestamp': time.time()
                })
                
                # Mantener solo las últimas 1000 consultas
                if len(self._query_logs[endpoint]) > 1000:
                    self._query_logs[endpoint] = self._query_logs[endpoint][-1000:]
                
                # Actualizar estadísticas
                if endpoint not in self._query_stats:
                    self._query_stats[endpoint] = {
                        'total_queries': 0,
                        'total_duration': 0,
                        'avg_duration': 0,
                        'max_duration': 0,
                        'min_duration': float('inf')
                    }
                
                stats = self._query_stats[endpoint]
                stats['total_queries'] += 1
                stats['total_duration'] += duration
                stats['avg_duration'] = stats['total_duration'] / stats['total_queries']
                stats['max_duration'] = max(stats['max_duration'], duration)
                stats['min_duration'] = min(stats['min_duration'], duration)
            
            # Registrar consulta lenta
            if duration > 1.0:  # Más de 1 segundo
                log_activity(
                    'slow_query',
                    f"Consulta lenta detectada en {endpoint}",
                    statement=statement,
                    duration=duration
                )
                
                # Analizar consulta
                try:
                    analysis = QueryOptimizer.analyze_query(statement)
                    if analysis['execution_time'] > 1.0:
                        log_activity(
                            'query_optimization_needed',
                            f"Se recomienda optimizar consulta en {endpoint}",
                            analysis=analysis
                        )
                except Exception as e:
                    log_activity(
                        'query_analysis_error',
                        f"Error analizando consulta: {str(e)}"
                    )
        
        except Exception as e:
            log_activity(
                'query_monitor_error',
                f"Error en monitor de consultas: {str(e)}"
            )
    
    def get_query_stats(self, endpoint: Optional[str] = None) -> Dict[str, Any]:
        """Obtiene estadísticas de consultas
        
        Args:
            endpoint: Endpoint específico o None para todas las estadísticas
            
        Returns:
            Diccionario con estadísticas
        """
        with self._lock:
            if endpoint:
                return self._query_stats.get(endpoint, {})
            return self._query_stats
    
    def get_recent_queries(self, endpoint: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Obtiene consultas recientes
        
        Args:
            endpoint: Endpoint específico o None para todas las consultas
            limit: Número máximo de consultas a retornar
            
        Returns:
            Lista de consultas recientes
        """
        with self._lock:
            if endpoint:
                return self._query_logs.get(endpoint, [])[-limit:]
            
            # Combinar consultas de todos los endpoints
            all_queries = []
            for queries in self._query_logs.values():
                all_queries.extend(queries)
            
            # Ordenar por timestamp y limitar
            return sorted(all_queries, key=lambda x: x['timestamp'])[-limit:]
    
    def clear_stats(self, endpoint: Optional[str] = None) -> None:
        """Limpia las estadísticas
        
        Args:
            endpoint: Endpoint específico o None para limpiar todas las estadísticas
        """
        with self._lock:
            if endpoint:
                self._query_logs.pop(endpoint, None)
                self._query_stats.pop(endpoint, None)
            else:
                self._query_logs.clear()
                self._query_stats.clear()

# Instancia global del monitor
query_monitor = QueryMonitor()

def __call__(self, environ, start_response):
    # Registrar eventos
    @self.app.before_request
    def before_request():
        g.query_count = 0
        g.query_time = 0
        g.slow_queries = []
    
    @self.app.after_request
    def after_request(response):
        if hasattr(g, 'query_count') and g.query_count > 0:
            # Agregar headers de métricas
            response.headers['X-Query-Count'] = str(g.query_count)
            response.headers['X-Query-Time'] = f"{g.query_time:.2f}"
            
            # Registrar métricas
            log_activity(
                'request_metrics',
                f"Ruta: {request.path} - Queries: {g.query_count} - Tiempo: {g.query_time:.2f}s",
                metadata={
                    'path': request.path,
                    'method': request.method,
                    'status': response.status_code,
                    'query_count': g.query_count,
                    'query_time': g.query_time,
                    'slow_queries': g.slow_queries
                }
            )
        
        return response 
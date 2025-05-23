from flask_caching import Cache
from functools import wraps
import hashlib
import json
from typing import Any, Callable, Dict, Optional, TypeVar, cast
import logging
from flask import current_app

# Configurar logger
logger = logging.getLogger(__name__)

# Inicializar caché
cache = Cache(config={
    'CACHE_TYPE': 'redis',
    'CACHE_REDIS_URL': 'redis://localhost:6379/0',
    'CACHE_DEFAULT_TIMEOUT': 300,  # 5 minutos por defecto
    'CACHE_KEY_PREFIX': 'automanager_',
    'CACHE_OPTIONS': {
        'socket_timeout': 5,
        'socket_connect_timeout': 5,
        'retry_on_timeout': True
    }
})

T = TypeVar('T')

def generate_cache_key(*args: Any, **kwargs: Any) -> str:
    """Genera una clave única para el caché basada en los argumentos"""
    key_parts = [str(arg) for arg in args]
    key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
    key_string = "|".join(key_parts)
    return hashlib.md5(key_string.encode()).hexdigest()

def cache_decorator(ttl: int = 300):
    """Decorador para cachear resultados de funciones
    
    Args:
        ttl (int): Tiempo de vida del caché en segundos (default: 300)
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args: Any, **kwargs: Any) -> Any:
            # Generar una clave única para el caché
            cache_key = f"{f.__name__}:{str(args)}:{str(kwargs)}"
            
            # Intentar obtener del caché
            result = cache.get(cache_key)
            if result is not None:
                return result
            
            # Si no está en caché, ejecutar la función
            result = f(*args, **kwargs)
            
            # Guardar en caché
            cache.set(cache_key, result, timeout=ttl)
            
            return result
        return decorated_function
    return decorator

def invalidate_cache_pattern(pattern: str) -> None:
    """
    Invalida todas las claves que coincidan con el patrón
    
    Args:
        pattern: Patrón de claves a invalidar (ej: "user_*")
    """
    try:
        keys = cache.redis.keys(f"{cache.config['CACHE_KEY_PREFIX']}{pattern}")
        if keys:
            cache.redis.delete(*keys)
            logger.info(f"Invalidadas {len(keys)} claves con patrón: {pattern}")
    except Exception as e:
        logger.error(f"Error al invalidar caché: {str(e)}")

def clear_all_cache() -> None:
    """Limpia todo el caché"""
    try:
        cache.clear()
        logger.info("Caché limpiado completamente")
    except Exception as e:
        logger.error(f"Error al limpiar caché: {str(e)}")

def get_cache_stats() -> dict:
    """Obtiene estadísticas del caché"""
    try:
        info = cache.redis.info()
        return {
            'used_memory': info['used_memory'],
            'used_memory_peak': info['used_memory_peak'],
            'connected_clients': info['connected_clients'],
            'total_keys': cache.redis.dbsize()
        }
    except Exception as e:
        logger.error(f"Error al obtener estadísticas del caché: {str(e)}")
        return {}

def setup_cache(app):
    """Configura el caché para la aplicación"""
    try:
        # Configurar caché desde variables de entorno
        cache_config = {
            'CACHE_TYPE': 'redis',
            'CACHE_REDIS_URL': app.config.get('REDIS_URL', 'redis://localhost:6379/0'),
            'CACHE_DEFAULT_TIMEOUT': app.config.get('CACHE_DEFAULT_TIMEOUT', 300),
            'CACHE_KEY_PREFIX': app.config.get('CACHE_KEY_PREFIX', 'automanager_'),
            'CACHE_OPTIONS': {
                'socket_timeout': app.config.get('CACHE_SOCKET_TIMEOUT', 5),
                'socket_connect_timeout': app.config.get('CACHE_SOCKET_CONNECT_TIMEOUT', 5),
                'retry_on_timeout': app.config.get('CACHE_RETRY_ON_TIMEOUT', True)
            }
        }
        
        cache.init_app(app, config=cache_config)
        logger.info("Caché configurado correctamente")
        
    except Exception as e:
        logger.error(f"Error al configurar caché: {str(e)}")
        raise

def cache_with_args(ttl: int = 300) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """Decorador para cachear resultados de funciones con argumentos
    
    Args:
        ttl: Tiempo de vida del caché en segundos
        
    Returns:
        Decorador que cachea el resultado de la función
    """
    def decorator(f: Callable[..., T]) -> Callable[..., T]:
        @wraps(f)
        def decorated_function(*args: Any, **kwargs: Any) -> T:
            # Generar clave única basada en la función y sus argumentos
            key_parts = [
                f.__module__,
                f.__name__,
                str(args),
                str(sorted(kwargs.items()))
            ]
            cache_key = hashlib.md5(''.join(key_parts).encode()).hexdigest()
            
            # Intentar obtener del caché
            result = cache.get(cache_key)
            if result is not None:
                return cast(T, result)
            
            # Ejecutar función y cachear resultado
            result = f(*args, **kwargs)
            cache.set(cache_key, result, timeout=ttl)
            
            return result
        return cast(Callable[..., T], decorated_function)
    return decorator

def cache_key_prefix(prefix: str) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """Decorador para agregar un prefijo a las claves de caché
    
    Args:
        prefix: Prefijo para las claves de caché
        
    Returns:
        Decorador que agrega el prefijo a las claves de caché
    """
    def decorator(f: Callable[..., T]) -> Callable[..., T]:
        @wraps(f)
        def decorated_function(*args: Any, **kwargs: Any) -> T:
            # Generar clave con prefijo
            key_parts = [
                prefix,
                f.__module__,
                f.__name__,
                str(args),
                str(sorted(kwargs.items()))
            ]
            cache_key = hashlib.md5(''.join(key_parts).encode()).hexdigest()
            
            # Intentar obtener del caché
            result = cache.get(cache_key)
            if result is not None:
                return cast(T, result)
            
            # Ejecutar función y cachear resultado
            result = f(*args, **kwargs)
            cache.set(cache_key, result)
            
            return result
        return cast(Callable[..., T], decorated_function)
    return decorator

def cache_invalidate(*keys: str) -> None:
    """Invalidar claves de caché
    
    Args:
        *keys: Claves a invalidar
    """
    for key in keys:
        cache.delete(key)

def cache_clear() -> None:
    """Limpiar todo el caché"""
    cache.clear()

def cache_get(key: str) -> Optional[Any]:
    """Obtener valor del caché
    
    Args:
        key: Clave del caché
        
    Returns:
        Valor cacheado o None si no existe
    """
    return cache.get(key)

def cache_set(key: str, value: Any, ttl: Optional[int] = None) -> None:
    """Establecer valor en el caché
    
    Args:
        key: Clave del caché
        value: Valor a cachear
        ttl: Tiempo de vida en segundos (opcional)
    """
    cache.set(key, value, timeout=ttl)

def cache_memoize(ttl: int = 300) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """Decorador para cachear resultados de funciones con argumentos (versión memoizada)
    
    Args:
        ttl: Tiempo de vida del caché en segundos
        
    Returns:
        Decorador que cachea el resultado de la función
    """
    def decorator(f: Callable[..., T]) -> Callable[..., T]:
        @wraps(f)
        def decorated_function(*args: Any, **kwargs: Any) -> T:
            # Generar clave única basada en la función y sus argumentos
            key_parts = [
                f.__module__,
                f.__name__,
                json.dumps(args, sort_keys=True),
                json.dumps(kwargs, sort_keys=True)
            ]
            cache_key = hashlib.md5(''.join(key_parts).encode()).hexdigest()
            
            # Intentar obtener del caché
            result = cache.get(cache_key)
            if result is not None:
                return cast(T, result)
            
            # Ejecutar función y cachear resultado
            result = f(*args, **kwargs)
            cache.set(cache_key, result, timeout=ttl)
            
            return result
        return cast(Callable[..., T], decorated_function)
    return decorator 
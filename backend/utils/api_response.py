"""
Utilidades para manejar respuestas de la API
==========================================
"""

from flask import jsonify
from typing import Any, Dict, List, Optional, Union

def success_response(
    data: Any = None,
    message: str = "Operación exitosa",
    status_code: int = 200
) -> tuple:
    """
    Genera una respuesta exitosa estandarizada
    
    Args:
        data: Datos a incluir en la respuesta
        message: Mensaje descriptivo
        status_code: Código de estado HTTP
        
    Returns:
        tuple: (response, status_code)
    """
    response = {
        "success": True,
        "message": message,
        "data": data,
        "errors": []
    }
    return jsonify(response), status_code

def error_response(
    message: str = "Error en la operación",
    errors: Optional[List[str]] = None,
    status_code: int = 400
) -> tuple:
    """
    Genera una respuesta de error estandarizada
    
    Args:
        message: Mensaje descriptivo del error
        errors: Lista de errores específicos
        status_code: Código de estado HTTP
        
    Returns:
        tuple: (response, status_code)
    """
    response = {
        "success": False,
        "message": message,
        "data": None,
        "errors": errors or []
    }
    return jsonify(response), status_code

def paginated_response(
    items: List[Any],
    total: int,
    page: int,
    per_page: int,
    message: str = "Lista obtenida exitosamente"
) -> tuple:
    """
    Genera una respuesta paginada estandarizada
    
    Args:
        items: Lista de elementos
        total: Total de elementos
        page: Página actual
        per_page: Elementos por página
        message: Mensaje descriptivo
        
    Returns:
        tuple: (response, status_code)
    """
    total_pages = (total + per_page - 1) // per_page
    
    data = {
        "items": items,
        "pagination": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
    }
    
    return success_response(data=data, message=message) 
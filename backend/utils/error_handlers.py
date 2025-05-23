from flask import jsonify
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.exceptions import HTTPException

def handle_error(error):
    """Maneja diferentes tipos de errores y retorna una respuesta JSON apropiada"""
    if isinstance(error, HTTPException):
        return jsonify({
            'error': error.description,
            'status_code': error.code
        }), error.code
    
    if isinstance(error, SQLAlchemyError):
        return jsonify({
            'error': 'Error en la base de datos',
            'details': str(error)
        }), 500
    
    # Para otros tipos de errores
    return jsonify({
        'error': 'Error interno del servidor',
        'details': str(error)
    }), 500 
from functools import wraps
from flask import current_app
from sqlalchemy.exc import SQLAlchemyError

def transaction_handler(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            result = f(*args, **kwargs)
            return result
        except SQLAlchemyError as e:
            current_app.logger.error(f"Error en la transacción: {str(e)}")
            raise
    return decorated_function 
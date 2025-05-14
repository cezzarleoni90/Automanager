import os
import sys

# Agregar el directorio padre al path de Python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from models import db, Repuesto

def check_table_structure():
    # Crear todas las tablas si no existen
    db.create_all()
    
    # Verificar la estructura de la tabla
    with db.engine.connect() as conn:
        try:
            # Obtener información de la tabla
            result = conn.execute(text("PRAGMA table_info(repuesto)"))
            columns = [(row[1], row[2]) for row in result]
            
            print("\nEstructura actual de la tabla 'repuesto':")
            print("-" * 50)
            for name, type_ in columns:
                print(f"Columna: {name:<20} Tipo: {type_}")
            print("-" * 50)
            
        except Exception as e:
            print(f"Error al verificar la estructura: {str(e)}")

if __name__ == '__main__':
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///automanger.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    with app.app_context():
        check_table_structure() 
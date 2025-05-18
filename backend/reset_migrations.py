import os
import shutil
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Eliminar carpetas y archivos
def clean_up():
    paths_to_remove = ['migrations', 'instance', 'automanager.db']
    for path in paths_to_remove:
        if os.path.exists(path):
            if os.path.isfile(path):
                os.remove(path)
            else:
                shutil.rmtree(path)
            print(f"Eliminado: {path}")

# Crear nueva aplicación
def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///automanager.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    return app

if __name__ == '__main__':
    print("Limpiando archivos y carpetas...")
    clean_up()
    
    print("Creando nueva aplicación...")
    app = create_app()
    db = SQLAlchemy(app)
    migrate = Migrate(app, db)
    
    print("¡Listo! Ahora puedes ejecutar:")
    print("flask db init")
    print("flask db migrate -m 'Inicial'")
    print("flask db upgrade") 
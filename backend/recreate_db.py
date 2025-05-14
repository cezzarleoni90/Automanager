import os
from app import create_app
from models import db

# Eliminar base de datos existente
if os.path.exists('automanager.db'):
    os.remove('automanager.db')
    print("Base de datos anterior eliminada")

# Crear nueva aplicación y recrear tablas
app = create_app()

with app.app_context():
    db.create_all()
    print("Nuevas tablas creadas exitosamente") 
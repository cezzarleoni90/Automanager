import os
from app import create_app

# Crear aplicación
app = create_app()

# Eliminar base de datos existente
if os.path.exists('automanager.db'):
    os.remove('automanager.db')
    print("✅ Base de datos anterior eliminada")

# Crear todas las tablas con la nueva estructura
with app.app_context():
    from extensions import db
    db.create_all()
    print("✅ Nuevas tablas creadas con relaciones corregidas") 
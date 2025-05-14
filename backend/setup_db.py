from app import app, db

print("Iniciando creación de tablas...")
with app.app_context():
    db.create_all()
print("¡Base de datos inicializada!") 
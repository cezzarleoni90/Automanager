from app import app, db, Usuario
import os

def check_database():
    print("Directorio actual:", os.getcwd())
    print("Verificando base de datos...")
    
    with app.app_context():
        try:
            # Verificar si la base de datos existe
            db_path = os.path.join(os.getcwd(), 'automanager.db')
            print("Ruta de la base de datos:", db_path)
            print("¿Existe la base de datos?", os.path.exists(db_path))
            
            # Verificar si la tabla usuario existe
            usuarios = Usuario.query.all()
            print("\nTabla usuario existe y contiene", len(usuarios), "usuarios")
            
            # Mostrar los usuarios existentes
            for usuario in usuarios:
                print(f"Usuario: {usuario.email} - Rol: {usuario.rol}")
                
        except Exception as e:
            print("\nError al verificar la base de datos:", str(e))
            print("Tipo de error:", type(e).__name__)

if __name__ == '__main__':
    check_database() 
from app import create_app
import requests
from models import db, Usuario
from werkzeug.security import generate_password_hash
import json

app = create_app()

# Función para obtener token JWT
def get_auth_token():
    with app.app_context():
        # Crear usuario temporal para pruebas si no existe
        admin = Usuario.query.filter_by(email='admin@automanager.com').first()
        if not admin:
            admin = Usuario(
                nombre='Test Admin',
                email='admin@automanager.com',
                password_hash=generate_password_hash('admin123'),
                rol='admin',
                activo=True
            )
            db.session.add(admin)
            db.session.commit()
    
    # Hacer login para obtener token
    response = requests.post('http://localhost:5000/api/auth/login', 
                           json={
                               'email': 'admin@automanager.com', 
                               'password': 'admin123'
                           })
    
    if response.status_code == 200:
        return response.json().get('access_token')
    else:
        print(f"Error en login: {response.status_code} - {response.text}")
        return None

# Probar endpoint de repuestos
def test_repuestos_endpoint():
    print("=== TEST ENDPOINT REPUESTOS ===\n")
    
    # Obtener token
    token = get_auth_token()
    if not token:
        print("❌ No se pudo obtener token de autenticación")
        return
    
    print("✅ Token obtenido correctamente")
    
    # Headers con autenticación
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Probar endpoint de repuestos
    try:
        print("\n1. Probando GET /api/inventario/repuestos...")
        response = requests.get('http://localhost:5000/api/inventario/repuestos', 
                              headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Endpoint funcionando correctamente")
            print(f"Respuesta: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Texto: {response.text}")
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")

if __name__ == "__main__":
    test_repuestos_endpoint() 
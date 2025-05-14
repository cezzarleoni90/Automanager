from app import create_app
import requests
from models import db, Usuario
from werkzeug.security import generate_password_hash

app = create_app()

def get_auth_token():
    with app.app_context():
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
    
    response = requests.post('http://localhost:5000/api/auth/login', 
                           json={
                               'email': 'admin@automanager.com', 
                               'password': 'admin123'
                           })
    
    if response.status_code == 200:
        return response.json().get('access_token')
    return None

def test_endpoints():
    print("=== DIAGNÓSTICO DE ENDPOINTS ===\n")
    
    token = get_auth_token()
    if not token:
        print("❌ No se pudo obtener token")
        return
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Lista de endpoints a probar
    endpoints = [
        ('GET', '/api/mecanicos/', 'Mecánicos - Lista'),
        ('GET', '/api/servicios/mecanicos', 'Servicios/Mecánicos - Lista (¿debe existir?)'),
        ('GET', '/api/inventario/repuestos', 'Repuestos - Lista'),
        ('GET', '/api/servicios/', 'Servicios - Lista'),
        ('GET', '/api/vehiculos/', 'Vehículos - Lista'),
        ('GET', '/api/clientes/', 'Clientes - Lista'),
    ]
    
    for method, endpoint, description in endpoints:
        try:
            if method == 'GET':
                response = requests.get(f'http://localhost:5000{endpoint}', headers=headers)
            
            status_icon = "✅" if response.status_code == 200 else "❌"
            print(f"{status_icon} {description}: {response.status_code}")
            
            if response.status_code != 200:
                print(f"    Error: {response.text[:100]}...")
                
        except Exception as e:
            print(f"❌ {description}: Error de conexión - {e}")
        
        print()

if __name__ == "__main__":
    test_endpoints() 
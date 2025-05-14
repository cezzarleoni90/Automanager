from app import create_app
import requests
from models import db, Usuario
from werkzeug.security import generate_password_hash
import json

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
                           json={'email': 'admin@automanager.com', 'password': 'admin123'})
    
    if response.status_code == 200:
        return response.json().get('access_token')
    return None

def test_post_repuesto():
    print("=== TEST POST REPUESTOS ===\n")
    
    token = get_auth_token()
    if not token:
        print("❌ No se pudo obtener token")
        return
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Diferentes payloads para probar
    test_cases = [
        {
            'name': 'Completo con todos los campos',
            'payload': {
                'codigo': 'TEST001',
                'nombre': 'Repuesto Test',
                'categoria': 'Test',
                'precio_compra': 10.0,
                'precio_venta': 20.0,
                'stock': 100,
                'stock_minimo': 10,
                'descripcion': 'Descripción test'
            }
        },
        {
            'name': 'Solo campos requeridos',
            'payload': {
                'codigo': 'TEST002',
                'nombre': 'Repuesto Test 2',
                'categoria': 'Test',
                'precio_compra': 15.0,
                'precio_venta': 25.0
            }
        },
        {
            'name': 'Campos faltantes (para ver error)',
            'payload': {
                'codigo': 'TEST003',
                'nombre': 'Repuesto Test 3'
                # Faltan campos requeridos
            }
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"{i}. {test_case['name']}")
        print(f"Payload: {json.dumps(test_case['payload'], indent=2)}")
        
        try:
            response = requests.post(
                'http://localhost:5000/api/inventario/repuestos',
                headers=headers,
                json=test_case['payload']
            )
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 201:
                print("✅ Éxito!")
                result = response.json()
                print(f"Respuesta: {json.dumps(result, indent=2)}")
            else:
                print("❌ Error!")
                error_text = response.text
                print(f"Error: {error_text}")
                
                if response.headers.get('content-type') == 'application/json':
                    try:
                        error_json = response.json()
                        print(f"Error JSON: {json.dumps(error_json, indent=2)}")
                    except:
                        pass
        
        except Exception as e:
            print(f"❌ Error de conexión: {e}")
        
        print("-" * 50)

if __name__ == "__main__":
    test_post_repuesto() 
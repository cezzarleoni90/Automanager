import requests
import json
from datetime import datetime, timedelta

BASE_URL = 'http://localhost:5000/api'
TOKEN = None

def login():
    global TOKEN
    response = requests.post(f'{BASE_URL}/login', 
        json={'email': 'admin@automanager.com', 'password': 'admin123'})
    if response.status_code == 200:
        TOKEN = response.json()['access_token']
        print("✅ Login exitoso")
        return True
    else:
        print("❌ Error de login:", response.json())
        return False

def get_headers():
    return {'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'}

def test_get_servicios():
    print("\n🔍 Probando GET /api/servicios/")
    response = requests.get(f'{BASE_URL}/servicios/', headers=get_headers())
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        servicios = response.json()['servicios']
        print(f"✅ {len(servicios)} servicios encontrados")
    else:
        print("❌ Error:", response.json())

def test_create_servicio():
    print("\n➕ Probando POST /api/servicios/")
    
    # Buscar un vehículo existe
    vehiculos_response = requests.get(f'{BASE_URL}/vehiculos/', headers=get_headers())
    if vehiculos_response.status_code != 200:
        print("❌ No se pudieron obtener vehículos")
        return
    
    vehiculos = vehiculos_response.json().get('vehiculos', [])
    if not vehiculos:
        print("❌ No hay vehículos disponibles")
        return
    
    vehiculo = vehiculos[0]
    
    servicio_data = {
        'tipo_servicio': 'Mantenimiento Preventivo',
        'descripcion': 'Cambio de aceite y revisión general',
        'vehiculo_id': vehiculo['id'],
        'prioridad': 'normal',
        'fecha_estimada_fin': (datetime.now() + timedelta(days=1)).isoformat(),
        'costo_estimado': 150.0,
        'kilometraje_entrada': 85000,
        'nivel_combustible_entrada': 0.5
    }
    
    response = requests.post(f'{BASE_URL}/servicios/', 
        json=servicio_data, headers=get_headers())
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print("✅ Servicio creado exitosamente")
        return response.json()['servicio']['id']
    else:
        print("❌ Error:", response.json())
        return None

def test_get_servicio_detail(servicio_id):
    print(f"\n🔍 Probando GET /api/servicios/{servicio_id}")
    response = requests.get(f'{BASE_URL}/servicios/{servicio_id}', headers=get_headers())
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ Detalle del servicio obtenido")
    else:
        print("❌ Error:", response.json())

def test_change_estado(servicio_id):
    print(f"\n🔄 Probando cambio de estado del servicio {servicio_id}")
    
    estados_test = [
        {'estado': 'diagnostico', 'comentario': 'Iniciando diagnóstico'},
        {'estado': 'aprobado', 'comentario': 'Cliente aprobó el trabajo'},
        {'estado': 'en_progreso', 'comentario': 'Comenzando reparación'}
    ]
    
    for cambio in estados_test:
        response = requests.put(f'{BASE_URL}/servicios/{servicio_id}/estado',
            json=cambio, headers=get_headers())
        print(f"Estado: {cambio['estado']} - Status: {response.status_code}")
        if response.status_code == 200:
            print(f"✅ {cambio['estado']}")
        else:
            print(f"❌ Error en {cambio['estado']}:", response.json())

def test_estadisticas():
    print("\n📊 Probando GET /api/servicios/estadisticas")
    response = requests.get(f'{BASE_URL}/servicios/estadisticas', headers=get_headers())
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        stats = response.json()
        print("✅ Estadísticas obtenidas:")
        print(f"  - Servicios por estado: {stats['servicios_por_estado']}")
        print(f"  - Servicios del mes: {stats['servicios_mes']}")
        print(f"  - Ingresos del mes: ${stats['ingresos_mes']}")
    else:
        print("❌ Error:", response.json())

def main():
    print("🚀 Iniciando pruebas de endpoints de servicios...")
    
    # Login
    if not login():
        return
    
    # Probar endpoints
    test_get_servicios()
    servicio_id = test_create_servicio()
    
    if servicio_id:
        test_get_servicio_detail(servicio_id)
        test_change_estado(servicio_id)
    
    test_estadisticas()
    
    print("\n✅ Pruebas completadas")

if __name__ == "__main__":
    main() 
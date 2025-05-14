// Script de prueba para verificar carga de repuestos desde el frontend

const API_BASE_URL = 'http://localhost:5000/api';

// Función para hacer petición con token
async function fetchWithToken(url, options = {}) {
    const token = localStorage.getItem('token');
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        },
    });
}

// Test de carga de repuestos
async function testCargarRepuestos() {
    console.log('=== TEST FRONTEND: Carga de Repuestos ===');
    
    try {
        console.log('1. Verificando token...');
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('❌ No hay token en localStorage');
            return;
        }
        console.log('✅ Token encontrado');
        
        console.log('2. Haciendo petición a /api/inventario/repuestos...');
        const response = await fetchWithToken(`${API_BASE_URL}/inventario/repuestos`);
        
        console.log(`3. Status: ${response.status}`);
        console.log(`4. Status Text: ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Repuestos cargados exitosamente:');
            console.log('Total repuestos:', data.repuestos?.length || 0);
            console.log('Repuestos:', data.repuestos);
        } else {
            console.error('❌ Error en la respuesta:');
            const errorText = await response.text();
            console.error('Error text:', errorText);
        }
        
    } catch (error) {
        console.error('❌ Error en la petición:', error);
    }
}

// Ejecutar test
testCargarRepuestos(); 
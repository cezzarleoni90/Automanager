const API_URL = 'http://localhost:5000/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No hay token de autenticación. Por favor, inicia sesión.');
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json();
        if (response.status === 422) {
            throw new Error('Error de autenticación. Por favor, inicia sesión nuevamente.');
        }
        throw new Error(error.error || 'Error en la petición');
    }
    return response.json();
};

export const api = {
    // Clientes
    getClientes: () => 
        fetch(`${API_URL}/clientes`, { headers: getHeaders() }).then(handleResponse),
    
    getCliente: (id) => 
        fetch(`${API_URL}/clientes/${id}`, { headers: getHeaders() }).then(handleResponse),
    
    createCliente: (data) => 
        fetch(`${API_URL}/clientes`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        }).then(handleResponse),
    
    updateCliente: (id, data) => 
        fetch(`${API_URL}/clientes/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        }).then(handleResponse),
    
    deleteCliente: (id) => 
        fetch(`${API_URL}/clientes/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        }).then(handleResponse),

    // Vehículos
    getVehiculos: () => 
        fetch(`${API_URL}/vehiculos`, { headers: getHeaders() }).then(handleResponse),
    
    getVehiculo: (id) => 
        fetch(`${API_URL}/vehiculos/${id}`, { headers: getHeaders() }).then(handleResponse),
    
    createVehiculo: (data) => 
        fetch(`${API_URL}/vehiculos`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        }).then(handleResponse),
    
    updateVehiculo: (id, data) => 
        fetch(`${API_URL}/vehiculos/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        }).then(handleResponse),
    
    deleteVehiculo: (id) => 
        fetch(`${API_URL}/vehiculos/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        }).then(handleResponse),

    // Dashboard
    getEstadisticas: () => 
        fetch(`${API_URL}/dashboard`, { headers: getHeaders() }).then(handleResponse),

    // Auth
    login: (credentials) => 
        fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        }).then(handleResponse),
    
    register: (userData) => 
        fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        }).then(handleResponse),
    
    logout: () => 
        fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: getHeaders()
        }).then(handleResponse)
}; 
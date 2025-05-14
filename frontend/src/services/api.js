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
        }).then(handleResponse),

    // Funciones para servicios
    getServicios: async () => {
        const response = await fetch(`${API_URL}/servicios`, {
            headers: getHeaders(),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener servicios');
        }
        return response.json();
    },

    getServicio: async (id) => {
        const response = await fetch(`${API_URL}/servicios/${id}`, {
            headers: getHeaders(),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener servicio');
        }
        return response.json();
    },

    createServicio: async (servicio) => {
        const response = await fetch(`${API_URL}/servicios`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(servicio),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al crear servicio');
        }
        return response.json();
    },

    updateServicio: async (id, servicio) => {
        const response = await fetch(`${API_URL}/servicios/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(servicio),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar servicio');
        }
        return response.json();
    },

    deleteServicio: async (id) => {
        const response = await fetch(`${API_URL}/servicios/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar servicio');
        }
        return response.json();
    },

    asignarMecanico: async (servicioId, data) => {
        const response = await fetch(`${API_URL}/servicios/${servicioId}/asignar_mecanico`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al asignar mecánico');
        }
        return response.json();
    },

    agregarRepuesto: async (servicioId, data) => {
        const response = await fetch(`${API_URL}/servicios/${servicioId}/repuestos`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al agregar repuesto');
        }
        return response.json();
    },

    obtenerRepuestos: async (servicioId) => {
        const response = await fetch(`${API_URL}/servicios/${servicioId}/repuestos`, {
            headers: getHeaders(),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener repuestos del servicio');
        }
        return response.json();
    },

    // Cambiar estado del servicio
    cambiarEstado: async (servicioId, data) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/servicios/${servicioId}/cambiar_estado`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al cambiar estado');
        }

        return response.json();
    },

    // Obtener historial de estados
    obtenerHistorial: async (servicioId) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/servicios/${servicioId}/historial`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener historial');
        }

        return response.json();
    },

    // Obtener estados disponibles
    obtenerEstados: async () => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/servicios/estados`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener estados');
        }

        return response.json();
    },
};

// Exportar funciones individualmente
export const getServicios = () => api.getServicios();
export const getServicio = (id) => api.getServicio(id);
export const createServicio = (data) => api.createServicio(data);
export const updateServicio = (id, data) => api.updateServicio(id, data);
export const deleteServicio = (id) => api.deleteServicio(id);
export const asignarMecanico = (servicioId, data) => api.asignarMecanico(servicioId, data);
export const agregarRepuesto = (servicioId, data) => api.agregarRepuesto(servicioId, data);
export const obtenerRepuestos = (servicioId) => api.obtenerRepuestos(servicioId);
export const cambiarEstado = (servicioId, data) => api.cambiarEstado(servicioId, data);
export const obtenerHistorial = (servicioId) => api.obtenerHistorial(servicioId);
export const obtenerEstados = () => api.obtenerEstados(); 
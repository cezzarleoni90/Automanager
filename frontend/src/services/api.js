import axios from 'axios';
import config from '../config';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para manejar errores
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error('Error de respuesta:', error.response.data);
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      console.error('Error de petición:', error.request);
    } else {
      // Algo sucedió al configurar la petición
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export { api };

// Función auxiliar para el manejo de errores de API
const handleApiError = (error, functionName) => {
  console.error(`API ERROR - ${functionName}:`, error.message);
  if (error.response) {
    console.error('  Datos:', error.response.data);
    console.error('  Status:', error.response.status);
  } else if (error.request) {
    console.error('  No hubo respuesta del servidor');
  }
  throw error;
};

// Servicios
export const getServicios = async () => {
  try {
    console.log('API: Iniciando petición GET a servicios');
    const response = await api.get('/servicios/', {
      timeout: 10000 // Timeout de 10 segundos
    });
    console.log('API: Respuesta servicios recibida:', response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'getServicios');
  }
};

export const getServicio = async (id) => {
  try {
    console.log(`API: Obteniendo servicio ID ${id}`);
    const response = await api.get(`/servicios/${id}`, {
      timeout: 8000
    });
    console.log(`API: Servicio ${id} recibido:`, response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, `getServicio(${id})`);
  }
};

export const createServicio = async (data) => {
  try {
    console.log('API: Creando nuevo servicio', data);
    
    // Verificar que vehiculo_id existe y no es nulo
    if (!data.vehiculo_id && data.vehiculo_id !== 0) {
      console.error('API ERROR: vehiculo_id es obligatorio para crear un servicio', data);
      throw new Error('El ID del vehículo es obligatorio para crear un servicio');
    }
    
    // Convertir vehiculo_id a número si es posible
    const servicioData = {
      ...data,
      vehiculo_id: typeof data.vehiculo_id === 'string' ? parseInt(data.vehiculo_id, 10) : data.vehiculo_id,
      mecanico_id: data.mecanico_id ? (typeof data.mecanico_id === 'string' ? parseInt(data.mecanico_id, 10) : data.mecanico_id) : null
    };
    
    console.log('API: Datos formateados para crear servicio:', servicioData);
    
    const response = await api.post('/servicios/', servicioData, {
      timeout: 8000
    });
    console.log('API: Servicio creado:', response.status, response.data);
    return response.data;
  } catch (error) {
    console.error('API ERROR en createServicio:', error);
    return handleApiError(error, 'createServicio');
  }
};

export const updateServicio = async (id, data) => {
  try {
    console.log(`API: Actualizando servicio ID ${id}`, data);
    const response = await api.put(`/servicios/${id}`, data, {
      timeout: 8000
    });
    console.log(`API: Servicio ${id} actualizado:`, response.status);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    if (error.response) {
      console.error('Datos del error:', error.response.data);
      console.error('Status del error:', error.response.status);
    }
    throw error;
  }
};

export const deleteServicio = async (id) => {
  try {
    console.log(`API: Eliminando servicio ${id}`);
    const response = await api.delete(`/servicios/${id}`, {
      timeout: 8000
    });
    console.log(`API: Servicio ${id} eliminado:`, response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, `deleteServicio(${id})`);
  }
};

export const asignarMecanico = async (servicioId, data) => {
  try {
    console.log(`API: Asignando mecánico al servicio ${servicioId}`, data);
    const response = await api.post(`/servicios/${servicioId}/asignar_mecanico`, data, {
      timeout: 8000
    });
    console.log(`API: Mecánico asignado al servicio ${servicioId}:`, response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, `asignarMecanico(${servicioId})`);
  }
};

export const agregarRepuesto = async (servicioId, data) => {
  try {
    console.log(`API: Agregando repuesto al servicio ${servicioId}`, data);
    const response = await api.post(`/servicios/${servicioId}/repuestos`, data, {
      timeout: 8000
    });
    console.log(`API: Repuesto agregado al servicio ${servicioId}:`, response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, `agregarRepuesto(${servicioId})`);
  }
};

export const eliminarRepuesto = async (servicioId, repuestoId) => {
  try {
    console.log(`API: Eliminando repuesto ${repuestoId} del servicio ${servicioId}`);
    const response = await api.delete(`/servicios/${servicioId}/repuestos/${repuestoId}`, {
      timeout: 8000
    });
    console.log(`API: Repuesto ${repuestoId} eliminado del servicio ${servicioId}:`, response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, `eliminarRepuesto(${servicioId}, ${repuestoId})`);
  }
};

export const actualizarCantidadRepuesto = async (servicioId, repuestoId, cantidad) => {
  try {
    console.log(`API: Actualizando cantidad de repuesto ${repuestoId} en servicio ${servicioId}`, {cantidad});
    const response = await api.put(`/servicios/${servicioId}/repuestos/${repuestoId}`, {cantidad}, {
      timeout: 8000
    });
    console.log(`API: Cantidad de repuesto ${repuestoId} actualizada en servicio ${servicioId}:`, response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, `actualizarCantidadRepuesto(${servicioId}, ${repuestoId}, ${cantidad})`);
  }
};

export const obtenerRepuestos = async (servicioId) => {
  try {
    console.log(`API: Obteniendo repuestos del servicio ${servicioId}`);
    const response = await api.get(`/servicios/${servicioId}/repuestos`, {
      timeout: 8000
    });
    console.log(`API: Repuestos del servicio ${servicioId} recibidos:`, response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, `obtenerRepuestos(${servicioId})`);
  }
};

export const cambiarEstado = async (servicioId, data) => {
  try {
    console.log(`API: Cambiando estado del servicio ${servicioId}`, data);
    const response = await api.post(`/servicios/${servicioId}/cambiar_estado`, data, {
      timeout: 8000
    });
    console.log(`API: Estado del servicio ${servicioId} cambiado:`, response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, `cambiarEstado(${servicioId})`);
  }
};

export const obtenerHistorial = async (servicioId) => {
  try {
    console.log(`API: Obteniendo historial del servicio ${servicioId}`);
    const response = await api.get(`/servicios/${servicioId}/historial`, {
      timeout: 8000
    });
    console.log(`API: Historial del servicio ${servicioId} recibido:`, response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, `obtenerHistorial(${servicioId})`);
  }
};

export const obtenerEstados = async () => {
  try {
    console.log('API: Obteniendo estados de servicio');
    const response = await api.get('/servicios/estados', {
      timeout: 5000
    });
    console.log('API: Estados obtenidos:', response.status);
    return response.data;
  } catch (error) {
    console.error('Error al obtener estados:', error);
    // Devolver estados predeterminados en caso de error para no romper la UI
    return {
      'pendiente': { nombre: 'Pendiente', descripcion: 'Servicio creado y pendiente de iniciar' },
      'diagnostico': { nombre: 'En Diagnóstico', descripcion: 'Evaluando el vehículo' },
      'en_progreso': { nombre: 'En Progreso', descripcion: 'Trabajo en proceso' },
      'pausado': { nombre: 'Pausado', descripcion: 'Trabajo temporalmente suspendido' },
      'completado': { nombre: 'Completado', descripcion: 'Servicio finalizado' },
      'cancelado': { nombre: 'Cancelado', descripcion: 'Servicio cancelado' }
    };
  }
};

// Mecánicos
export const getMecanicos = async () => {
  try {
    console.log('API: Obteniendo lista de mecánicos');
    const response = await api.get('/mecanicos/', {
      timeout: 8000
    });
    console.log('API: Lista de mecánicos recibida:', response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'getMecanicos');
  }
};

export const getMecanico = async (id) => {
  try {
    console.log(`API: Obteniendo mecánico ${id}`);
    const response = await api.get(`/mecanicos/${id}`, {
      timeout: 8000
    });
    console.log(`API: Mecánico ${id} recibido:`, response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, `getMecanico(${id})`);
  }
};

// Vehículos
export const getVehiculos = async () => {
  try {
    console.log('API: Obteniendo lista de vehículos');
    const response = await api.get('/vehiculos/', {
      timeout: 8000
    });
    console.log('API: Lista de vehículos recibida:', response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'getVehiculos');
  }
};

export const getVehiculo = async (id) => {
  try {
    console.log(`API: Obteniendo vehículo ${id}`);
    const response = await api.get(`/vehiculos/${id}`, {
      timeout: 8000
    });
    console.log(`API: Vehículo ${id} recibido:`, response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, `getVehiculo(${id})`);
  }
};

// Inventario
export const getRepuestos = async () => {
  try {
    console.log('API: Obteniendo lista de repuestos');
    const response = await api.get('/inventario/repuestos', {
      timeout: 8000
    });
    console.log('API: Lista de repuestos recibida:', response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'getRepuestos');
  }
};

export const getRepuesto = async (id) => {
  try {
    console.log(`API: Obteniendo repuesto ${id}`);
    const response = await api.get(`/inventario/repuestos/${id}`, {
      timeout: 8000
    });
    console.log(`API: Repuesto ${id} recibido:`, response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, `getRepuesto(${id})`);
  }
};

// Clientes
export const getClientes = async () => {
  try {
    console.log('API: Obteniendo lista de clientes');
    const response = await api.get('/clientes', {
      timeout: 8000
    });
    console.log('API: Lista de clientes recibida:', response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'getClientes');
  }
};

export const getCliente = async (id) => {
  try {
    console.log(`API: Obteniendo cliente ${id}`);
    const response = await api.get(`/clientes/${id}`, {
      timeout: 8000
    });
    console.log(`API: Cliente ${id} recibido:`, response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, `getCliente(${id})`);
  }
};

export const createCliente = async (data) => {
  try {
    console.log('API: Creando nuevo cliente', data);
    const response = await api.post('/clientes', data, {
      timeout: 8000
    });
    console.log('API: Cliente creado:', response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'createCliente');
  }
};

export const updateCliente = async (id, data) => {
  try {
    console.log(`API: Actualizando cliente ${id}`, data);
    const response = await api.put(`/clientes/${id}`, data, {
      timeout: 8000
    });
    console.log(`API: Cliente ${id} actualizado:`, response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, `updateCliente(${id})`);
  }
};

export const deleteCliente = async (id) => {
  try {
    console.log(`API: Eliminando cliente ${id}`);
    const response = await api.delete(`/clientes/${id}`, {
      timeout: 8000
    });
    console.log(`API: Cliente ${id} eliminado:`, response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, `deleteCliente(${id})`);
  }
};

// Dashboard
export const getEstadisticas = async () => {
  try {
    console.log('API: Obteniendo estadísticas del dashboard');
    const response = await api.get('/dashboard', {
      timeout: 8000
    });
    console.log('API: Estadísticas recibidas:', response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'getEstadisticas');
  }
};

// Auth
export const login = async (credentials) => {
  try {
    console.log('API: Iniciando sesión');
    const response = await api.post('/auth/login', credentials);
    console.log('API: Login exitoso');
    return response.data;
  } catch (error) {
    return handleApiError(error, 'login');
  }
};

export const register = async (userData) => {
  try {
    console.log('API: Registrando nuevo usuario');
    const response = await api.post('/auth/register', userData, {
      timeout: 8000
    });
    console.log('API: Usuario registrado:', response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'register');
  }
};

export const logout = async () => {
  try {
    console.log('API: Cerrando sesión');
    const response = await api.post('/auth/logout', {}, {
      timeout: 8000
    });
    console.log('API: Sesión cerrada:', response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'logout');
  }
};

// Funciones para vehículos
export const createVehiculo = async (data) => {
  try {
    console.log('API: Creando nuevo vehículo', data);
    const response = await api.post('/vehiculos', data, {
      timeout: 8000
    });
    console.log('API: Vehículo creado:', response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'createVehiculo');
  }
};

export const updateVehiculo = async (id, data) => {
  try {
    console.log(`API: Actualizando vehículo ${id}`, data);
    const response = await api.put(`/vehiculos/${id}`, data, {
      timeout: 8000
    });
    console.log(`API: Vehículo ${id} actualizado:`, response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, `updateVehiculo(${id})`);
  }
};

export const deleteVehiculo = async (id) => {
  try {
    console.log(`API: Eliminando vehículo ${id}`);
    const response = await api.delete(`/vehiculos/${id}`, {
      timeout: 8000
    });
    console.log(`API: Vehículo ${id} eliminado:`, response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, `deleteVehiculo(${id})`);
  }
};

// Crear vehículo para un cliente específico
export const createVehiculoCliente = async (clienteId, data) => {
  try {
    console.log('API: Creando nuevo vehículo para cliente', clienteId, data);
    
    // Limpiar datos antes de enviar
    const vehiculoData = {
      marca: data.marca || '',
      modelo: data.modelo || '',
      año: data.año ? parseInt(data.año) : null,
      placa: data.placa || '',
      color: data.color || null,
      kilometraje: data.kilometraje ? parseFloat(data.kilometraje) : null,
      tipo_combustible: data.tipo_combustible || null,
      transmision: data.transmision || null,
      vin: data.vin || null,
      ultimo_servicio: data.ultimo_servicio || null
    };

    const response = await api.post(`/clientes/${clienteId}/vehiculos`, vehiculoData, {
      timeout: 8000
    });
    console.log('API: Vehículo creado:', response.status);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'createVehiculoCliente');
  }
};
import { api } from './api';
import config from '../config';

const handleError = (error, operation) => {
    console.error(`Error en ${operation}:`, error);
    if (error.response) {
        console.error('Datos del error:', error.response.data);
        console.error('Status del error:', error.response.status);
    }
    throw error;
};

export const vehiculoService = {
    // Obtener todos los vehículos
    getAll: async () => {
        try {
            const response = await api.get('/vehiculos');
            return response.data;
        } catch (error) {
            return handleError(error, 'getAll');
        }
    },

    // Obtener un vehículo por ID
    getById: async (id) => {
        try {
            const response = await api.get(`/vehiculos/${id}`);
            return response.data;
        } catch (error) {
            return handleError(error, 'getById');
        }
    },

    // Crear un nuevo vehículo
    create: async (vehiculo) => {
        try {
            const response = await api.post('/vehiculos', vehiculo);
            return response.data;
        } catch (error) {
            return handleError(error, 'create');
        }
    },

    // Actualizar un vehículo existente
    update: async (id, vehiculo) => {
        try {
            const response = await api.put(`/vehiculos/${id}`, vehiculo);
            return response.data;
        } catch (error) {
            return handleError(error, 'update');
        }
    },

    // Eliminar un vehículo
    delete: async (id) => {
        try {
            const response = await api.delete(`/vehiculos/${id}`);
            return response.data;
        } catch (error) {
            return handleError(error, 'delete');
        }
    },

    // Obtener el historial de cambios de un vehículo
    getHistorial: async (id) => {
        try {
            const response = await api.get(`/vehiculos/${id}/historial`);
            return response.data;
        } catch (error) {
            return handleError(error, 'getHistorial');
        }
    },

    // Obtener los servicios de un vehículo
    getServicios: async (id) => {
        try {
            const response = await api.get(`/vehiculos/${id}/servicios`);
            return response.data;
        } catch (error) {
            return handleError(error, 'getServicios');
        }
    },

    // Obtener las reparaciones de un vehículo
    getReparaciones: async (id) => {
        try {
            const response = await api.get(`/vehiculos/${id}/reparaciones`);
            return response.data;
        } catch (error) {
            return handleError(error, 'getReparaciones');
        }
    },

    // Obtener el mantenimiento programado de un vehículo
    getMantenimiento: async (id) => {
        try {
            const response = await api.get(`/vehiculos/${id}/mantenimiento`);
            return response.data;
        } catch (error) {
            return handleError(error, 'getMantenimiento');
        }
    },

    // Actualizar el kilometraje de un vehículo
    actualizarKilometraje: async (id, kilometraje) => {
        try {
            const response = await api.patch(`/vehiculos/${id}/kilometraje`, { kilometraje });
            return response.data;
        } catch (error) {
            return handleError(error, 'actualizarKilometraje');
        }
    },

    // Programar próximo servicio
    programarServicio: async (id, fecha) => {
        try {
            const response = await api.patch(`/vehiculos/${id}/proximo-servicio`, { fecha });
            return response.data;
        } catch (error) {
            return handleError(error, 'programarServicio');
        }
    },

    // Obtener estadísticas del vehículo
    getEstadisticas: async (id) => {
        try {
            const response = await api.get(`/vehiculos/${id}/estadisticas`);
            return response.data;
        } catch (error) {
            return handleError(error, 'getEstadisticas');
        }
    }
};
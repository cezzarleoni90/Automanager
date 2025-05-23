import axiosInstance from './axiosConfig';

const INVENTARIO_URL = '/inventario';

export const inventarioService = {
    // Obtener lista de repuestos
    getRepuestos: async (params = {}) => {
        try {
            const response = await axiosInstance.get(`${INVENTARIO_URL}/repuestos`, {
                params: {
                    page: params.page || 1,
                    per_page: params.perPage || 10,
                    categoria: params.categoria,
                    stock_bajo: params.stockBajo,
                    busqueda: params.busqueda
                }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Obtener un repuesto específico
    getRepuesto: async (id) => {
        try {
            const response = await axiosInstance.get(`${INVENTARIO_URL}/repuestos/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Crear nuevo repuesto
    createRepuesto: async (repuesto) => {
        try {
            const response = await axiosInstance.post(`${INVENTARIO_URL}/repuestos`, repuesto);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Actualizar repuesto
    updateRepuesto: async (id, repuesto) => {
        try {
            const response = await axiosInstance.put(`${INVENTARIO_URL}/repuestos/${id}`, repuesto);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Eliminar repuesto
    deleteRepuesto: async (id) => {
        try {
            const response = await axiosInstance.delete(`${INVENTARIO_URL}/repuestos/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Obtener movimientos de un repuesto
    getMovimientosRepuesto: async (id, params = {}) => {
        try {
            const response = await axiosInstance.get(`${INVENTARIO_URL}/repuestos/${id}/movimientos`, {
                params: {
                    page: params.page || 1,
                    per_page: params.perPage || 10,
                    tipo: params.tipo,
                    fecha_inicio: params.fechaInicio,
                    fecha_fin: params.fechaFin
                }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Crear movimiento
    createMovimiento: async (movimiento) => {
        try {
            const response = await axiosInstance.post(`${INVENTARIO_URL}/movimientos`, movimiento);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
}; 
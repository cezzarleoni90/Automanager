import { api } from './api';

export const configuracionService = {
  async getAll() {
    try {
      const response = await api.get('/configuraciones');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/configuraciones/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async create(configuracion) {
    try {
      const response = await api.post('/configuraciones', configuracion);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async update(id, configuracion) {
    try {
      const response = await api.put(`/configuraciones/${id}`, configuracion);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/configuraciones/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getByCategoria(categoria) {
    try {
      const response = await api.get(`/configuraciones/categoria/${categoria}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getHistorial(id) {
    try {
      const response = await api.get(`/configuraciones/${id}/historial`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async actualizarValor(id, valor) {
    try {
      const response = await api.patch(`/configuraciones/${id}/valor`, { valor });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 
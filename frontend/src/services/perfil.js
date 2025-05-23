import { api } from './api';

export const perfilService = {
  async getAll() {
    try {
      const response = await api.get('/perfiles');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/perfiles/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async create(perfil) {
    try {
      const response = await api.post('/perfiles', perfil);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async update(id, perfil) {
    try {
      const response = await api.put(`/perfiles/${id}`, perfil);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/perfiles/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getUsuarios(id) {
    try {
      const response = await api.get(`/perfiles/${id}/usuarios`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getPermisos(id) {
    try {
      const response = await api.get(`/perfiles/${id}/permisos`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async actualizarPermisos(id, permisos) {
    try {
      const response = await api.put(`/perfiles/${id}/permisos`, { permisos });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getHistorial(id) {
    try {
      const response = await api.get(`/perfiles/${id}/historial`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 
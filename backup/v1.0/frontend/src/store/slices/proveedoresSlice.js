import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Async thunks
export const fetchProveedores = createAsyncThunk(
  'proveedores/fetchProveedores',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/proveedores`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchProveedorById = createAsyncThunk(
  'proveedores/fetchProveedorById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/proveedores/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createProveedor = createAsyncThunk(
  'proveedores/createProveedor',
  async (proveedorData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/api/proveedores`, proveedorData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateProveedor = createAsyncThunk(
  'proveedores/updateProveedor',
  async ({ id, proveedorData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/api/proveedores/${id}`, proveedorData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteProveedor = createAsyncThunk(
  'proveedores/deleteProveedor',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/api/proveedores/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchProveedoresPorCategoria = createAsyncThunk(
  'proveedores/fetchProveedoresPorCategoria',
  async (categoria, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/proveedores/categoria/${categoria}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchProveedoresPorEstado = createAsyncThunk(
  'proveedores/fetchProveedoresPorEstado',
  async (estado, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/proveedores/estado/${estado}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchProveedoresPorCiudad = createAsyncThunk(
  'proveedores/fetchProveedoresPorCiudad',
  async (ciudad, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/proveedores/ciudad/${ciudad}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchProveedoresPorPais = createAsyncThunk(
  'proveedores/fetchProveedoresPorPais',
  async (pais, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/proveedores/pais/${pais}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  proveedores: [],
  proveedorActual: null,
  proveedoresPorCategoria: [],
  proveedoresPorEstado: [],
  proveedoresPorCiudad: [],
  proveedoresPorPais: [],
  loading: false,
  error: null
};

const proveedoresSlice = createSlice({
  name: 'proveedores',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearProveedorActual: (state) => {
      state.proveedorActual = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Proveedores
      .addCase(fetchProveedores.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProveedores.fulfilled, (state, action) => {
        state.loading = false;
        state.proveedores = action.payload;
      })
      .addCase(fetchProveedores.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener proveedores';
      })
      // Fetch Proveedor by ID
      .addCase(fetchProveedorById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProveedorById.fulfilled, (state, action) => {
        state.loading = false;
        state.proveedorActual = action.payload;
      })
      .addCase(fetchProveedorById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener proveedor';
      })
      // Create Proveedor
      .addCase(createProveedor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProveedor.fulfilled, (state, action) => {
        state.loading = false;
        state.proveedores.push(action.payload);
      })
      .addCase(createProveedor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al crear proveedor';
      })
      // Update Proveedor
      .addCase(updateProveedor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProveedor.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.proveedores.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.proveedores[index] = action.payload;
        }
        if (state.proveedorActual?.id === action.payload.id) {
          state.proveedorActual = action.payload;
        }
      })
      .addCase(updateProveedor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al actualizar proveedor';
      })
      // Delete Proveedor
      .addCase(deleteProveedor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProveedor.fulfilled, (state, action) => {
        state.loading = false;
        state.proveedores = state.proveedores.filter(p => p.id !== action.payload);
      })
      .addCase(deleteProveedor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al eliminar proveedor';
      })
      // Fetch Proveedores por Categoria
      .addCase(fetchProveedoresPorCategoria.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProveedoresPorCategoria.fulfilled, (state, action) => {
        state.loading = false;
        state.proveedoresPorCategoria = action.payload;
      })
      .addCase(fetchProveedoresPorCategoria.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener proveedores por categoría';
      })
      // Fetch Proveedores por Estado
      .addCase(fetchProveedoresPorEstado.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProveedoresPorEstado.fulfilled, (state, action) => {
        state.loading = false;
        state.proveedoresPorEstado = action.payload;
      })
      .addCase(fetchProveedoresPorEstado.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener proveedores por estado';
      })
      // Fetch Proveedores por Ciudad
      .addCase(fetchProveedoresPorCiudad.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProveedoresPorCiudad.fulfilled, (state, action) => {
        state.loading = false;
        state.proveedoresPorCiudad = action.payload;
      })
      .addCase(fetchProveedoresPorCiudad.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener proveedores por ciudad';
      })
      // Fetch Proveedores por Pais
      .addCase(fetchProveedoresPorPais.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProveedoresPorPais.fulfilled, (state, action) => {
        state.loading = false;
        state.proveedoresPorPais = action.payload;
      })
      .addCase(fetchProveedoresPorPais.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener proveedores por país';
      });
  }
});

export const { clearError, clearProveedorActual } = proveedoresSlice.actions;
export default proveedoresSlice.reducer; 
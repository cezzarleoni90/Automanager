import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Async thunks
export const fetchAlbaranes = createAsyncThunk(
  'albaranes/fetchAlbaranes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/albaranes`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchAlbaranById = createAsyncThunk(
  'albaranes/fetchAlbaranById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/albaranes/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createAlbaran = createAsyncThunk(
  'albaranes/createAlbaran',
  async (albaranData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/api/albaranes`, albaranData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateAlbaran = createAsyncThunk(
  'albaranes/updateAlbaran',
  async ({ id, albaranData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/api/albaranes/${id}`, albaranData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteAlbaran = createAsyncThunk(
  'albaranes/deleteAlbaran',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/api/albaranes/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchAlbaranesPorCliente = createAsyncThunk(
  'albaranes/fetchAlbaranesPorCliente',
  async (clienteId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/albaranes/cliente/${clienteId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchAlbaranesPorVehiculo = createAsyncThunk(
  'albaranes/fetchAlbaranesPorVehiculo',
  async (vehiculoId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/albaranes/vehiculo/${vehiculoId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchAlbaranesPorFecha = createAsyncThunk(
  'albaranes/fetchAlbaranesPorFecha',
  async (fecha, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/albaranes/fecha/${fecha}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchAlbaranesPorRangoFechas = createAsyncThunk(
  'albaranes/fetchAlbaranesPorRangoFechas',
  async ({ fechaInicio, fechaFin }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/albaranes/rango-fechas`, {
        params: { fechaInicio, fechaFin }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchAlbaranesPorEstado = createAsyncThunk(
  'albaranes/fetchAlbaranesPorEstado',
  async (estado, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/albaranes/estado/${estado}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  albaranes: [],
  albaranActual: null,
  albaranesPorCliente: [],
  albaranesPorVehiculo: [],
  albaranesPorFecha: [],
  albaranesPorRangoFechas: [],
  albaranesPorEstado: [],
  loading: false,
  error: null
};

const albaranesSlice = createSlice({
  name: 'albaranes',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAlbaranActual: (state) => {
      state.albaranActual = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Albaranes
      .addCase(fetchAlbaranes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlbaranes.fulfilled, (state, action) => {
        state.loading = false;
        state.albaranes = action.payload;
      })
      .addCase(fetchAlbaranes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener albaranes';
      })
      // Fetch Albaran by ID
      .addCase(fetchAlbaranById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlbaranById.fulfilled, (state, action) => {
        state.loading = false;
        state.albaranActual = action.payload;
      })
      .addCase(fetchAlbaranById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener albarán';
      })
      // Create Albaran
      .addCase(createAlbaran.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAlbaran.fulfilled, (state, action) => {
        state.loading = false;
        state.albaranes.push(action.payload);
      })
      .addCase(createAlbaran.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al crear albarán';
      })
      // Update Albaran
      .addCase(updateAlbaran.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAlbaran.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.albaranes.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.albaranes[index] = action.payload;
        }
        if (state.albaranActual?.id === action.payload.id) {
          state.albaranActual = action.payload;
        }
      })
      .addCase(updateAlbaran.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al actualizar albarán';
      })
      // Delete Albaran
      .addCase(deleteAlbaran.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAlbaran.fulfilled, (state, action) => {
        state.loading = false;
        state.albaranes = state.albaranes.filter(a => a.id !== action.payload);
      })
      .addCase(deleteAlbaran.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al eliminar albarán';
      })
      // Fetch Albaranes por Cliente
      .addCase(fetchAlbaranesPorCliente.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlbaranesPorCliente.fulfilled, (state, action) => {
        state.loading = false;
        state.albaranesPorCliente = action.payload;
      })
      .addCase(fetchAlbaranesPorCliente.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener albaranes del cliente';
      })
      // Fetch Albaranes por Vehiculo
      .addCase(fetchAlbaranesPorVehiculo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlbaranesPorVehiculo.fulfilled, (state, action) => {
        state.loading = false;
        state.albaranesPorVehiculo = action.payload;
      })
      .addCase(fetchAlbaranesPorVehiculo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener albaranes del vehículo';
      })
      // Fetch Albaranes por Fecha
      .addCase(fetchAlbaranesPorFecha.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlbaranesPorFecha.fulfilled, (state, action) => {
        state.loading = false;
        state.albaranesPorFecha = action.payload;
      })
      .addCase(fetchAlbaranesPorFecha.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener albaranes por fecha';
      })
      // Fetch Albaranes por Rango Fechas
      .addCase(fetchAlbaranesPorRangoFechas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlbaranesPorRangoFechas.fulfilled, (state, action) => {
        state.loading = false;
        state.albaranesPorRangoFechas = action.payload;
      })
      .addCase(fetchAlbaranesPorRangoFechas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener albaranes por rango de fechas';
      })
      // Fetch Albaranes por Estado
      .addCase(fetchAlbaranesPorEstado.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlbaranesPorEstado.fulfilled, (state, action) => {
        state.loading = false;
        state.albaranesPorEstado = action.payload;
      })
      .addCase(fetchAlbaranesPorEstado.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener albaranes por estado';
      });
  }
});

export const { clearError, clearAlbaranActual } = albaranesSlice.actions;
export default albaranesSlice.reducer; 
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Async thunks
export const fetchServicios = createAsyncThunk(
  'servicios/fetchServicios',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/servicios`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchServicioById = createAsyncThunk(
  'servicios/fetchServicioById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/servicios/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createServicio = createAsyncThunk(
  'servicios/createServicio',
  async (servicioData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/api/servicios`, servicioData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateServicio = createAsyncThunk(
  'servicios/updateServicio',
  async ({ id, servicioData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/api/servicios/${id}`, servicioData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteServicio = createAsyncThunk(
  'servicios/deleteServicio',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/api/servicios/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchServiciosPorVehiculo = createAsyncThunk(
  'servicios/fetchServiciosPorVehiculo',
  async (vehiculoId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/servicios/vehiculo/${vehiculoId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  servicios: [],
  servicioActual: null,
  serviciosPorVehiculo: [],
  loading: false,
  error: null
};

const serviciosSlice = createSlice({
  name: 'servicios',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearServicioActual: (state) => {
      state.servicioActual = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Servicios
      .addCase(fetchServicios.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServicios.fulfilled, (state, action) => {
        state.loading = false;
        state.servicios = action.payload;
      })
      .addCase(fetchServicios.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener servicios';
      })
      // Fetch Servicio by ID
      .addCase(fetchServicioById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServicioById.fulfilled, (state, action) => {
        state.loading = false;
        state.servicioActual = action.payload;
      })
      .addCase(fetchServicioById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener servicio';
      })
      // Create Servicio
      .addCase(createServicio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createServicio.fulfilled, (state, action) => {
        state.loading = false;
        state.servicios.push(action.payload);
      })
      .addCase(createServicio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al crear servicio';
      })
      // Update Servicio
      .addCase(updateServicio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateServicio.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.servicios.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.servicios[index] = action.payload;
        }
        if (state.servicioActual?.id === action.payload.id) {
          state.servicioActual = action.payload;
        }
      })
      .addCase(updateServicio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al actualizar servicio';
      })
      // Delete Servicio
      .addCase(deleteServicio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteServicio.fulfilled, (state, action) => {
        state.loading = false;
        state.servicios = state.servicios.filter(s => s.id !== action.payload);
      })
      .addCase(deleteServicio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al eliminar servicio';
      })
      // Fetch Servicios por Vehiculo
      .addCase(fetchServiciosPorVehiculo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServiciosPorVehiculo.fulfilled, (state, action) => {
        state.loading = false;
        state.serviciosPorVehiculo = action.payload;
      })
      .addCase(fetchServiciosPorVehiculo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener servicios del vehículo';
      });
  }
});

export const { clearError, clearServicioActual } = serviciosSlice.actions;
export default serviciosSlice.reducer; 
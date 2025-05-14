import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Async thunks
export const fetchCitas = createAsyncThunk(
  'citas/fetchCitas',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/citas`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchCitaById = createAsyncThunk(
  'citas/fetchCitaById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/citas/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createCita = createAsyncThunk(
  'citas/createCita',
  async (citaData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/api/citas`, citaData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateCita = createAsyncThunk(
  'citas/updateCita',
  async ({ id, citaData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/api/citas/${id}`, citaData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteCita = createAsyncThunk(
  'citas/deleteCita',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/api/citas/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchCitasPorCliente = createAsyncThunk(
  'citas/fetchCitasPorCliente',
  async (clienteId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/citas/cliente/${clienteId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchCitasPorVehiculo = createAsyncThunk(
  'citas/fetchCitasPorVehiculo',
  async (vehiculoId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/citas/vehiculo/${vehiculoId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchCitasPorFecha = createAsyncThunk(
  'citas/fetchCitasPorFecha',
  async (fecha, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/citas/fecha/${fecha}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchCitasPorEstado = createAsyncThunk(
  'citas/fetchCitasPorEstado',
  async (estado, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/citas/estado/${estado}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  citas: [],
  citaActual: null,
  citasPorCliente: [],
  citasPorVehiculo: [],
  citasPorFecha: [],
  citasPorEstado: [],
  loading: false,
  error: null
};

const citasSlice = createSlice({
  name: 'citas',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCitaActual: (state) => {
      state.citaActual = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Citas
      .addCase(fetchCitas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCitas.fulfilled, (state, action) => {
        state.loading = false;
        state.citas = action.payload;
      })
      .addCase(fetchCitas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener citas';
      })
      // Fetch Cita by ID
      .addCase(fetchCitaById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCitaById.fulfilled, (state, action) => {
        state.loading = false;
        state.citaActual = action.payload;
      })
      .addCase(fetchCitaById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener cita';
      })
      // Create Cita
      .addCase(createCita.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCita.fulfilled, (state, action) => {
        state.loading = false;
        state.citas.push(action.payload);
      })
      .addCase(createCita.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al crear cita';
      })
      // Update Cita
      .addCase(updateCita.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCita.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.citas.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.citas[index] = action.payload;
        }
        if (state.citaActual?.id === action.payload.id) {
          state.citaActual = action.payload;
        }
      })
      .addCase(updateCita.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al actualizar cita';
      })
      // Delete Cita
      .addCase(deleteCita.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCita.fulfilled, (state, action) => {
        state.loading = false;
        state.citas = state.citas.filter(c => c.id !== action.payload);
      })
      .addCase(deleteCita.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al eliminar cita';
      })
      // Fetch Citas por Cliente
      .addCase(fetchCitasPorCliente.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCitasPorCliente.fulfilled, (state, action) => {
        state.loading = false;
        state.citasPorCliente = action.payload;
      })
      .addCase(fetchCitasPorCliente.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener citas del cliente';
      })
      // Fetch Citas por Vehiculo
      .addCase(fetchCitasPorVehiculo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCitasPorVehiculo.fulfilled, (state, action) => {
        state.loading = false;
        state.citasPorVehiculo = action.payload;
      })
      .addCase(fetchCitasPorVehiculo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener citas del vehículo';
      })
      // Fetch Citas por Fecha
      .addCase(fetchCitasPorFecha.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCitasPorFecha.fulfilled, (state, action) => {
        state.loading = false;
        state.citasPorFecha = action.payload;
      })
      .addCase(fetchCitasPorFecha.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener citas por fecha';
      })
      // Fetch Citas por Estado
      .addCase(fetchCitasPorEstado.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCitasPorEstado.fulfilled, (state, action) => {
        state.loading = false;
        state.citasPorEstado = action.payload;
      })
      .addCase(fetchCitasPorEstado.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener citas por estado';
      });
  }
});

export const { clearError, clearCitaActual } = citasSlice.actions;
export default citasSlice.reducer; 
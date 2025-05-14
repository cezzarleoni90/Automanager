import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Async thunks
export const fetchPresupuestos = createAsyncThunk(
  'presupuestos/fetchPresupuestos',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/presupuestos`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchPresupuestoById = createAsyncThunk(
  'presupuestos/fetchPresupuestoById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/presupuestos/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createPresupuesto = createAsyncThunk(
  'presupuestos/createPresupuesto',
  async (presupuestoData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/api/presupuestos`, presupuestoData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updatePresupuesto = createAsyncThunk(
  'presupuestos/updatePresupuesto',
  async ({ id, presupuestoData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/api/presupuestos/${id}`, presupuestoData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deletePresupuesto = createAsyncThunk(
  'presupuestos/deletePresupuesto',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/api/presupuestos/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchPresupuestosPorCliente = createAsyncThunk(
  'presupuestos/fetchPresupuestosPorCliente',
  async (clienteId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/presupuestos/cliente/${clienteId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchPresupuestosPorVehiculo = createAsyncThunk(
  'presupuestos/fetchPresupuestosPorVehiculo',
  async (vehiculoId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/presupuestos/vehiculo/${vehiculoId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchPresupuestosPorEstado = createAsyncThunk(
  'presupuestos/fetchPresupuestosPorEstado',
  async (estado, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/presupuestos/estado/${estado}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchPresupuestosPorFecha = createAsyncThunk(
  'presupuestos/fetchPresupuestosPorFecha',
  async (fecha, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/presupuestos/fecha/${fecha}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchPresupuestosPorRangoFechas = createAsyncThunk(
  'presupuestos/fetchPresupuestosPorRangoFechas',
  async ({ fechaInicio, fechaFin }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/presupuestos/rango-fechas`, {
        params: { fechaInicio, fechaFin }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  presupuestos: [],
  presupuestoActual: null,
  presupuestosPorCliente: [],
  presupuestosPorVehiculo: [],
  presupuestosPorEstado: [],
  presupuestosPorFecha: [],
  presupuestosPorRangoFechas: [],
  loading: false,
  error: null
};

const presupuestosSlice = createSlice({
  name: 'presupuestos',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPresupuestoActual: (state) => {
      state.presupuestoActual = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Presupuestos
      .addCase(fetchPresupuestos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPresupuestos.fulfilled, (state, action) => {
        state.loading = false;
        state.presupuestos = action.payload;
      })
      .addCase(fetchPresupuestos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener presupuestos';
      })
      // Fetch Presupuesto by ID
      .addCase(fetchPresupuestoById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPresupuestoById.fulfilled, (state, action) => {
        state.loading = false;
        state.presupuestoActual = action.payload;
      })
      .addCase(fetchPresupuestoById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener presupuesto';
      })
      // Create Presupuesto
      .addCase(createPresupuesto.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPresupuesto.fulfilled, (state, action) => {
        state.loading = false;
        state.presupuestos.push(action.payload);
      })
      .addCase(createPresupuesto.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al crear presupuesto';
      })
      // Update Presupuesto
      .addCase(updatePresupuesto.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePresupuesto.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.presupuestos.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.presupuestos[index] = action.payload;
        }
        if (state.presupuestoActual?.id === action.payload.id) {
          state.presupuestoActual = action.payload;
        }
      })
      .addCase(updatePresupuesto.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al actualizar presupuesto';
      })
      // Delete Presupuesto
      .addCase(deletePresupuesto.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePresupuesto.fulfilled, (state, action) => {
        state.loading = false;
        state.presupuestos = state.presupuestos.filter(p => p.id !== action.payload);
      })
      .addCase(deletePresupuesto.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al eliminar presupuesto';
      })
      // Fetch Presupuestos por Cliente
      .addCase(fetchPresupuestosPorCliente.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPresupuestosPorCliente.fulfilled, (state, action) => {
        state.loading = false;
        state.presupuestosPorCliente = action.payload;
      })
      .addCase(fetchPresupuestosPorCliente.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener presupuestos del cliente';
      })
      // Fetch Presupuestos por Vehiculo
      .addCase(fetchPresupuestosPorVehiculo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPresupuestosPorVehiculo.fulfilled, (state, action) => {
        state.loading = false;
        state.presupuestosPorVehiculo = action.payload;
      })
      .addCase(fetchPresupuestosPorVehiculo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener presupuestos del vehículo';
      })
      // Fetch Presupuestos por Estado
      .addCase(fetchPresupuestosPorEstado.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPresupuestosPorEstado.fulfilled, (state, action) => {
        state.loading = false;
        state.presupuestosPorEstado = action.payload;
      })
      .addCase(fetchPresupuestosPorEstado.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener presupuestos por estado';
      })
      // Fetch Presupuestos por Fecha
      .addCase(fetchPresupuestosPorFecha.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPresupuestosPorFecha.fulfilled, (state, action) => {
        state.loading = false;
        state.presupuestosPorFecha = action.payload;
      })
      .addCase(fetchPresupuestosPorFecha.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener presupuestos por fecha';
      })
      // Fetch Presupuestos por Rango Fechas
      .addCase(fetchPresupuestosPorRangoFechas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPresupuestosPorRangoFechas.fulfilled, (state, action) => {
        state.loading = false;
        state.presupuestosPorRangoFechas = action.payload;
      })
      .addCase(fetchPresupuestosPorRangoFechas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener presupuestos por rango de fechas';
      });
  }
});

export const { clearError, clearPresupuestoActual } = presupuestosSlice.actions;
export default presupuestosSlice.reducer; 
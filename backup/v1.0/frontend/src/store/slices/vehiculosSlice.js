import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Async thunks
export const fetchVehiculos = createAsyncThunk(
  'vehiculos/fetchVehiculos',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/vehiculos`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchVehiculoById = createAsyncThunk(
  'vehiculos/fetchVehiculoById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/vehiculos/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createVehiculo = createAsyncThunk(
  'vehiculos/createVehiculo',
  async (vehiculoData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/api/vehiculos`, vehiculoData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateVehiculo = createAsyncThunk(
  'vehiculos/updateVehiculo',
  async ({ id, vehiculoData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/api/vehiculos/${id}`, vehiculoData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteVehiculo = createAsyncThunk(
  'vehiculos/deleteVehiculo',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/api/vehiculos/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchVehiculosPorCliente = createAsyncThunk(
  'vehiculos/fetchVehiculosPorCliente',
  async (clienteId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/vehiculos/cliente/${clienteId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchHistorialVehiculo = createAsyncThunk(
  'vehiculos/fetchHistorialVehiculo',
  async (vehiculoId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/vehiculos/${vehiculoId}/historial`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  vehiculos: [],
  vehiculoActual: null,
  vehiculosPorCliente: [],
  historialVehiculo: [],
  loading: false,
  error: null
};

const vehiculosSlice = createSlice({
  name: 'vehiculos',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearVehiculoActual: (state) => {
      state.vehiculoActual = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Vehiculos
      .addCase(fetchVehiculos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehiculos.fulfilled, (state, action) => {
        state.loading = false;
        state.vehiculos = action.payload;
      })
      .addCase(fetchVehiculos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener vehículos';
      })
      // Fetch Vehiculo by ID
      .addCase(fetchVehiculoById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehiculoById.fulfilled, (state, action) => {
        state.loading = false;
        state.vehiculoActual = action.payload;
      })
      .addCase(fetchVehiculoById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener vehículo';
      })
      // Create Vehiculo
      .addCase(createVehiculo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createVehiculo.fulfilled, (state, action) => {
        state.loading = false;
        state.vehiculos.push(action.payload);
      })
      .addCase(createVehiculo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al crear vehículo';
      })
      // Update Vehiculo
      .addCase(updateVehiculo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateVehiculo.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.vehiculos.findIndex(v => v.id === action.payload.id);
        if (index !== -1) {
          state.vehiculos[index] = action.payload;
        }
        if (state.vehiculoActual?.id === action.payload.id) {
          state.vehiculoActual = action.payload;
        }
      })
      .addCase(updateVehiculo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al actualizar vehículo';
      })
      // Delete Vehiculo
      .addCase(deleteVehiculo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteVehiculo.fulfilled, (state, action) => {
        state.loading = false;
        state.vehiculos = state.vehiculos.filter(v => v.id !== action.payload);
      })
      .addCase(deleteVehiculo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al eliminar vehículo';
      })
      // Fetch Vehiculos por Cliente
      .addCase(fetchVehiculosPorCliente.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehiculosPorCliente.fulfilled, (state, action) => {
        state.loading = false;
        state.vehiculosPorCliente = action.payload;
      })
      .addCase(fetchVehiculosPorCliente.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener vehículos del cliente';
      })
      // Fetch Historial Vehiculo
      .addCase(fetchHistorialVehiculo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHistorialVehiculo.fulfilled, (state, action) => {
        state.loading = false;
        state.historialVehiculo = action.payload;
      })
      .addCase(fetchHistorialVehiculo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener historial del vehículo';
      });
  }
});

export const { clearError, clearVehiculoActual } = vehiculosSlice.actions;
export default vehiculosSlice.reducer; 
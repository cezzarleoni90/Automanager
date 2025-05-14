import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Async thunks
export const fetchClientes = createAsyncThunk(
  'clientes/fetchClientes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/clientes`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchClienteById = createAsyncThunk(
  'clientes/fetchClienteById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/clientes/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createCliente = createAsyncThunk(
  'clientes/createCliente',
  async (clienteData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/api/clientes`, clienteData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateCliente = createAsyncThunk(
  'clientes/updateCliente',
  async ({ id, clienteData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/api/clientes/${id}`, clienteData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteCliente = createAsyncThunk(
  'clientes/deleteCliente',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/api/clientes/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchVehiculosCliente = createAsyncThunk(
  'clientes/fetchVehiculosCliente',
  async (clienteId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/clientes/${clienteId}/vehiculos`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  clientes: [],
  clienteActual: null,
  vehiculosCliente: [],
  loading: false,
  error: null
};

const clientesSlice = createSlice({
  name: 'clientes',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearClienteActual: (state) => {
      state.clienteActual = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Clientes
      .addCase(fetchClientes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientes.fulfilled, (state, action) => {
        state.loading = false;
        state.clientes = action.payload;
      })
      .addCase(fetchClientes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener clientes';
      })
      // Fetch Cliente by ID
      .addCase(fetchClienteById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClienteById.fulfilled, (state, action) => {
        state.loading = false;
        state.clienteActual = action.payload;
      })
      .addCase(fetchClienteById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener cliente';
      })
      // Create Cliente
      .addCase(createCliente.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCliente.fulfilled, (state, action) => {
        state.loading = false;
        state.clientes.push(action.payload);
      })
      .addCase(createCliente.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al crear cliente';
      })
      // Update Cliente
      .addCase(updateCliente.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCliente.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.clientes.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.clientes[index] = action.payload;
        }
        if (state.clienteActual?.id === action.payload.id) {
          state.clienteActual = action.payload;
        }
      })
      .addCase(updateCliente.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al actualizar cliente';
      })
      // Delete Cliente
      .addCase(deleteCliente.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCliente.fulfilled, (state, action) => {
        state.loading = false;
        state.clientes = state.clientes.filter(c => c.id !== action.payload);
      })
      .addCase(deleteCliente.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al eliminar cliente';
      })
      // Fetch Vehiculos Cliente
      .addCase(fetchVehiculosCliente.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehiculosCliente.fulfilled, (state, action) => {
        state.loading = false;
        state.vehiculosCliente = action.payload;
      })
      .addCase(fetchVehiculosCliente.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener vehículos del cliente';
      });
  }
});

export const { clearError, clearClienteActual } = clientesSlice.actions;
export default clientesSlice.reducer; 
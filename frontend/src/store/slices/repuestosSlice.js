import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Async thunks
export const fetchRepuestos = createAsyncThunk(
  'repuestos/fetchRepuestos',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/repuestos`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchRepuestoById = createAsyncThunk(
  'repuestos/fetchRepuestoById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/repuestos/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createRepuesto = createAsyncThunk(
  'repuestos/createRepuesto',
  async (repuestoData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/api/repuestos`, repuestoData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateRepuesto = createAsyncThunk(
  'repuestos/updateRepuesto',
  async ({ id, repuestoData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/api/repuestos/${id}`, repuestoData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteRepuesto = createAsyncThunk(
  'repuestos/deleteRepuesto',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/api/repuestos/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const actualizarStock = createAsyncThunk(
  'repuestos/actualizarStock',
  async ({ id, cantidad }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/api/repuestos/${id}/stock`, { cantidad });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  repuestos: [],
  repuestoActual: null,
  loading: false,
  error: null
};

const repuestosSlice = createSlice({
  name: 'repuestos',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearRepuestoActual: (state) => {
      state.repuestoActual = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Repuestos
      .addCase(fetchRepuestos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRepuestos.fulfilled, (state, action) => {
        state.loading = false;
        state.repuestos = action.payload;
      })
      .addCase(fetchRepuestos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener repuestos';
      })
      // Fetch Repuesto by ID
      .addCase(fetchRepuestoById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRepuestoById.fulfilled, (state, action) => {
        state.loading = false;
        state.repuestoActual = action.payload;
      })
      .addCase(fetchRepuestoById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener repuesto';
      })
      // Create Repuesto
      .addCase(createRepuesto.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRepuesto.fulfilled, (state, action) => {
        state.loading = false;
        state.repuestos.push(action.payload);
      })
      .addCase(createRepuesto.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al crear repuesto';
      })
      // Update Repuesto
      .addCase(updateRepuesto.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRepuesto.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.repuestos.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.repuestos[index] = action.payload;
        }
        if (state.repuestoActual?.id === action.payload.id) {
          state.repuestoActual = action.payload;
        }
      })
      .addCase(updateRepuesto.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al actualizar repuesto';
      })
      // Delete Repuesto
      .addCase(deleteRepuesto.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRepuesto.fulfilled, (state, action) => {
        state.loading = false;
        state.repuestos = state.repuestos.filter(r => r.id !== action.payload);
      })
      .addCase(deleteRepuesto.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al eliminar repuesto';
      })
      // Actualizar Stock
      .addCase(actualizarStock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(actualizarStock.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.repuestos.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.repuestos[index] = action.payload;
        }
        if (state.repuestoActual?.id === action.payload.id) {
          state.repuestoActual = action.payload;
        }
      })
      .addCase(actualizarStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al actualizar stock';
      });
  }
});

export const { clearError, clearRepuestoActual } = repuestosSlice.actions;
export default repuestosSlice.reducer; 
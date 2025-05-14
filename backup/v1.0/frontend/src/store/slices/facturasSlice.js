import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Async thunks
export const fetchFacturas = createAsyncThunk(
  'facturas/fetchFacturas',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/facturas`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchFacturaById = createAsyncThunk(
  'facturas/fetchFacturaById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/facturas/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createFactura = createAsyncThunk(
  'facturas/createFactura',
  async (facturaData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/api/facturas`, facturaData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateFactura = createAsyncThunk(
  'facturas/updateFactura',
  async ({ id, facturaData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/api/facturas/${id}`, facturaData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteFactura = createAsyncThunk(
  'facturas/deleteFactura',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/api/facturas/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchFacturasPorCliente = createAsyncThunk(
  'facturas/fetchFacturasPorCliente',
  async (clienteId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/facturas/cliente/${clienteId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchFacturasPorVehiculo = createAsyncThunk(
  'facturas/fetchFacturasPorVehiculo',
  async (vehiculoId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/facturas/vehiculo/${vehiculoId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const generarPDF = createAsyncThunk(
  'facturas/generarPDF',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/facturas/${id}/pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  facturas: [],
  facturaActual: null,
  facturasPorCliente: [],
  facturasPorVehiculo: [],
  loading: false,
  error: null
};

const facturasSlice = createSlice({
  name: 'facturas',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearFacturaActual: (state) => {
      state.facturaActual = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Facturas
      .addCase(fetchFacturas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFacturas.fulfilled, (state, action) => {
        state.loading = false;
        state.facturas = action.payload;
      })
      .addCase(fetchFacturas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener facturas';
      })
      // Fetch Factura by ID
      .addCase(fetchFacturaById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFacturaById.fulfilled, (state, action) => {
        state.loading = false;
        state.facturaActual = action.payload;
      })
      .addCase(fetchFacturaById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener factura';
      })
      // Create Factura
      .addCase(createFactura.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFactura.fulfilled, (state, action) => {
        state.loading = false;
        state.facturas.push(action.payload);
      })
      .addCase(createFactura.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al crear factura';
      })
      // Update Factura
      .addCase(updateFactura.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFactura.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.facturas.findIndex(f => f.id === action.payload.id);
        if (index !== -1) {
          state.facturas[index] = action.payload;
        }
        if (state.facturaActual?.id === action.payload.id) {
          state.facturaActual = action.payload;
        }
      })
      .addCase(updateFactura.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al actualizar factura';
      })
      // Delete Factura
      .addCase(deleteFactura.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFactura.fulfilled, (state, action) => {
        state.loading = false;
        state.facturas = state.facturas.filter(f => f.id !== action.payload);
      })
      .addCase(deleteFactura.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al eliminar factura';
      })
      // Fetch Facturas por Cliente
      .addCase(fetchFacturasPorCliente.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFacturasPorCliente.fulfilled, (state, action) => {
        state.loading = false;
        state.facturasPorCliente = action.payload;
      })
      .addCase(fetchFacturasPorCliente.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener facturas del cliente';
      })
      // Fetch Facturas por Vehiculo
      .addCase(fetchFacturasPorVehiculo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFacturasPorVehiculo.fulfilled, (state, action) => {
        state.loading = false;
        state.facturasPorVehiculo = action.payload;
      })
      .addCase(fetchFacturasPorVehiculo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener facturas del vehículo';
      })
      // Generar PDF
      .addCase(generarPDF.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generarPDF.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(generarPDF.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al generar PDF';
      });
  }
});

export const { clearError, clearFacturaActual } = facturasSlice.actions;
export default facturasSlice.reducer; 
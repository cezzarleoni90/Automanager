import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Async thunks
export const fetchEmpleados = createAsyncThunk(
  'empleados/fetchEmpleados',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/empleados`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchEmpleadoById = createAsyncThunk(
  'empleados/fetchEmpleadoById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/empleados/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createEmpleado = createAsyncThunk(
  'empleados/createEmpleado',
  async (empleadoData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/api/empleados`, empleadoData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateEmpleado = createAsyncThunk(
  'empleados/updateEmpleado',
  async ({ id, empleadoData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/api/empleados/${id}`, empleadoData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteEmpleado = createAsyncThunk(
  'empleados/deleteEmpleado',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/api/empleados/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchEmpleadosPorRol = createAsyncThunk(
  'empleados/fetchEmpleadosPorRol',
  async (rol, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/empleados/rol/${rol}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchEmpleadosPorEstado = createAsyncThunk(
  'empleados/fetchEmpleadosPorEstado',
  async (estado, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/empleados/estado/${estado}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchEmpleadosPorDepartamento = createAsyncThunk(
  'empleados/fetchEmpleadosPorDepartamento',
  async (departamento, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/empleados/departamento/${departamento}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchEmpleadosPorFechaContratacion = createAsyncThunk(
  'empleados/fetchEmpleadosPorFechaContratacion',
  async (fecha, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/api/empleados/fecha-contratacion/${fecha}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  empleados: [],
  empleadoActual: null,
  empleadosPorRol: [],
  empleadosPorEstado: [],
  empleadosPorDepartamento: [],
  empleadosPorFechaContratacion: [],
  loading: false,
  error: null
};

const empleadosSlice = createSlice({
  name: 'empleados',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearEmpleadoActual: (state) => {
      state.empleadoActual = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Empleados
      .addCase(fetchEmpleados.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmpleados.fulfilled, (state, action) => {
        state.loading = false;
        state.empleados = action.payload;
      })
      .addCase(fetchEmpleados.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener empleados';
      })
      // Fetch Empleado by ID
      .addCase(fetchEmpleadoById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmpleadoById.fulfilled, (state, action) => {
        state.loading = false;
        state.empleadoActual = action.payload;
      })
      .addCase(fetchEmpleadoById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener empleado';
      })
      // Create Empleado
      .addCase(createEmpleado.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEmpleado.fulfilled, (state, action) => {
        state.loading = false;
        state.empleados.push(action.payload);
      })
      .addCase(createEmpleado.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al crear empleado';
      })
      // Update Empleado
      .addCase(updateEmpleado.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEmpleado.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.empleados.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.empleados[index] = action.payload;
        }
        if (state.empleadoActual?.id === action.payload.id) {
          state.empleadoActual = action.payload;
        }
      })
      .addCase(updateEmpleado.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al actualizar empleado';
      })
      // Delete Empleado
      .addCase(deleteEmpleado.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEmpleado.fulfilled, (state, action) => {
        state.loading = false;
        state.empleados = state.empleados.filter(e => e.id !== action.payload);
      })
      .addCase(deleteEmpleado.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al eliminar empleado';
      })
      // Fetch Empleados por Rol
      .addCase(fetchEmpleadosPorRol.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmpleadosPorRol.fulfilled, (state, action) => {
        state.loading = false;
        state.empleadosPorRol = action.payload;
      })
      .addCase(fetchEmpleadosPorRol.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener empleados por rol';
      })
      // Fetch Empleados por Estado
      .addCase(fetchEmpleadosPorEstado.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmpleadosPorEstado.fulfilled, (state, action) => {
        state.loading = false;
        state.empleadosPorEstado = action.payload;
      })
      .addCase(fetchEmpleadosPorEstado.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener empleados por estado';
      })
      // Fetch Empleados por Departamento
      .addCase(fetchEmpleadosPorDepartamento.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmpleadosPorDepartamento.fulfilled, (state, action) => {
        state.loading = false;
        state.empleadosPorDepartamento = action.payload;
      })
      .addCase(fetchEmpleadosPorDepartamento.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener empleados por departamento';
      })
      // Fetch Empleados por Fecha Contratacion
      .addCase(fetchEmpleadosPorFechaContratacion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmpleadosPorFechaContratacion.fulfilled, (state, action) => {
        state.loading = false;
        state.empleadosPorFechaContratacion = action.payload;
      })
      .addCase(fetchEmpleadosPorFechaContratacion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Error al obtener empleados por fecha de contratación';
      });
  }
});

export const { clearError, clearEmpleadoActual } = empleadosSlice.actions;
export default empleadosSlice.reducer; 
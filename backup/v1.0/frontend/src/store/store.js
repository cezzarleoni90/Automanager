import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import clientesReducer from './slices/clientesSlice';
import serviciosReducer from './slices/serviciosSlice';
import repuestosReducer from './slices/repuestosSlice';
import facturasReducer from './slices/facturasSlice';
import vehiculosReducer from './slices/vehiculosSlice';
import citasReducer from './slices/citasSlice';
import presupuestosReducer from './slices/presupuestosSlice';
import albaranesReducer from './slices/albaranesSlice';
import empleadosReducer from './slices/empleadosSlice';
import proveedoresReducer from './slices/proveedoresSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    clientes: clientesReducer,
    servicios: serviciosReducer,
    repuestos: repuestosReducer,
    facturas: facturasReducer,
    vehiculos: vehiculosReducer,
    citas: citasReducer,
    presupuestos: presupuestosReducer,
    albaranes: albaranesReducer,
    empleados: empleadosReducer,
    proveedores: proveedoresReducer
  }
}); 
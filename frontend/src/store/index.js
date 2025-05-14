import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import clientesReducer from './slices/clientesSlice';
import vehiculosReducer from './slices/vehiculosSlice';
import serviciosReducer from './slices/serviciosSlice';
import repuestosReducer from './slices/repuestosSlice';
import facturasReducer from './slices/facturasSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    clientes: clientesReducer,
    vehiculos: vehiculosReducer,
    servicios: serviciosReducer,
    repuestos: repuestosReducer,
    facturas: facturasReducer
  }
});

export default store; 
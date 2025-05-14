import React from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate,
  createBrowserRouter,
  RouterProvider
} from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Componentes
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Vehiculos from './pages/Vehiculos';
import Servicios from './pages/Servicios';
import Inventario from './pages/Inventario';
import Mecanicos from './pages/Mecanicos';
import Calendario from './pages/Calendario';
import Facturacion from './pages/Facturacion';
import Configuracion from './pages/Configuracion';
import Perfil from './pages/Perfil';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'clientes', element: <Clientes /> },
      { path: 'vehiculos', element: <Vehiculos /> },
      { path: 'servicios', element: <Servicios /> },
      { path: 'inventario', element: <Inventario /> },
      { path: 'mecanicos', element: <Mecanicos /> },
      { path: 'calendario', element: <Calendario /> },
      { path: 'facturacion', element: <Facturacion /> },
      { path: 'configuracion', element: <Configuracion /> },
      { path: 'perfil', element: <Perfil /> }
    ]
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Clientes from './pages/clientes/Clientes';
import Vehiculos from './pages/vehiculos/Vehiculos';
import Servicios from './pages/servicios/Servicios';
import Mecanicos from './pages/mecanicos/Mecanicos';
import Calendario from './pages/calendario/Calendario';
import Facturacion from './pages/facturacion/Facturacion';
import Configuracion from './pages/configuracion/Configuracion';
import Perfil from './pages/perfil/Perfil';
import Inventario from './pages/inventario/Inventario';

// Crear una instancia de QueryClient
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5 minutos
        },
    },
});

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/clientes" element={<Clientes />} />
                            <Route path="/vehiculos" element={<Vehiculos />} />
                            <Route path="/servicios" element={<Servicios />} />
                            <Route path="/mecanicos" element={<Mecanicos />} />
                            <Route path="/calendario" element={<Calendario />} />
                            <Route path="/facturacion" element={<Facturacion />} />
                            <Route path="/configuracion" element={<Configuracion />} />
                            <Route path="/perfil" element={<Perfil />} />
                            <Route path="/inventario" element={<Inventario />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export default App; 
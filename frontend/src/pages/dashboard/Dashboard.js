import React from 'react';
import { Box, Typography, Grid, Paper, Alert, CircularProgress } from '@mui/material';
import { useQuery } from 'react-query';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    Build as BuildIcon,
    People as PeopleIcon,
    DirectionsCar as CarIcon,
    AttachMoney as MoneyIcon,
    Warning as WarningIcon,
    Event as EventIcon
} from '@mui/icons-material';
import api from '../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = () => {
    // Obtener datos de servicios
    const { data: serviciosData, isLoading: isLoadingServicios } = useQuery('servicios-dashboard', 
        () => api.get('/dashboard/servicios').then(res => res.data)
    );

    // Obtener datos de ingresos
    const { data: ingresosData, isLoading: isLoadingIngresos } = useQuery('ingresos-dashboard', 
        () => api.get('/dashboard/ingresos').then(res => res.data)
    );

    // Obtener alertas de inventario
    const { data: alertasData, isLoading: isLoadingAlertas } = useQuery('alertas-dashboard', 
        () => api.get('/dashboard/alertas').then(res => res.data)
    );

    // Obtener próximos servicios
    const { data: proximosServicios, isLoading: isLoadingProximos } = useQuery('proximos-servicios', 
        () => api.get('/dashboard/proximos-servicios').then(res => res.data)
    );

    if (isLoadingServicios || isLoadingIngresos || isLoadingAlertas || isLoadingProximos) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Dashboard
            </Typography>

            {/* Tarjetas de resumen */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6} lg={3}>
                    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                        <BuildIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                        <Box>
                            <Typography variant="h6" color="text.secondary">Servicios Activos</Typography>
                            <Typography variant="h4">{serviciosData?.activos || 0}</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                        <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                        <Box>
                            <Typography variant="h6" color="text.secondary">Clientes</Typography>
                            <Typography variant="h4">{serviciosData?.totalClientes || 0}</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                        <CarIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                        <Box>
                            <Typography variant="h6" color="text.secondary">Vehículos</Typography>
                            <Typography variant="h4">{serviciosData?.totalVehiculos || 0}</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                        <MoneyIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                        <Box>
                            <Typography variant="h6" color="text.secondary">Ingresos del Mes</Typography>
                            <Typography variant="h4">${ingresosData?.ingresosMes || 0}</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Gráficos */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Gráfico de servicios por mes */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Servicios por Mes</Typography>
                        <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={serviciosData?.serviciosPorMes || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="mes" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="cantidad" name="Servicios" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>

                {/* Gráfico de ingresos vs gastos */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Ingresos vs Gastos</Typography>
                        <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={ingresosData?.ingresosVsGastos || []}
                                        dataKey="valor"
                                        nameKey="tipo"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label
                                    >
                                        {ingresosData?.ingresosVsGastos?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Alertas y Próximos Servicios */}
            <Grid container spacing={3}>
                {/* Alertas de inventario */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                            <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
                            Alertas de Inventario
                        </Typography>
                        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                            {alertasData?.alertas?.length > 0 ? (
                                alertasData.alertas.map((alerta, index) => (
                                    <Alert 
                                        key={index} 
                                        severity="warning" 
                                        sx={{ mb: 1 }}
                                    >
                                        {alerta.mensaje}
                                    </Alert>
                                ))
                            ) : (
                                <Typography color="text.secondary">
                                    No hay alertas de inventario
                                </Typography>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* Próximos servicios */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                            <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
                            Próximos Servicios
                        </Typography>
                        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                            {proximosServicios?.servicios?.length > 0 ? (
                                proximosServicios.servicios.map((servicio, index) => (
                                    <Paper 
                                        key={index} 
                                        sx={{ 
                                            p: 2, 
                                            mb: 1, 
                                            backgroundColor: 'background.default' 
                                        }}
                                    >
                                        <Typography variant="subtitle1">
                                            {servicio.vehiculo} - {servicio.cliente}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {new Date(servicio.fecha).toLocaleDateString()} - {servicio.tipo}
                                        </Typography>
                                    </Paper>
                                ))
                            ) : (
                                <Typography color="text.secondary">
                                    No hay servicios programados
                                </Typography>
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard; 
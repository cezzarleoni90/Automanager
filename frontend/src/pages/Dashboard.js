import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  People as PeopleIcon,
  DirectionsCar as CarIcon,
  Build as BuildIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getEstadisticas } from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalClientes: 0,
    totalVehiculos: 0,
    totalServicios: 0,
    totalFacturas: 0,
    totalMecanicos: 0,
    ingresos_mes_actual: 0,
    servicios_por_estado: [],
    facturas_por_estado: [],
    servicios_por_mecanico: [],
    serviciosRecientes: [],
    facturasRecientes: [],
    repuestos_bajo_stock: [],
    eventos_proximos: []
  });

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getEstadisticas();
      setStats(data);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const StatCard = ({ title, value, icon, color }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: '50%',
              p: 1,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" color="textSecondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={cargarEstadisticas}
            startIcon={<RefreshIcon />}
          >
            Reintentar
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Bienvenido, {user?.nombre || 'Usuario'}
        </Typography>
        <Box>
          <IconButton onClick={cargarEstadisticas} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Tarjetas de estadísticas */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Clientes"
            value={stats?.totalClientes || 0}
            icon={<PeopleIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Vehículos"
            value={stats?.totalVehiculos || 0}
            icon={<CarIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Servicios"
            value={stats?.totalServicios || 0}
            icon={<BuildIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Facturas"
            value={stats?.totalFacturas || 0}
            icon={<MoneyIcon />}
            color="warning"
          />
        </Grid>

        {/* Servicios Recientes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Servicios Recientes
            </Typography>
            <List>
              {stats?.serviciosRecientes?.map((servicio, index) => (
                <React.Fragment key={servicio.id}>
                  <ListItem>
                    <ListItemText
                      primary={`${servicio.vehiculo?.marca} ${servicio.vehiculo?.modelo}`}
                      secondary={`${servicio.tipo_servicio} - ${new Date(servicio.fecha_inicio).toLocaleDateString()}`}
                    />
                  </ListItem>
                  {index < stats.serviciosRecientes.length - 1 && <Divider />}
                </React.Fragment>
              )) || <ListItem><ListItemText primary="No hay servicios recientes" /></ListItem>}
            </List>
          </Paper>
        </Grid>

        {/* Facturas Recientes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Facturas Recientes
            </Typography>
            <List>
              {stats?.facturasRecientes?.map((factura, index) => (
                <React.Fragment key={factura.id}>
                  <ListItem>
                    <ListItemText
                      primary={`Factura #${factura.numero}`}
                      secondary={`${factura.cliente?.nombre} - ${new Date(factura.fecha).toLocaleDateString()} - $${factura.total}`}
                    />
                  </ListItem>
                  {index < stats.facturasRecientes.length - 1 && <Divider />}
                </React.Fragment>
              )) || <ListItem><ListItemText primary="No hay facturas recientes" /></ListItem>}
            </List>
          </Paper>
        </Grid>

        {/* Repuestos con Stock Bajo */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Repuestos con Stock Bajo
            </Typography>
            <List>
              {stats?.repuestos_bajo_stock?.map((repuesto, index) => (
                <React.Fragment key={repuesto.id}>
                  <ListItem>
                    <ListItemIcon>
                      <WarningIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={repuesto.nombre}
                      secondary={`Stock: ${repuesto.stock} (Mínimo: ${repuesto.stock_minimo})`}
                    />
                  </ListItem>
                  {index < stats.repuestos_bajo_stock.length - 1 && <Divider />}
                </React.Fragment>
              )) || <ListItem><ListItemText primary="No hay repuestos con stock bajo" /></ListItem>}
            </List>
          </Paper>
        </Grid>

        {/* Eventos Próximos */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Eventos Próximos
            </Typography>
            <List>
              {stats?.eventos_proximos?.map((evento, index) => (
                <React.Fragment key={evento.id}>
                  <ListItem>
                    <ListItemText
                      primary={evento.titulo}
                      secondary={`${new Date(evento.fecha_inicio).toLocaleDateString()} - ${evento.tipo}`}
                    />
                  </ListItem>
                  {index < stats.eventos_proximos.length - 1 && <Divider />}
                </React.Fragment>
              )) || <ListItem><ListItemText primary="No hay eventos próximos" /></ListItem>}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 
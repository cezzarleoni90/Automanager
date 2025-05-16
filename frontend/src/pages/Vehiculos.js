import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Alert,
  Chip,
  InputAdornment,
  Tooltip,
  Link,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Build as BuildIcon,
  Visibility as VisibilityIcon,
  History as HistoryIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { getVehiculos, getVehiculo, getClientes, updateVehiculo, createVehiculo, deleteVehiculo } from '../services/api';

// Agregar la función formatEstadoLabel
const formatEstadoLabel = (estado) => {
  const estados = {
    'pendiente': 'Pendiente',
    'en_progreso': 'En Progreso',
    'diagnostico': 'En Diagnóstico',
    'completado': 'Completado',
    'pausado': 'Pausado',
    'cancelado': 'Cancelado'
  };
  return estados[estado] || estado;
};

function Vehiculos() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [vehiculos, setVehiculos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [vehiculoActual, setVehiculoActual] = useState({
    marca: '',
    modelo: '',
    año: '',
    placa: '',
    color: '',
    cliente_id: '',
    kilometraje: '',
    ultimo_servicio: '',
    vin: '',
    tipo_combustible: '',
    transmision: '',
  });
  const [busqueda, setBusqueda] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [openServiciosDialog, setOpenServiciosDialog] = useState(false);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
  const [dialogoVehiculoAbierto, setDialogoVehiculoAbierto] = useState(false);
  const [vehiculoDetalle, setVehiculoDetalle] = useState(null);

  useEffect(() => {
    cargarVehiculos();
    cargarClientes();

    // Manejar la navegación desde el módulo de Clientes
    const searchParams = new URLSearchParams(location.search);
    const vehiculoId = searchParams.get('vehiculo');
    const clienteData = location.state;

    if (vehiculoId) {
      const vehiculo = vehiculos.find(v => v.id === parseInt(vehiculoId));
      if (vehiculo) {
        handleOpenDialog(vehiculo);
      }
    } else if (clienteData?.id) {
      console.log('Datos del cliente recibidos:', clienteData);
      setClienteSeleccionado({
        id: clienteData.id,
        nombre: `${clienteData.nombre} ${clienteData.apellido}`
      });
      setVehiculoActual(prev => ({
        ...prev,
        cliente_id: clienteData.id
      }));
      handleOpenDialog();
    }
  }, [location]);

  const cargarVehiculos = async () => {
    try {
      const data = await getVehiculos();
      console.log('Datos de vehículos cargados:', data);
      
      // Corregir cómo se procesan los servicios para cada vehículo
      const vehiculosConServicios = (data.vehiculos || []).map(vehiculo => {
        // Verificar si el vehículo tiene servicios
        // Si no tiene, se inicializa como un array vacío
        const servicios = vehiculo.servicios_recientes || vehiculo.servicios || [];
        
        // Contar la cantidad de servicios para cada vehículo
        const cantidadServicios = servicios.length;
        
        console.log(`Vehículo ID ${vehiculo.id} tiene ${cantidadServicios} servicios:`, servicios);
        
        return {
          ...vehiculo,
          servicios: servicios,
          totalServicios: cantidadServicios
        };
      });
      
      setVehiculos(vehiculosConServicios);
      console.log('Vehículos procesados con datos de servicios:', vehiculosConServicios);
    } catch (error) {
      console.error('Error al cargar vehículos:', error);
      setError(error.message || 'Error al cargar los vehículos');
      if (error.message && error.message.includes('autenticación')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const cargarClientes = async () => {
    try {
      const data = await getClientes();
      setClientes(data.clientes || []);
    } catch (error) {
      setError(error.message);
      if (error.message.includes('autenticación')) {
        navigate('/login');
      }
    }
  };

  const handleOpenDialog = (vehiculo = null) => {
    if (vehiculo) {
      if (dialogoVehiculoAbierto) {
        setDialogoVehiculoAbierto(false);
        // Pequeño delay para asegurar que la modal de detalles se cierre completamente
        setTimeout(() => {
          setVehiculoActual({
            ...vehiculo,
            cliente_id: vehiculo.cliente?.id || ''
          });
          setOpenDialog(true);
        }, 100);
      } else {
        setVehiculoDetalle(vehiculo);
        setDialogoVehiculoAbierto(true);
      }
    } else {
      setVehiculoActual({
        marca: '',
        modelo: '',
        año: '',
        placa: '',
        color: '',
        cliente_id: '',
        kilometraje: '',
        ultima_revision: ''
      });
      setOpenDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVehiculoActual((prev) => ({
      ...prev,
      [name]: value === null ? '' : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Preparar los datos para el backend
      const datosVehiculo = {
        ...vehiculoActual,
        año: vehiculoActual.año ? parseInt(vehiculoActual.año) : null,
        kilometraje: vehiculoActual.kilometraje ? parseFloat(vehiculoActual.kilometraje) : null,
        cliente_id: vehiculoActual.cliente_id || clienteSeleccionado?.id,
        // Convertir strings vacíos a null para campos opcionales
        color: vehiculoActual.color || null,
        tipo_combustible: vehiculoActual.tipo_combustible || null,
        transmision: vehiculoActual.transmision || null,
        vin: vehiculoActual.vin || null,
        ultimo_servicio: vehiculoActual.ultimo_servicio || null
      };

      console.log('Enviando datos del vehículo:', datosVehiculo);

      if (vehiculoActual.id) {
        await updateVehiculo(vehiculoActual.id, datosVehiculo);
        setSuccess('Vehículo actualizado exitosamente');
      } else {
        await createVehiculo(datosVehiculo);
        setSuccess('Vehículo creado exitosamente');
      }
      handleCloseDialog();
      cargarVehiculos();
    } catch (error) {
      console.error('Error al guardar vehículo:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      // Verificar si el vehículo tiene servicios asociados
      const vehiculo = vehiculos.find(v => v.id === id);
      if (vehiculo?.servicios?.length > 0) {
        setError('No se puede eliminar el vehículo porque tiene servicios asociados. Por favor, elimine primero los servicios.');
        return;
      }

      if (!window.confirm('¿Está seguro de eliminar este vehículo?')) {
        return;
      }

      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/vehiculos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar el vehículo');
      }

      setSuccess('Vehículo eliminado exitosamente');
      
      // Cerrar la modal de detalles si está abierta
      if (dialogoVehiculoAbierto) {
        setDialogoVehiculoAbierto(false);
      }
      
      // Actualizar la lista de vehículos
      await cargarVehiculos();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const vehiculosFiltrados = vehiculos.filter((vehiculo) =>
    `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.placa}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  const handleIrACliente = (clienteId) => {
    navigate(`/clientes?cliente=${clienteId}`);
  };

  const handleVerServicios = (vehiculo) => {
    cargarDetalleVehiculo(vehiculo.id);
  };

  const handleCloseServiciosDialog = () => {
    setOpenServiciosDialog(false);
    setVehiculoSeleccionado(null);
  };

  const handleIrAServicio = (servicioId) => {
    navigate(`/servicios?servicio=${servicioId}`);
  };

  const handleAgregarServicio = () => {
    // Asegurarnos de que tenemos un ID de vehículo válido
    if (!vehiculoSeleccionado?.id) {
      setError('No se pudo identificar el vehículo seleccionado');
      return;
    }
    
    // Convertir el ID a String para evitar problemas de comparación
    const vehiculoId = String(vehiculoSeleccionado.id);
    
    console.log('🚗 Navegando a servicios con vehículo seleccionado:', {
      id: vehiculoId,
      marca: vehiculoSeleccionado.marca,
      modelo: vehiculoSeleccionado.modelo,
      placa: vehiculoSeleccionado.placa
    });
    
    navigate('/servicios', { 
      state: { 
        vehiculoId: vehiculoId,
        vehiculoInfo: `${vehiculoSeleccionado?.marca} ${vehiculoSeleccionado?.modelo} (${vehiculoSeleccionado?.placa})`
      } 
    });
    
    handleCloseServiciosDialog();
  };

  const cargarDetalleVehiculo = async (id) => {
    try {
      console.log('Cargando detalles del vehículo ID:', id);
      setError(''); // Limpiar errores anteriores
      
      const data = await getVehiculo(id);
      console.log('Detalles del vehículo recibidos:', data);
      
      if (!data) {
        throw new Error('No se pudo cargar la información del vehículo');
      }
      
      // Asegurarse de que servicios_recientes existe y está formateado correctamente
      const serviciosFormateados = (data.servicios_recientes || []).map(servicio => ({
        ...servicio,
        id: servicio.id,
        tipo_servicio: servicio.tipo || servicio.tipo_servicio || 'Sin definir',
        descripcion: servicio.descripcion || 'Sin descripción',
        estado: servicio.estado || 'pendiente',
        mecanico: servicio.mecanico || null,
        fecha_inicio: servicio.fecha_inicio || new Date().toISOString()
      }));
      
      console.log('Servicios formateados del vehículo:', serviciosFormateados);
      
      // Actualizar el estado del vehículo seleccionado
      setVehiculoSeleccionado({
        ...data,
        servicios: serviciosFormateados,
        totalServicios: serviciosFormateados.length
      });
      
      setOpenServiciosDialog(true);
    } catch (error) {
      console.error('Error al cargar detalles del vehículo:', error);
      setError('Error al cargar los detalles del vehículo: ' + (error.message || 'Error desconocido'));
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Gestión de Vehículos</Typography>
          {clienteSeleccionado && (
            <Typography variant="subtitle1" color="text.secondary">
              Agregando vehículo para: {clienteSeleccionado.nombre}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setClienteSeleccionado(null);
            handleOpenDialog();
          }}
        >
          Nuevo Vehículo
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar vehículos..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Placa</TableCell>
              <TableCell>Marca/Modelo</TableCell>
              <TableCell>Año</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Servicios</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vehiculosFiltrados.map((vehiculo) => (
              <TableRow key={vehiculo.id}>
                <TableCell>
                  <Typography variant="subtitle1">{vehiculo.placa}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body1">
                    {vehiculo.marca} {vehiculo.modelo}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{vehiculo.año}</Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" color="action" />
                    <Link
                      component="button"
                      variant="body2"
                      onClick={() => handleIrACliente(vehiculo.cliente_id)}
                      sx={{ textDecoration: 'none' }}
                    >
                      {clientes.find(c => c.id === vehiculo.cliente_id)?.nombre || 'Cliente no encontrado'}
                    </Link>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={<BuildIcon />}
                    label={`${vehiculo.totalServicios || vehiculo.servicios?.length || 0} servicios`}
                    onClick={() => handleVerServicios(vehiculo)}
                    color="secondary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Ver detalles">
                      <IconButton onClick={() => handleOpenDialog(vehiculo)}>
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {vehiculoActual.id ? 'Editar Vehículo' : 'Nuevo Vehículo'}
          {clienteSeleccionado && !vehiculoActual.id && (
            <Typography variant="subtitle2" color="text.secondary">
              Cliente: {clienteSeleccionado.nombre}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Marca"
                  name="marca"
                  value={vehiculoActual.marca || ''}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Modelo"
                  name="modelo"
                  value={vehiculoActual.modelo || ''}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Año"
                  name="año"
                  type="number"
                  value={vehiculoActual.año || ''}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Placa"
                  name="placa"
                  value={vehiculoActual.placa || ''}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Color"
                  name="color"
                  value={vehiculoActual.color || ''}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Cliente</InputLabel>
                  <Select
                    name="cliente_id"
                    value={vehiculoActual.cliente_id || ''}
                    onChange={handleInputChange}
                    label="Cliente"
                    disabled={!!clienteSeleccionado}
                  >
                    {clientes.map((cliente) => (
                      <MenuItem key={cliente.id} value={cliente.id}>
                        {cliente.nombre} {cliente.apellido}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Kilometraje"
                  name="kilometraje"
                  type="number"
                  value={vehiculoActual.kilometraje || ''}
                  onChange={handleInputChange}
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Combustible</InputLabel>
                  <Select
                    name="tipo_combustible"
                    value={vehiculoActual.tipo_combustible || ''}
                    onChange={handleInputChange}
                    label="Tipo de Combustible"
                  >
                    <MenuItem value="">Seleccione un tipo</MenuItem>
                    <MenuItem value="gasolina">Gasolina</MenuItem>
                    <MenuItem value="diesel">Diesel</MenuItem>
                    <MenuItem value="electrico">Eléctrico</MenuItem>
                    <MenuItem value="hibrido">Híbrido</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Transmisión</InputLabel>
                  <Select
                    name="transmision"
                    value={vehiculoActual.transmision || ''}
                    onChange={handleInputChange}
                    label="Transmisión"
                  >
                    <MenuItem value="">Seleccione un tipo</MenuItem>
                    <MenuItem value="manual">Manual</MenuItem>
                    <MenuItem value="automatica">Automática</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="VIN"
                  name="vin"
                  value={vehiculoActual.vin || ''}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {vehiculoActual.id ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openServiciosDialog}
        onClose={handleCloseServiciosDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Servicios del Vehículo {vehiculoSeleccionado?.marca} {vehiculoSeleccionado?.modelo} ({vehiculoSeleccionado?.placa})
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAgregarServicio}
            >
              Nuevo Servicio
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {vehiculoSeleccionado && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Información del Vehículo
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Marca / Modelo
                    </Typography>
                    <Typography variant="body1">
                      {vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Placa
                    </Typography>
                    <Typography variant="body1">
                      {vehiculoSeleccionado.placa}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Año
                    </Typography>
                    <Typography variant="body1">
                      {vehiculoSeleccionado.año}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Kilometraje
                    </Typography>
                    <Typography variant="body1">
                      {vehiculoSeleccionado.kilometraje || 'No registrado'} km
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Typography variant="subtitle1" gutterBottom>
                Historial de Servicios ({vehiculoSeleccionado.servicios?.length || 0})
              </Typography>

              {vehiculoSeleccionado.servicios && vehiculoSeleccionado.servicios.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Mecánico</TableCell>
                        <TableCell>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vehiculoSeleccionado.servicios.map((servicio) => (
                        <TableRow key={servicio.id}>
                          <TableCell>{servicio.tipo_servicio || 'Sin definir'}</TableCell>
                          <TableCell>
                            <Tooltip title={servicio.descripcion || 'Sin descripción'}>
                              <Typography noWrap sx={{ maxWidth: 200 }}>
                                {servicio.descripcion || 'Sin descripción'}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            {servicio.fecha_inicio ? new Date(servicio.fecha_inicio).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={servicio.estado || 'pendiente'}
                              color={
                                servicio.estado === 'completado' ? 'success' :
                                (servicio.estado === 'en_proceso' || servicio.estado === 'en_progreso') ? 'warning' :
                                'error'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {servicio.mecanico ? (
                              typeof servicio.mecanico === 'object' 
                                ? servicio.mecanico.nombre || `${servicio.mecanico.nombre || ''} ${servicio.mecanico.apellido || ''}` 
                                : servicio.mecanico
                            ) : 'Sin asignar'}
                          </TableCell>
                          <TableCell>
                            <IconButton 
                              size="small" 
                              onClick={() => handleIrAServicio(servicio.id)}
                              title="Ver detalles"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No hay servicios registrados para este vehículo
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAgregarServicio}
                    sx={{ mt: 2 }}
                  >
                    Programar Servicio
                  </Button>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseServiciosDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={dialogoVehiculoAbierto} 
        onClose={() => setDialogoVehiculoAbierto(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', px: 2, py: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Detalles del Vehículo
            </Typography>
            <IconButton 
              color="inherit" 
              onClick={() => setDialogoVehiculoAbierto(false)}
              aria-label="cerrar diálogo"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ p: 3 }}>
          {vehiculoDetalle && (
            <Grid container spacing={3}>
              {/* Información del Vehículo */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    Información del Vehículo
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Marca:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{vehiculoDetalle.marca}</Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Modelo:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{vehiculoDetalle.modelo}</Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Año:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{vehiculoDetalle.año}</Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Placa:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{vehiculoDetalle.placa}</Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Color:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{vehiculoDetalle.color}</Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Kilometraje:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{vehiculoDetalle.kilometraje} km</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Información del Cliente */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    Información del Cliente
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {vehiculoDetalle.cliente ? (
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">Nombre:</Typography>
                        </Grid>
                        <Grid item xs={8}>
                          <Typography variant="body2">
                            {vehiculoDetalle.cliente.nombre} {vehiculoDetalle.cliente.apellido}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">Email:</Typography>
                        </Grid>
                        <Grid item xs={8}>
                          <Typography variant="body2">{vehiculoDetalle.cliente.email}</Typography>
                        </Grid>
                        
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">Teléfono:</Typography>
                        </Grid>
                        <Grid item xs={8}>
                          <Typography variant="body2">{vehiculoDetalle.cliente.telefono}</Typography>
                        </Grid>
                      </Grid>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No hay cliente asignado
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>
              
              {/* Historial de Servicios */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    Historial de Servicios
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Fecha</TableCell>
                          <TableCell>Tipo</TableCell>
                          <TableCell>Descripción</TableCell>
                          <TableCell>Estado</TableCell>
                          <TableCell>Mecánico</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {vehiculoDetalle.servicios?.map((servicio) => (
                          <TableRow key={servicio.id}>
                            <TableCell>
                              {new Date(servicio.fecha_inicio).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{servicio.tipo_servicio}</TableCell>
                            <TableCell>{servicio.descripcion}</TableCell>
                            <TableCell>
                              <Chip
                                label={formatEstadoLabel(servicio.estado)}
                                color={
                                  servicio.estado === 'completado' ? 'success' :
                                  servicio.estado === 'en_progreso' ? 'warning' :
                                  servicio.estado === 'diagnostico' ? 'info' :
                                  servicio.estado === 'pausado' ? 'secondary' :
                                  servicio.estado === 'cancelado' ? 'error' : 
                                  'primary'
                                }
                                size="small"
                                sx={{ 
                                  fontWeight: 'medium',
                                  '&.MuiChip-colorSuccess': {
                                    bgcolor: '#4CAF50',
                                    color: 'white'
                                  },
                                  '&.MuiChip-colorWarning': {
                                    bgcolor: '#FF9800',
                                    color: 'white'
                                  },
                                  '&.MuiChip-colorInfo': {
                                    bgcolor: '#2196F3',
                                    color: 'white'
                                  },
                                  '&.MuiChip-colorSecondary': {
                                    bgcolor: '#9C27B0',
                                    color: 'white'
                                  },
                                  '&.MuiChip-colorError': {
                                    bgcolor: '#F44336',
                                    color: 'white'
                                  },
                                  '&.MuiChip-colorPrimary': {
                                    bgcolor: '#3F51B5',
                                    color: 'white'
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              {servicio.mecanico ? 
                                `${servicio.mecanico.nombre} ${servicio.mecanico.apellido}` : 
                                'Sin asignar'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => setDialogoVehiculoAbierto(false)} 
            color="inherit"
          >
            Cerrar
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => handleOpenDialog(vehiculoDetalle)}
              startIcon={<EditIcon />}
              disabled={loading}
            >
              Editar
            </Button>
            <Button 
              variant="contained" 
              color="error"
              onClick={() => handleDelete(vehiculoDetalle.id)}
              startIcon={<DeleteIcon />}
              disabled={loading}
            >
              Eliminar
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={() => {
          setError('');
          setSuccess('');
        }}
      >
        <Alert
          onClose={() => {
            setError('');
            setSuccess('');
          }}
          severity={error ? 'error' : 'success'}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Vehiculos;
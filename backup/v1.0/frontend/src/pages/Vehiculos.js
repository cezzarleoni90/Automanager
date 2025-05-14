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
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

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

  useEffect(() => {
    cargarVehiculos();
    cargarClientes();

    // Manejar la navegación desde el módulo de Clientes
    const searchParams = new URLSearchParams(location.search);
    const vehiculoId = searchParams.get('vehiculo');
    const clienteId = location.state?.clienteId;
    const clienteNombre = location.state?.clienteNombre;

    if (vehiculoId) {
      const vehiculo = vehiculos.find(v => v.id === parseInt(vehiculoId));
      if (vehiculo) {
        handleOpenDialog(vehiculo);
      }
    } else if (clienteId) {
      setClienteSeleccionado({
        id: clienteId,
        nombre: clienteNombre
      });
      setVehiculoActual(prev => ({
        ...prev,
        cliente_id: clienteId
      }));
      handleOpenDialog();
    }
  }, [location]);

  const cargarVehiculos = async () => {
    try {
      const data = await api.getVehiculos();
      setVehiculos(data.vehiculos || []);
    } catch (error) {
      setError(error.message);
      if (error.message.includes('autenticación')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const cargarClientes = async () => {
    try {
      const data = await api.getClientes();
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
      setVehiculoActual(vehiculo);
    } else {
      setVehiculoActual({
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
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVehiculoActual((prev) => ({
      ...prev,
      [name]: value,
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
        // Convertir strings vacíos a null para campos opcionales
        color: vehiculoActual.color || null,
        tipo_combustible: vehiculoActual.tipo_combustible || null,
        transmision: vehiculoActual.transmision || null,
        vin: vehiculoActual.vin || null,
        ultimo_servicio: vehiculoActual.ultimo_servicio || null
      };

      if (vehiculoActual.id) {
        await api.updateVehiculo(vehiculoActual.id, datosVehiculo);
        setSuccess('Vehículo actualizado exitosamente');
      } else {
        await api.createVehiculo(datosVehiculo);
        setSuccess('Vehículo creado exitosamente');
      }
      handleCloseDialog();
      cargarVehiculos();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este vehículo?')) {
      return;
    }

    try {
      await api.deleteVehiculo(id);
      setSuccess('Vehículo eliminado exitosamente');
      cargarVehiculos();
    } catch (error) {
      setError(error.message);
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
    setVehiculoSeleccionado(vehiculo);
    setOpenServiciosDialog(true);
  };

  const handleCloseServiciosDialog = () => {
    setOpenServiciosDialog(false);
    setVehiculoSeleccionado(null);
  };

  const handleIrAServicio = (servicioId) => {
    navigate(`/servicios?servicio=${servicioId}`);
  };

  const handleAgregarServicio = () => {
    navigate('/servicios', { 
      state: { 
        vehiculoId: vehiculoSeleccionado?.id,
        vehiculoInfo: `${vehiculoSeleccionado?.marca} ${vehiculoSeleccionado?.modelo} (${vehiculoSeleccionado?.placa})`
      } 
    });
    handleCloseServiciosDialog();
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
                    label={`${vehiculo.servicios?.length || 0} servicios`}
                    onClick={() => handleVerServicios(vehiculo)}
                    color="secondary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Ver servicios">
                      <IconButton onClick={() => handleVerServicios(vehiculo)}>
                        <BuildIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleOpenDialog(vehiculo)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton onClick={() => handleDelete(vehiculo.id)}>
                        <DeleteIcon />
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
                  value={vehiculoActual.marca}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Modelo"
                  name="modelo"
                  value={vehiculoActual.modelo}
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
                  value={vehiculoActual.año}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Placa"
                  name="placa"
                  value={vehiculoActual.placa}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Color"
                  name="color"
                  value={vehiculoActual.color}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Cliente</InputLabel>
                  <Select
                    name="cliente_id"
                    value={vehiculoActual.cliente_id}
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
                  value={vehiculoActual.kilometraje}
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
                  value={vehiculoActual.vin}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BuildIcon />
            <Typography variant="h6">
              Servicios de {vehiculoSeleccionado?.marca} {vehiculoSeleccionado?.modelo} ({vehiculoSeleccionado?.placa})
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {vehiculoSeleccionado?.servicios?.length > 0 ? (
            <List>
              {vehiculoSeleccionado.servicios.map((servicio) => (
                <ListItem 
                  key={servicio.id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" component="div">
                        {servicio.tipo_servicio}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" component="div">
                        <Box component="span" sx={{ display: 'block' }}>
                          Estado: {servicio.estado}
                        </Box>
                        <Box component="span" sx={{ display: 'block' }}>
                          Fecha: {new Date(servicio.fecha_inicio).toLocaleDateString()}
                        </Box>
                        {servicio.mecanico && (
                          <Box component="span" sx={{ display: 'block' }}>
                            Mecánico: {servicio.mecanico.nombre} {servicio.mecanico.apellido}
                          </Box>
                        )}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleIrAServicio(servicio.id)}
                        startIcon={<VisibilityIcon />}
                      >
                        Ver detalles
                      </Button>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <BuildIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Este vehículo no tiene servicios registrados.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleAgregarServicio}
            variant="contained"
            startIcon={<AddIcon />}
          >
            Agregar servicio
          </Button>
          <Button onClick={handleCloseServiciosDialog}>Cerrar</Button>
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
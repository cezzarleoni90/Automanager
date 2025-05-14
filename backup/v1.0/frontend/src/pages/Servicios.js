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
  Build as BuildIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

function Servicios() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [servicios, setServicios] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [servicioActual, setServicioActual] = useState({
    tipo_servicio: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'pendiente',
    vehiculo_id: '',
    mecanico_id: '',
  });
  const [busqueda, setBusqueda] = useState('');
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);

  useEffect(() => {
    cargarServicios();
    cargarVehiculos();
    cargarMecanicos();

    // Manejar la navegación desde el módulo de Vehículos
    const searchParams = new URLSearchParams(location.search);
    const servicioId = searchParams.get('servicio');
    const vehiculoId = location.state?.vehiculoId;
    const vehiculoInfo = location.state?.vehiculoInfo;

    if (servicioId) {
      const servicio = servicios.find(s => s.id === parseInt(servicioId));
      if (servicio) {
        handleOpenDialog(servicio);
      }
    } else if (vehiculoId) {
      setVehiculoSeleccionado({
        id: vehiculoId,
        info: vehiculoInfo
      });
      setServicioActual(prev => ({
        ...prev,
        vehiculo_id: vehiculoId
      }));
      handleOpenDialog();
    }
  }, [location]);

  const cargarServicios = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/servicios', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar los servicios');
      }

      const data = await response.json();
      setServicios(data.servicios || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarVehiculos = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/vehiculos', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar los vehículos');
      }

      const data = await response.json();
      setVehiculos(data.vehiculos || []);
    } catch (error) {
      setError(error.message);
    }
  };

  const cargarMecanicos = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/mecanicos', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar los mecánicos');
      }

      const data = await response.json();
      setMecanicos(data.mecanicos || []);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleOpenDialog = (servicio = null) => {
    if (servicio) {
      setServicioActual(servicio);
    } else {
      setServicioActual({
        tipo_servicio: '',
        descripcion: '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: '',
        estado: 'pendiente',
        vehiculo_id: vehiculoSeleccionado?.id || '',
        mecanico_id: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setServicioActual((prev) => ({
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
      const url = servicioActual.id
        ? `http://localhost:5000/api/servicios/${servicioActual.id}`
        : 'http://localhost:5000/api/servicios';
      
      const method = servicioActual.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(servicioActual),
      });

      if (!response.ok) {
        throw new Error('Error al guardar el servicio');
      }

      setSuccess(`Servicio ${servicioActual.id ? 'actualizado' : 'creado'} exitosamente`);
      handleCloseDialog();
      cargarServicios();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este servicio?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/servicios/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el servicio');
      }

      setSuccess('Servicio eliminado exitosamente');
      cargarServicios();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleIrAVehiculo = (vehiculoId) => {
    navigate(`/vehiculos?vehiculo=${vehiculoId}`);
  };

  const handleIrAMecanico = (mecanicoId) => {
    navigate(`/mecanicos?mecanico=${mecanicoId}`);
  };

  const serviciosFiltrados = servicios.filter((servicio) =>
    `${servicio.tipo_servicio} ${servicio.descripcion} ${servicio.estado}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Gestión de Servicios</Typography>
          {vehiculoSeleccionado && (
            <Typography variant="subtitle1" color="text.secondary">
              Agregando servicio para: {vehiculoSeleccionado.info}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setVehiculoSeleccionado(null);
            handleOpenDialog();
          }}
        >
          Nuevo Servicio
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar servicios..."
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
              <TableCell>Tipo</TableCell>
              <TableCell>Vehículo</TableCell>
              <TableCell>Mecánico</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {serviciosFiltrados.map((servicio) => (
              <TableRow key={servicio.id}>
                <TableCell>
                  <Typography variant="subtitle1">{servicio.tipo_servicio}</Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CarIcon fontSize="small" color="action" />
                    <Link
                      component="button"
                      variant="body2"
                      onClick={() => handleIrAVehiculo(servicio.vehiculo_id)}
                      sx={{ textDecoration: 'none' }}
                    >
                      {vehiculos.find(v => v.id === servicio.vehiculo_id)?.placa || 'Vehículo no encontrado'}
                    </Link>
                  </Box>
                </TableCell>
                <TableCell>
                  {servicio.mecanico_id ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      <Link
                        component="button"
                        variant="body2"
                        onClick={() => handleIrAMecanico(servicio.mecanico_id)}
                        sx={{ textDecoration: 'none' }}
                      >
                        {mecanicos.find(m => m.id === servicio.mecanico_id)?.nombre || 'Mecánico no encontrado'}
                      </Link>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Sin asignar
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={servicio.estado}
                    color={
                      servicio.estado === 'completado' ? 'success' :
                      servicio.estado === 'en_proceso' ? 'warning' :
                      'error'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(servicio.fecha_inicio).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleOpenDialog(servicio)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton onClick={() => handleDelete(servicio.id)}>
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
          <Box>
            <Typography variant="h6" component="div">
              {servicioActual.id ? 'Editar Servicio' : 'Nuevo Servicio'}
            </Typography>
            {vehiculoSeleccionado && !servicioActual.id && (
              <Typography variant="subtitle2" color="text.secondary">
                Vehículo: {vehiculoSeleccionado.info}
              </Typography>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo de Servicio</InputLabel>
                  <Select
                    name="tipo_servicio"
                    value={servicioActual.tipo_servicio}
                    onChange={handleInputChange}
                    label="Tipo de Servicio"
                  >
                    <MenuItem value="mantenimiento">Mantenimiento</MenuItem>
                    <MenuItem value="reparacion">Reparación</MenuItem>
                    <MenuItem value="diagnostico">Diagnóstico</MenuItem>
                    <MenuItem value="revision">Revisión</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  name="descripcion"
                  value={servicioActual.descripcion}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fecha de Inicio"
                  name="fecha_inicio"
                  type="date"
                  value={servicioActual.fecha_inicio}
                  onChange={handleInputChange}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fecha de Fin"
                  name="fecha_fin"
                  type="date"
                  value={servicioActual.fecha_fin}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    name="estado"
                    value={servicioActual.estado}
                    onChange={handleInputChange}
                    label="Estado"
                  >
                    <MenuItem value="pendiente">Pendiente</MenuItem>
                    <MenuItem value="en_proceso">En Proceso</MenuItem>
                    <MenuItem value="completado">Completado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Vehículo</InputLabel>
                  <Select
                    name="vehiculo_id"
                    value={servicioActual.vehiculo_id}
                    onChange={handleInputChange}
                    label="Vehículo"
                    disabled={!!vehiculoSeleccionado}
                  >
                    {vehiculos.map((vehiculo) => (
                      <MenuItem key={vehiculo.id} value={vehiculo.id}>
                        {vehiculo.marca} {vehiculo.modelo} ({vehiculo.placa})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Mecánico</InputLabel>
                  <Select
                    name="mecanico_id"
                    value={servicioActual.mecanico_id}
                    onChange={handleInputChange}
                    label="Mecánico"
                  >
                    <MenuItem value="">Sin asignar</MenuItem>
                    {mecanicos.map((mecanico) => (
                      <MenuItem key={mecanico.id} value={mecanico.id}>
                        {mecanico.nombre} {mecanico.apellido}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {servicioActual.id ? 'Actualizar' : 'Crear'}
          </Button>
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

export default Servicios; 
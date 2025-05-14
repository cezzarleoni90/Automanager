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
import { 
  getServicios, 
  getServicio, 
  createServicio, 
  updateServicio, 
  deleteServicio,
  asignarMecanico,
  agregarRepuesto,
  obtenerRepuestos,
  cambiarEstado,
  obtenerHistorial,
  obtenerEstados
} from '../services/api';

function Servicios() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [servicios, setServicios] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [repuestosServicio, setRepuestosServicio] = useState([]);
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
  const [mecanicoSeleccionado, setMecanicoSeleccionado] = useState('');
  const [repuestoSeleccionado, setRepuestoSeleccionado] = useState('');
  const [cantidadRepuesto, setCantidadRepuesto] = useState(1);
  const [estados, setEstados] = useState({});
  const [historial, setHistorial] = useState([]);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('');
  const [comentarioEstado, setComentarioEstado] = useState('');

  useEffect(() => {
    cargarServicios();
    cargarVehiculos();
    cargarMecanicos();
    cargarRepuestos();

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

  useEffect(() => {
    const cargarEstados = async () => {
      try {
        const data = await obtenerEstados();
        setEstados(data);
      } catch (error) {
        console.error('Error al cargar estados:', error);
      }
    };
    cargarEstados();
  }, []);

  useEffect(() => {
    if (servicioActual.id) {
      cargarRepuestosServicio();
    }
  }, [servicioActual.id]);

  useEffect(() => {
    if (servicioActual.id) {
      cargarHistorial(servicioActual.id);
    }
  }, [servicioActual.id]);

  const cargarServicios = async () => {
    try {
      const data = await getServicios();
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
      const response = await fetch('http://localhost:5000/api/servicios/mecanicos', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar los mecánicos');
      }

      const data = await response.json();
      setMecanicos(data);
    } catch (error) {
      console.error('Error al cargar mecánicos:', error);
    }
  };

  const cargarRepuestos = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/inventario/repuestos', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar los repuestos');
      }

      const data = await response.json();
      setRepuestos(data.repuestos || []);
    } catch (error) {
      console.error('Error al cargar repuestos:', error);
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

  const handleAsignarMecanico = async () => {
    try {
      if (!servicioActual.id || !mecanicoSeleccionado) {
        setError('Seleccione un servicio y un mecánico');
        return;
      }

      await asignarMecanico(servicioActual.id, { mecanico_id: mecanicoSeleccionado });
      setSuccess('Mecánico asignado exitosamente');
      setMecanicoSeleccionado('');
      cargarServicios();
    } catch (error) {
      setError(error.response?.data?.error || 'Error al asignar mecánico');
    }
  };

  const handleAgregarRepuesto = async () => {
    try {
      if (!servicioActual.id || !repuestoSeleccionado || !cantidadRepuesto) {
        setError('Complete todos los campos');
        return;
      }

      await agregarRepuesto(servicioActual.id, {
        repuesto_id: repuestoSeleccionado,
        cantidad: parseInt(cantidadRepuesto)
      });
      setSuccess('Repuesto agregado exitosamente');
      setRepuestoSeleccionado('');
      setCantidadRepuesto(1);
      cargarRepuestosServicio();
    } catch (error) {
      setError(error.response?.data?.error || 'Error al agregar repuesto');
    }
  };

  const cargarRepuestosServicio = async () => {
    if (!servicioActual.id) return;
    try {
      const data = await obtenerRepuestos(servicioActual.id);
      setRepuestosServicio(data.repuestos);
    } catch (error) {
      console.error('Error al cargar repuestos del servicio:', error);
    }
  };

  const cargarHistorial = async (servicioId) => {
    try {
      const data = await obtenerHistorial(servicioId);
      setHistorial(data.historial);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    }
  };

  const handleCambiarEstado = async () => {
    if (!estadoSeleccionado) {
      alert('Por favor seleccione un estado');
      return;
    }

    try {
      await cambiarEstado(servicioActual.id, {
        estado: estadoSeleccionado,
        comentario: comentarioEstado
      });
      
      // Recargar datos
      await cargarServicios();
      await cargarHistorial(servicioActual.id);
      
      // Limpiar formulario
      setEstadoSeleccionado('');
      setComentarioEstado('');
      
      alert('Estado actualizado exitosamente');
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar estado: ' + error.message);
    }
  };

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

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Asignar Mecánico
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Mecánico</InputLabel>
              <Select
                value={mecanicoSeleccionado}
                onChange={(e) => setMecanicoSeleccionado(e.target.value)}
              >
                {mecanicos.map((mecanico) => (
                  <MenuItem key={mecanico.id} value={mecanico.id}>
                    {mecanico.nombre} {mecanico.apellido}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAsignarMecanico}
              fullWidth
            >
              Asignar
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Gestionar Repuestos
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Repuesto</InputLabel>
              <Select
                value={repuestoSeleccionado}
                onChange={(e) => setRepuestoSeleccionado(e.target.value)}
              >
                {repuestos.map((repuesto) => (
                  <MenuItem key={repuesto.id} value={repuesto.id}>
                    {repuesto.nombre} - Stock: {repuesto.stock}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              type="number"
              label="Cantidad"
              value={cantidadRepuesto}
              onChange={(e) => setCantidadRepuesto(e.target.value)}
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAgregarRepuesto}
              fullWidth
            >
              Agregar
            </Button>
          </Grid>
        </Grid>

        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Repuesto</TableCell>
                <TableCell>Cantidad</TableCell>
                <TableCell>Precio Unitario</TableCell>
                <TableCell>Subtotal</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {repuestosServicio.map((repuesto) => (
                <TableRow key={repuesto.id}>
                  <TableCell>{repuesto.nombre}</TableCell>
                  <TableCell>{repuesto.cantidad}</TableCell>
                  <TableCell>${repuesto.precio_unitario}</TableCell>
                  <TableCell>${repuesto.subtotal}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Sección de cambio de estado */}
      {servicioActual.id && (
        <div className="mt-4 p-4 bg-white rounded shadow">
          <h3 className="text-lg font-semibold mb-4">Cambiar Estado</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nuevo Estado</label>
              <select
                value={estadoSeleccionado}
                onChange={(e) => setEstadoSeleccionado(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Seleccione un estado</option>
                {servicioActual && estados[servicioActual.estado]?.siguientes.map(estado => (
                  <option key={estado} value={estado}>
                    {estados[estado]?.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Comentario</label>
              <input
                type="text"
                value={comentarioEstado}
                onChange={(e) => setComentarioEstado(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ingrese un comentario (opcional)"
              />
            </div>
          </div>
          <button
            onClick={handleCambiarEstado}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Cambiar Estado
          </button>
        </div>
      )}

      {/* Sección de historial */}
      {servicioActual.id && (
        <div className="mt-4 p-4 bg-white rounded shadow">
          <h3 className="text-lg font-semibold mb-4">Historial de Estados</h3>
          <div className="space-y-4">
            {historial.map((item) => (
              <div key={item.id} className="border-l-4 border-blue-500 pl-4">
                <div className="flex justify-between">
                  <span className="font-medium">
                    {estados[item.estado_anterior]?.nombre} → {estados[item.estado_nuevo]?.nombre}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(item.fecha).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{item.comentario}</p>
                <p className="text-xs text-gray-500">Por: {item.usuario}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
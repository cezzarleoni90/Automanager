import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Tooltip,
  InputAdornment,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  Build as BuildIcon,
  Money as MoneyIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

function Mecanicos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mecanicos, setMecanicos] = useState([]);
  const [serviciosMecanico, setServiciosMecanico] = useState([]);
  const [horasTrabajo, setHorasTrabajo] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openHorasDialog, setOpenHorasDialog] = useState(false);
  const [openServiciosDialog, setOpenServiciosDialog] = useState(false);
  const [openEstadisticasDialog, setOpenEstadisticasDialog] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [mecanicoActual, setMecanicoActual] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    especialidad: '',
    tarifa_hora: '',
    estado: 'activo'
  });
  const [horaTrabajoActual, setHoraTrabajoActual] = useState({
    fecha: '',
    horas_trabajadas: 1,
    tipo_trabajo: 'general',
    notas: '',
    servicio_id: ''
  });
  const [servicios, setServicios] = useState([]);

  const especialidades = [
    'Mecánica General',
    'Electricidad',
    'Carrocería',
    'Pintura',
    'Motor',
    'Transmisión',
    'Suspensión',
    'Frenos',
    'Aire Acondicionado',
    'Diagnóstico Electrónico'
  ];

  useEffect(() => {
    cargarMecanicos();
    cargarServicios();

    // Manejar la navegación desde otras páginas
    const searchParams = new URLSearchParams(location.search);
    const mecanicoId = searchParams.get('mecanico');

    if (mecanicoId) {
      obtenerMecanico(parseInt(mecanicoId));
    }
  }, [location]);

  const cargarMecanicos = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/mecanicos/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar mecánicos');
      }

      const data = await response.json();
      setMecanicos(data.mecanicos || []);
    } catch (error) {
      setError(error.message);
      console.error('Error al cargar mecánicos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarServicios = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/servicios/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar servicios');
      }

      const data = await response.json();
      setServicios(data.servicios || []);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
    }
  };

  const obtenerMecanico = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/mecanicos/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener detalles del mecánico');
      }

      const data = await response.json();
      setMecanicoActual(data);
      handleOpenDialog();
    } catch (error) {
      setError(error.message);
      console.error('Error al obtener mecánico:', error);
    }
  };

  const obtenerServiciosMecanico = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/mecanicos/${id}/servicios`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener servicios del mecánico');
      }

      const data = await response.json();
      setServiciosMecanico(data.servicios || []);
      setOpenServiciosDialog(true);
    } catch (error) {
      setError(error.message);
      console.error('Error al obtener servicios del mecánico:', error);
    }
  };

  const obtenerEstadisticasMecanico = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/mecanicos/${id}/estadisticas`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener estadísticas del mecánico');
      }

      const data = await response.json();
      setEstadisticas(data);
      setOpenEstadisticasDialog(true);
    } catch (error) {
      setError(error.message);
      console.error('Error al obtener estadísticas del mecánico:', error);
    }
  };

  const handleOpenDialog = (mecanico = null) => {
    if (mecanico) {
      setMecanicoActual({
        ...mecanico,
        tarifa_hora: mecanico.tarifa_hora || 0
      });
    } else {
      setMecanicoActual({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        especialidad: '',
        tarifa_hora: 0,
        estado: 'activo'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenHorasDialog = (mecanico) => {
    setMecanicoActual(mecanico);
    setHoraTrabajoActual({
      fecha: new Date().toISOString().split('T')[0],
      horas_trabajadas: 1,
      tipo_trabajo: 'general',
      notas: '',
      servicio_id: ''
    });
    setOpenHorasDialog(true);
  };

  const handleCloseHorasDialog = () => {
    setOpenHorasDialog(false);
  };

  const handleCloseServiciosDialog = () => {
    setOpenServiciosDialog(false);
  };

  const handleCloseEstadisticasDialog = () => {
    setOpenEstadisticasDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMecanicoActual(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleHoraTrabajoInputChange = (e) => {
    const { name, value } = e.target;
    setHoraTrabajoActual(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const url = mecanicoActual.id
        ? `http://localhost:5000/api/mecanicos/${mecanicoActual.id}`
        : 'http://localhost:5000/api/mecanicos/';
      
      const method = mecanicoActual.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(mecanicoActual)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar el mecánico');
      }

      setSuccess(`Mecánico ${mecanicoActual.id ? 'actualizado' : 'creado'} exitosamente`);
      handleCloseDialog();
      cargarMecanicos();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarHoras = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`http://localhost:5000/api/servicios/${horaTrabajoActual.servicio_id}/horas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          mecanico_id: mecanicoActual.id,
          horas: horaTrabajoActual.horas_trabajadas,
          descripcion: horaTrabajoActual.notas,
          fecha: horaTrabajoActual.fecha
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al registrar horas de trabajo');
      }

      setSuccess('Horas de trabajo registradas exitosamente');
      handleCloseHorasDialog();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este mecánico?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/mecanicos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar el mecánico');
      }

      setSuccess('Mecánico eliminado exitosamente');
      cargarMecanicos();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleIrAServicio = (servicioId) => {
    navigate(`/servicios?servicio=${servicioId}`);
  };

  const mecanicosFiltrados = mecanicos.filter(mecanico =>
    `${mecanico.nombre} ${mecanico.apellido} ${mecanico.especialidad}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Cargando...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestión de Mecánicos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Mecánico
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar mecánicos..."
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
              <TableCell>Mecánico</TableCell>
              <TableCell>Especialidad</TableCell>
              <TableCell>Tarifa/Hora</TableCell>
              <TableCell>Contacto</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Servicios Activos</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mecanicosFiltrados.map((mecanico) => (
              <TableRow key={mecanico.id}>
                <TableCell>
                  <Typography variant="subtitle1">{mecanico.nombre} {mecanico.apellido}</Typography>
                </TableCell>
                <TableCell>{mecanico.especialidad}</TableCell>
                <TableCell>${mecanico.tarifa_hora}/hora</TableCell>
                <TableCell>
                  <Typography variant="body2">{mecanico.telefono}</Typography>
                  <Typography variant="body2" color="textSecondary">{mecanico.email}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={mecanico.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    color={mecanico.estado === 'activo' ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{mecanico.servicios_activos || 0}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleOpenDialog(mecanico)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Ver Servicios">
                      <IconButton onClick={() => obtenerServiciosMecanico(mecanico.id)}>
                        <AssignmentIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Registrar Horas">
                      <IconButton onClick={() => handleOpenHorasDialog(mecanico)}>
                        <BuildIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Estadísticas">
                      <IconButton onClick={() => obtenerEstadisticasMecanico(mecanico.id)}>
                        <MoneyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton onClick={() => handleDelete(mecanico.id)}>
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

      {/* Dialog para crear/editar mecánico */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {mecanicoActual.id ? 'Editar Mecánico' : 'Nuevo Mecánico'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre"
                  name="nombre"
                  value={mecanicoActual.nombre}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Apellido"
                  name="apellido"
                  value={mecanicoActual.apellido}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={mecanicoActual.email}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  name="telefono"
                  value={mecanicoActual.telefono}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Especialidad</InputLabel>
                  <Select
                    name="especialidad"
                    value={mecanicoActual.especialidad}
                    onChange={handleInputChange}
                    label="Especialidad"
                  >
                    {especialidades.map((especialidad) => (
                      <MenuItem key={especialidad} value={especialidad}>
                        {especialidad}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tarifa por Hora"
                  name="tarifa_hora"
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={mecanicoActual.tarifa_hora}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    name="estado"
                    value={mecanicoActual.estado}
                    onChange={handleInputChange}
                    label="Estado"
                  >
                    <MenuItem value="activo">Activo</MenuItem>
                    <MenuItem value="inactivo">Inactivo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {mecanicoActual.id ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para registrar horas de trabajo */}
      <Dialog open={openHorasDialog} onClose={handleCloseHorasDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Registrar Horas de Trabajo - {mecanicoActual.nombre} {mecanicoActual.apellido}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleRegistrarHoras} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Servicio</InputLabel>
                  <Select
                    name="servicio_id"
                    value={horaTrabajoActual.servicio_id}
                    onChange={handleHoraTrabajoInputChange}
                    label="Servicio"
                  >
                    {servicios
                      .filter(s => s.estado !== 'completado' && s.estado !== 'cancelado')
                      .map((servicio) => (
                        <MenuItem key={servicio.id} value={servicio.id}>
                          {servicio.tipo_servicio} - {servicio.descripcion.substring(0, 30)}...
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fecha"
                  name="fecha"
                  type="date"
                  value={horaTrabajoActual.fecha}
                  onChange={handleHoraTrabajoInputChange}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Horas Trabajadas"
                  name="horas_trabajadas"
                  type="number"
                  inputProps={{ min: 0.5, step: 0.5 }}
                  value={horaTrabajoActual.horas_trabajadas}
                  onChange={handleHoraTrabajoInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tipo de Trabajo"
                  name="tipo_trabajo"
                  value={horaTrabajoActual.tipo_trabajo}
                  onChange={handleHoraTrabajoInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notas"
                  name="notas"
                  multiline
                  rows={2}
                  value={horaTrabajoActual.notas}
                  onChange={handleHoraTrabajoInputChange}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHorasDialog}>Cancelar</Button>
          <Button onClick={handleRegistrarHoras} variant="contained">
            Registrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para ver servicios del mecánico */}
      <Dialog open={openServiciosDialog} onClose={handleCloseServiciosDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Servicios de {mecanicoActual.nombre} {mecanicoActual.apellido}
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Vehículo</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {serviciosMecanico.length > 0 ? (
                  serviciosMecanico.map((servicio) => (
                    <TableRow key={servicio.id}>
                      <TableCell>{servicio.tipo_servicio}</TableCell>
                      <TableCell>{servicio.descripcion.substring(0, 30)}...</TableCell>
                      <TableCell>
                        <Chip
                          label={servicio.estado}
                          color={
                            servicio.estado === 'completado' ? 'success' :
                            servicio.estado === 'en_progreso' ? 'warning' :
                            'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{servicio.vehiculo.placa}</TableCell>
                      <TableCell>{formatFecha(servicio.fecha_inicio)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleIrAServicio(servicio.id)}
                        >
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No hay servicios asignados a este mecánico
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseServiciosDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para ver estadísticas del mecánico */}
      <Dialog open={openEstadisticasDialog} onClose={handleCloseEstadisticasDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Estadísticas de {mecanicoActual.nombre} {mecanicoActual.apellido}
        </DialogTitle>
        <DialogContent>
          {estadisticas && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Servicios por Estado
                    </Typography>
                    <List>
                      {Object.entries(estadisticas.servicios_por_estado).map(([estado, cantidad]) => (
                        <ListItem key={estado}>
                          <ListItemText 
                            primary={`${estado}: ${cantidad}`} 
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Resumen
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body1">
                        <strong>Total Servicios:</strong> {estadisticas.total_servicios}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Horas Trabajadas (Mes):</strong> {estadisticas.horas_trabajadas_mes}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Ingresos Generados (Mes):</strong> ${estadisticas.ingresos_generados_mes}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Tarifa Actual:</strong> ${estadisticas.tarifa_actual}/hora
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEstadisticasDialog}>Cerrar</Button>
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

export default Mecanicos; 
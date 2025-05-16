import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
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
  Snackbar,
  Alert,
  Chip,
  InputAdornment,
  Tooltip,
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
  Phone as PhoneIcon,
  Email as EmailIcon,
  DirectionsCar as CarIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getClientes, updateCliente, createCliente, deleteCliente } from '../services/api';

function Clientes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [clienteActual, setClienteActual] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
  });
  const [busqueda, setBusqueda] = useState('');
  const [openVehiculosDialog, setOpenVehiculosDialog] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [dialogoClienteAbierto, setDialogoClienteAbierto] = useState(false);
  const [clienteDetalle, setClienteDetalle] = useState(null);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const data = await getClientes();
      setClientes(data.clientes || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (cliente = null) => {
    if (cliente) {
      if (dialogoClienteAbierto) {
        setDialogoClienteAbierto(false);
        setTimeout(() => {
          setClienteActual({
            ...cliente,
            fecha_registro: cliente.fecha_registro ? new Date(cliente.fecha_registro).toISOString().split('T')[0] : ''
          });
          setOpenDialog(true);
        }, 100);
      } else {
        setClienteDetalle(cliente);
        setDialogoClienteAbierto(true);
      }
    } else {
      setClienteActual({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        direccion: '',
        fecha_registro: new Date().toISOString().split('T')[0],
        tipo_cliente: 'regular',
        notas: ''
      });
      setOpenDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClienteActual((prev) => ({
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
      if (clienteActual.id) {
        await updateCliente(clienteActual.id, clienteActual);
        setSuccess('Cliente actualizado exitosamente');
      } else {
        await createCliente(clienteActual);
        setSuccess('Cliente creado exitosamente');
      }
      handleCloseDialog();
      cargarClientes();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const cliente = clientes.find(c => c.id === id);
      if (cliente?.vehiculos?.length > 0) {
        setError('No se puede eliminar el cliente porque tiene vehículos asociados.');
        return;
      }

      if (!window.confirm('¿Está seguro de eliminar este cliente?')) {
        return;
      }

      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/clientes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar el cliente');
      }

      setSuccess('Cliente eliminado exitosamente');
      
      if (dialogoClienteAbierto) {
        setDialogoClienteAbierto(false);
      }
      
      await cargarClientes();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerVehiculos = (cliente) => {
    setClienteSeleccionado(cliente);
    setOpenVehiculosDialog(true);
  };

  const handleCloseVehiculosDialog = () => {
    setOpenVehiculosDialog(false);
    setClienteSeleccionado(null);
  };

  const handleIrAVehiculo = (vehiculoId) => {
    navigate(`/vehiculos?vehiculo=${vehiculoId}`);
  };

  const handleAgregarVehiculo = (cliente) => {
    if (!cliente || !cliente.id) {
      setError('Error: No se pudo obtener la información del cliente');
      return;
    }

    const clienteData = {
      id: cliente.id,
      nombre: cliente.nombre,
      apellido: cliente.apellido
    };

    console.log('Navegando a vehículos con datos del cliente:', clienteData);

    navigate('/vehiculos', { 
      state: clienteData
    });
    
    setDialogoClienteAbierto(false);
  };

  const clientesFiltrados = clientes.filter((cliente) =>
    `${cliente.nombre} ${cliente.apellido} ${cliente.email} ${cliente.telefono}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestión de Clientes</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Cliente
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar clientes..."
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
              <TableCell>Nombre</TableCell>
              <TableCell>Contacto</TableCell>
              <TableCell>Dirección</TableCell>
              <TableCell>Vehículos</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clientesFiltrados.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell>
                  <Typography variant="subtitle1">
                    {cliente.nombre} {cliente.apellido}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2">{cliente.email}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2">{cliente.telefono}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{cliente.direccion}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={<CarIcon />}
                    label={`${cliente.vehiculos?.length || 0} vehículos`}
                    onClick={() => handleVerVehiculos(cliente)}
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Ver detalles">
                      <IconButton onClick={() => handleOpenDialog(cliente)}>
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

      {/* Diálogo para ver vehículos */}
      <Dialog
        open={openVehiculosDialog}
        onClose={handleCloseVehiculosDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CarIcon />
            <Typography variant="h6">
              Vehículos de {clienteSeleccionado?.nombre} {clienteSeleccionado?.apellido}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {clienteSeleccionado?.vehiculos?.length > 0 ? (
            <List>
              {clienteSeleccionado.vehiculos.map((vehiculo) => (
                <ListItem 
                  key={vehiculo.id}
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
                        {vehiculo.marca} {vehiculo.modelo} ({vehiculo.año})
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" component="div">
                        <Box component="span" sx={{ display: 'block' }}>
                          Placa: {vehiculo.placa}
                        </Box>
                        <Box component="span" sx={{ display: 'block' }}>
                          Color: {vehiculo.color}
                        </Box>
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleIrAVehiculo(vehiculo.id)}
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
              <CarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Este cliente no tiene vehículos registrados.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => handleAgregarVehiculo(clienteSeleccionado)}
            variant="contained"
            startIcon={<AddIcon />}
          >
            Agregar vehículo
          </Button>
          <Button onClick={handleCloseVehiculosDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de detalles del cliente */}
      <Dialog 
        open={dialogoClienteAbierto} 
        onClose={() => setDialogoClienteAbierto(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', px: 2, py: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Detalles del Cliente
            </Typography>
            <IconButton 
              color="inherit" 
              onClick={() => setDialogoClienteAbierto(false)}
              aria-label="cerrar diálogo"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ p: 3 }}>
          {clienteDetalle && (
            <Grid container spacing={3}>
              {/* Información Personal */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    Información Personal
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Nombre:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{clienteDetalle.nombre}</Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Apellido:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{clienteDetalle.apellido}</Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Email:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{clienteDetalle.email}</Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Teléfono:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{clienteDetalle.telefono}</Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Dirección:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{clienteDetalle.direccion}</Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Tipo:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Chip 
                          label={clienteDetalle.tipo_cliente === 'vip' ? 'VIP' : 'Regular'} 
                          size="small"
                          sx={{ 
                            bgcolor: clienteDetalle.tipo_cliente === 'vip' ? '#ffd700' : '#e3f2fd',
                            color: clienteDetalle.tipo_cliente === 'vip' ? '#000' : '#1976d2'
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Información Adicional */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    Información Adicional
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Fecha Registro:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">
                          {new Date(clienteDetalle.fecha_registro).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Notas:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">
                          {clienteDetalle.notas || 'Sin notas'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Vehículos del Cliente */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: 'primary.main' }}>
                      Vehículos del Cliente
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        console.log('Cliente detalle al agregar vehículo:', clienteDetalle);
                        handleAgregarVehiculo(clienteDetalle);
                      }}
                      size="small"
                    >
                      Nuevo Vehículo
                    </Button>
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Marca</TableCell>
                          <TableCell>Modelo</TableCell>
                          <TableCell>Año</TableCell>
                          <TableCell>Placa</TableCell>
                          <TableCell>Color</TableCell>
                          <TableCell>Kilometraje</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {clienteDetalle.vehiculos?.length > 0 ? (
                          clienteDetalle.vehiculos.map((vehiculo) => (
                            <TableRow key={vehiculo.id}>
                              <TableCell>{vehiculo.marca}</TableCell>
                              <TableCell>{vehiculo.modelo}</TableCell>
                              <TableCell>{vehiculo.anio}</TableCell>
                              <TableCell>{vehiculo.placa}</TableCell>
                              <TableCell>{vehiculo.color}</TableCell>
                              <TableCell>{vehiculo.kilometraje}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              <Typography variant="body2" color="text.secondary">
                                No hay vehículos registrados
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
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
            onClick={() => setDialogoClienteAbierto(false)} 
            color="inherit"
          >
            Cerrar
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => handleOpenDialog(clienteDetalle)}
              startIcon={<EditIcon />}
              disabled={loading}
            >
              Editar
            </Button>
            <Button 
              variant="contained" 
              color="error"
              onClick={() => handleDelete(clienteDetalle.id)}
              startIcon={<DeleteIcon />}
              disabled={loading}
            >
              Eliminar
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Diálogo para crear/editar cliente */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {clienteActual.id ? 'Editar Cliente' : 'Nuevo Cliente'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre"
                  name="nombre"
                  value={clienteActual.nombre}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Apellido"
                  name="apellido"
                  value={clienteActual.apellido}
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
                  value={clienteActual.email}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  name="telefono"
                  value={clienteActual.telefono}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Dirección"
                  name="direccion"
                  value={clienteActual.direccion}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogActions>
        </form>
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

export default Clientes; 
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
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

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

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const data = await api.getClientes();
      setClientes(data.clientes || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (cliente = null) => {
    if (cliente) {
      setClienteActual(cliente);
    } else {
      setClienteActual({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        direccion: '',
      });
    }
    setOpenDialog(true);
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
        await api.updateCliente(clienteActual.id, clienteActual);
        setSuccess('Cliente actualizado exitosamente');
      } else {
        await api.createCliente(clienteActual);
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
    if (!window.confirm('¿Está seguro de eliminar este cliente?')) {
      return;
    }

    try {
      await api.deleteCliente(id);
      setSuccess('Cliente eliminado exitosamente');
      cargarClientes();
    } catch (error) {
      setError(error.message);
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

  const handleAgregarVehiculo = () => {
    navigate('/vehiculos', { 
      state: { 
        clienteId: clienteSeleccionado?.id,
        clienteNombre: `${clienteSeleccionado?.nombre} ${clienteSeleccionado?.apellido}`
      } 
    });
    handleCloseVehiculosDialog();
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
                    <Tooltip title="Ver vehículos">
                      <IconButton onClick={() => handleVerVehiculos(cliente)}>
                        <CarIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleOpenDialog(cliente)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton onClick={() => handleDelete(cliente.id)}>
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
            onClick={handleAgregarVehiculo}
            variant="contained"
            startIcon={<AddIcon />}
          >
            Agregar vehículo
          </Button>
          <Button onClick={handleCloseVehiculosDialog}>Cerrar</Button>
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
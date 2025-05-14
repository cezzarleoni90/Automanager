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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Grid,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

function Inventario() {
  const [repuestos, setRepuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [repuestoActual, setRepuestoActual] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    marca: '',
    modelo: '',
    stock: 0,
    stock_minimo: 5,
    precio_compra: 0,
    precio_venta: 0,
    categoria: '',
    ubicacion: '',
  });
  const [busqueda, setBusqueda] = useState('');
  const [openMovimientoDialog, setOpenMovimientoDialog] = useState(false);
  const [movimientoActual, setMovimientoActual] = useState({
    tipo: 'entrada',
    cantidad: 1,
    motivo: '',
  });

  useEffect(() => {
    cargarRepuestos();
  }, []);

  const cargarRepuestos = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/inventario/repuestos', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar los repuestos');
      }

      const data = await response.json();
      setRepuestos(Array.isArray(data) ? data : []);
    } catch (error) {
      setError(error.message);
      setRepuestos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (repuesto = null) => {
    if (repuesto) {
      setRepuestoActual(repuesto);
    } else {
      setRepuestoActual({
        codigo: '',
        nombre: '',
        descripcion: '',
        marca: '',
        modelo: '',
        stock: 0,
        stock_minimo: 5,
        precio_compra: 0,
        precio_venta: 0,
        categoria: '',
        ubicacion: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenMovimientoDialog = (repuesto) => {
    setRepuestoActual(repuesto);
    setMovimientoActual({
      tipo: 'entrada',
      cantidad: 1,
      motivo: '',
    });
    setOpenMovimientoDialog(true);
  };

  const handleCloseMovimientoDialog = () => {
    setOpenMovimientoDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRepuestoActual((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMovimientoInputChange = (e) => {
    const { name, value } = e.target;
    setMovimientoActual((prev) => ({
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
      const url = repuestoActual.id
        ? `http://localhost:5000/api/inventario/repuestos/${repuestoActual.id}`
        : 'http://localhost:5000/api/inventario/repuestos';
      
      const method = repuestoActual.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(repuestoActual),
      });

      if (!response.ok) {
        throw new Error('Error al guardar el repuesto');
      }

      setSuccess(`Repuesto ${repuestoActual.id ? 'actualizado' : 'creado'} exitosamente`);
      handleCloseDialog();
      cargarRepuestos();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMovimientoSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:5000/api/inventario/movimientos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...movimientoActual,
          repuesto_id: repuestoActual.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al registrar el movimiento');
      }

      setSuccess('Movimiento registrado exitosamente');
      handleCloseMovimientoDialog();
      cargarRepuestos();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este repuesto?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/inventario/repuestos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el repuesto');
      }

      setSuccess('Repuesto eliminado exitosamente');
      cargarRepuestos();
    } catch (error) {
      setError(error.message);
    }
  };

  const repuestosFiltrados = Array.isArray(repuestos) ? repuestos.filter((repuesto) =>
    `${repuesto.codigo} ${repuesto.nombre} ${repuesto.marca} ${repuesto.modelo}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  ) : [];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestión de Inventario</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Repuesto
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar repuestos..."
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
              <TableCell>Código</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Marca/Modelo</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Precio Compra</TableCell>
              <TableCell>Precio Venta</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {repuestosFiltrados.map((repuesto) => (
              <TableRow key={repuesto.id}>
                <TableCell>{repuesto.codigo}</TableCell>
                <TableCell>{repuesto.nombre}</TableCell>
                <TableCell>
                  {repuesto.marca} {repuesto.modelo}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {repuesto.stock}
                    {repuesto.stock <= repuesto.stock_minimo && (
                      <Tooltip title="Stock bajo">
                        <WarningIcon color="warning" fontSize="small" />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
                <TableCell>${repuesto.precio_compra}</TableCell>
                <TableCell>${repuesto.precio_venta}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleOpenDialog(repuesto)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton onClick={() => handleDelete(repuesto.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Registrar Movimiento">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenMovimientoDialog(repuesto)}
                      >
                        Movimiento
                      </Button>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo para crear/editar repuesto */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {repuestoActual.id ? 'Editar Repuesto' : 'Nuevo Repuesto'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Código"
                  name="codigo"
                  value={repuestoActual.codigo}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre"
                  name="nombre"
                  value={repuestoActual.nombre}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  name="descripcion"
                  value={repuestoActual.descripcion}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Marca"
                  name="marca"
                  value={repuestoActual.marca}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Modelo"
                  name="modelo"
                  value={repuestoActual.modelo}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Stock"
                  name="stock"
                  type="number"
                  value={repuestoActual.stock}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Stock Mínimo"
                  name="stock_minimo"
                  type="number"
                  value={repuestoActual.stock_minimo}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Precio de Compra"
                  name="precio_compra"
                  type="number"
                  value={repuestoActual.precio_compra}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Precio de Venta"
                  name="precio_venta"
                  type="number"
                  value={repuestoActual.precio_venta}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Categoría"
                  name="categoria"
                  value={repuestoActual.categoria}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ubicación"
                  name="ubicacion"
                  value={repuestoActual.ubicacion}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {repuestoActual.id ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para registrar movimiento */}
      <Dialog open={openMovimientoDialog} onClose={handleCloseMovimientoDialog}>
        <DialogTitle>Registrar Movimiento</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleMovimientoSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Movimiento</InputLabel>
                  <Select
                    name="tipo"
                    value={movimientoActual.tipo}
                    onChange={handleMovimientoInputChange}
                    label="Tipo de Movimiento"
                  >
                    <MenuItem value="entrada">Entrada</MenuItem>
                    <MenuItem value="salida">Salida</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Cantidad"
                  name="cantidad"
                  type="number"
                  value={movimientoActual.cantidad}
                  onChange={handleMovimientoInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Motivo"
                  name="motivo"
                  value={movimientoActual.motivo}
                  onChange={handleMovimientoInputChange}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMovimientoDialog}>Cancelar</Button>
          <Button onClick={handleMovimientoSubmit} variant="contained">
            Registrar
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

export default Inventario; 
import React, { useState, useEffect, useRef } from 'react';
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
  Chip,
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
  Warning as WarningIcon,
  Category as CategoryIcon,
  QrCodeScanner as ScannerIcon,
  Autorenew as AutoGenerateIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
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
    notas: '',
  });

  // Estado para categorías
  const [categorias, setCategorias] = useState([
    'Motor',
    'Frenos', 
    'Filtros',
    'Suspensión',
    'Transmisión',
    'Eléctrico',
    'Carrocería',
    'General'
  ]);
  const [openCategoriasDialog, setOpenCategoriasDialog] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState('');

  // Estados para escáner (corregido con useRef)
  const [openScannerDialog, setOpenScannerDialog] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [dialogoRepuestoAbierto, setDialogoRepuestoAbierto] = useState(false);
  const [repuestoDetalle, setRepuestoDetalle] = useState(null);

  useEffect(() => {
    cargarRepuestos();
  }, []);

  // Función para generar código automáticamente
  const handleGenerarCodigo = async () => {
    try {
      // Generar código basado en timestamp y categoría
      const timestamp = Date.now().toString().slice(-6);
      const categoria = repuestoActual.categoria || 'GEN';
      const prefijo = categoria.substring(0, 3).toUpperCase();
      const codigo = `${prefijo}${timestamp}`;
      
      setRepuestoActual(prev => ({
        ...prev,
        codigo: codigo
      }));
      setSuccess('Código generado automáticamente');
    } catch (error) {
      setError('Error al generar código');
    }
  };

  // Funciones para escáner
  const startScanner = async () => {
    setIsScanning(true);
    setOpenScannerDialog(true);
    
    try {
      // Importar Quagga dinámicamente
      const Quagga = (await import('quagga')).default;
      
      // Configurar el escáner
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: videoRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment" // Cámara trasera
          }
        },
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: 2,
        decoder: {
          readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader"]
        },
        locate: true
      }, (err) => {
        if (err) {
          console.error(err);
          setError('Error al inicializar el escáner');
          setIsScanning(false);
          return;
        }
        Quagga.start();
      });

      // Escuchar detecciones
      Quagga.onDetected((result) => {
        const code = result.codeResult.code;
        setRepuestoActual(prev => ({
          ...prev,
          codigo: code
        }));
        setSuccess(`Código escaneado: ${code}`);
        stopScanner();
      });

    } catch (error) {
      setError('Error al cargar el escáner. Verifica que la librería esté instalada.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      const Quagga = (await import('quagga')).default;
      Quagga.stop();
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
    setIsScanning(false);
    setOpenScannerDialog(false);
  };

  const cargarRepuestos = async () => {
    try {
      console.log('🔄 Iniciando carga de repuestos...');
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/inventario/repuestos', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      
      const data = await response.json();
      console.log('📦 Repuestos recibidos:', data);
      
      // Mapear stock_actual a stock para compatibilidad
      setRepuestos((data.repuestos || []).map(repuesto => ({
        ...repuesto,
        stock: repuesto.stock_actual || repuesto.stock || 0
      })));
      console.log('✅ Repuestos actualizados en estado');
    } catch (error) {
      console.error('❌ Error en cargarRepuestos:', error);
      setError('Error al cargar repuestos');
    } finally {
      setLoading(false);
    }
  };

  // Gestión de categorías
  const handleAgregarCategoria = () => {
    if (nuevaCategoria && !categorias.includes(nuevaCategoria)) {
      setCategorias([...categorias, nuevaCategoria].sort());
      setNuevaCategoria('');
      setSuccess('Categoría agregada exitosamente');
    }
  };

  const handleEliminarCategoria = (categoria) => {
    if (categorias.length > 1) {
      setCategorias(categorias.filter(c => c !== categoria));
      setSuccess('Categoría eliminada exitosamente');
    }
  };

  const handleOpenDialog = (repuesto = null) => {
    if (repuesto) {
      if (dialogoRepuestoAbierto) {
        setDialogoRepuestoAbierto(false);
        setTimeout(() => {
          setRepuestoActual({
            ...repuesto,
            stock: repuesto.stock_actual || repuesto.stock || 0
          });
          setOpenDialog(true);
        }, 100);
      } else {
        setRepuestoDetalle(repuesto);
        setDialogoRepuestoAbierto(true);
      }
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
        categoria: categorias[0] || '',
        ubicacion: '',
      });
      setOpenDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenMovimientoDialog = (repuesto) => {
    setRepuestoActual(repuesto);
    setMovimientoActual({
      tipo: 'entrada',
      cantidad: 1,
      notas: '',
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

      const dataToSend = {
        codigo: repuestoActual.codigo,
        nombre: repuestoActual.nombre,
        categoria: repuestoActual.categoria || 'General',
        precio_compra: parseFloat(repuestoActual.precio_compra),
        precio_venta: parseFloat(repuestoActual.precio_venta),
        stock: parseInt(repuestoActual.stock) || 0,
        stock_minimo: parseInt(repuestoActual.stock_minimo) || 0,
        descripcion: repuestoActual.descripcion || ''
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar el repuesto');
      }

      setSuccess(`Repuesto ${repuestoActual.id ? 'actualizado' : 'creado'} exitosamente`);
      handleCloseDialog();
      console.log('🔄 Recargando lista de repuestos...');
      await cargarRepuestos();
      console.log('✅ Lista recargada');
    } catch (error) {
      console.error('Error completo:', error);
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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<CategoryIcon />}
            onClick={() => setOpenCategoriasDialog(true)}
          >
            Gestionar Categorías
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nuevo Repuesto
          </Button>
        </Box>
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
              <TableCell>Categoría</TableCell>
              <TableCell>Stock</TableCell>
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
                  <Chip 
                    label={repuesto.categoria || 'Sin categoría'} 
                    size="small"
                    sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {repuesto.stock}
                    {repuesto.stock <= repuesto.stock_minimo && (
                      <Tooltip title={`Stock bajo (mínimo: ${repuesto.stock_minimo})`}>
                        <WarningIcon color="warning" fontSize="small" />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
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
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    label="Código"
                    name="codigo"
                    value={repuestoActual.codigo}
                    onChange={handleInputChange}
                    required
                  />
                  <Tooltip title="Generar código automático">
                    <IconButton 
                      onClick={handleGenerarCodigo}
                      sx={{ bgcolor: '#e8f5e9' }}
                    >
                      <AutoGenerateIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Escanear código de barras">
                    <IconButton 
                      onClick={startScanner}
                      sx={{ bgcolor: '#e3f2fd' }}
                    >
                      <ScannerIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
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
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    name="categoria"
                    value={repuestoActual.categoria}
                    onChange={handleInputChange}
                    label="Categoría"
                    required
                  >
                    {categorias.map((categoria) => (
                      <MenuItem key={categoria} value={categoria}>
                        {categoria}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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

      {/* Diálogo para gestionar categorías */}
      <Dialog open={openCategoriasDialog} onClose={() => setOpenCategoriasDialog(false)}>
        <DialogTitle>Gestión de Categorías</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Nueva Categoría"
              value={nuevaCategoria}
              onChange={(e) => setNuevaCategoria(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAgregarCategoria();
                }
              }}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              onClick={handleAgregarCategoria}
              fullWidth
              sx={{ mb: 2 }}
            >
              Agregar Categoría
            </Button>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Categorías Existentes
            </Typography>
            <List>
              {categorias.map((categoria) => (
                <ListItem key={categoria}>
                  <ListItemText primary={categoria} />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleEliminarCategoria(categoria)}
                      disabled={categorias.length <= 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCategoriasDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para escáner de código de barras */}
      <Dialog 
        open={openScannerDialog} 
        onClose={stopScanner}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScannerIcon />
            Escáner de Código de Barras
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {isScanning ? (
              <Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Enfoca el código de barras en el área de la cámara
                </Typography>
                <Box 
                  sx={{ 
                    width: '100%', 
                    height: 300,
                    border: '2px solid #1976d2',
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}
                >
                  <video 
                    ref={videoRef}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
                <canvas 
                  ref={canvasRef}
                  style={{ display: 'none' }}
                />
              </Box>
            ) : (
              <Typography variant="body1">
                Preparando escáner...
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={stopScanner} color="primary">
            Cancelar
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
                  label="Notas"
                  name="notas"
                  value={movimientoActual.notas}
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
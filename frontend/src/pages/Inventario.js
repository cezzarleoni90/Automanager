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
  TablePagination,
  CircularProgress,
  Backdrop,
  FormHelperText,
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
  const [loading, setLoading] = useState(false);
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

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRepuestos, setTotalRepuestos] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [repuestoAEliminar, setRepuestoAEliminar] = useState(null);
  const [errorEliminacion, setErrorEliminacion] = useState(null);

  const [precioCompraInput, setPrecioCompraInput] = useState('');
  const [precioVentaInput, setPrecioVentaInput] = useState('');

  const [openStockDialog, setOpenStockDialog] = useState(false);
  const [historialMovimientos, setHistorialMovimientos] = useState([]);
  const [selectedRepuesto, setSelectedRepuesto] = useState(null);
  const [showRepuestoSelector, setShowRepuestoSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'nombre', direction: 'asc' });
  const [virtualPage, setVirtualPage] = useState(0);
  const virtualRowsPerPage = 10;
  const [isScanningInSelector, setIsScanningInSelector] = useState(false);
  const selectorVideoRef = useRef(null);
  const selectorCanvasRef = useRef(null);

  const cargarRepuestos = async () => {
    try {
      console.log('🔄 Iniciando carga de repuestos...');
      setIsLoading(true);
      setLoading(true);
      
      // Construir la URL de búsqueda
      let searchUrl = `http://localhost:5000/api/inventario/repuestos?page=${page + 1}&per_page=${rowsPerPage}`;
      
      // Agregar el término de búsqueda si existe
      if (busqueda && busqueda.trim() !== '') {
        searchUrl += `&search=${encodeURIComponent(busqueda.trim())}`;
      }
      
      console.log('🔍 URL de búsqueda:', searchUrl);
      
      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar los repuestos');
      }

      const data = await response.json();
      console.log('📦 Repuestos recibidos:', data);
      
      if (data.repuestos && Array.isArray(data.repuestos)) {
        // Filtrar los repuestos en el frontend
        let repuestosFiltrados = data.repuestos;
        if (busqueda && busqueda.trim() !== '') {
          const terminoBusqueda = busqueda.trim().toLowerCase();
          repuestosFiltrados = data.repuestos.filter(repuesto => 
            repuesto.nombre?.toLowerCase().includes(terminoBusqueda) ||
            repuesto.codigo?.toLowerCase().includes(terminoBusqueda) ||
            repuesto.categoria?.toLowerCase().includes(terminoBusqueda) ||
            repuesto.marca?.toLowerCase().includes(terminoBusqueda) ||
            repuesto.modelo?.toLowerCase().includes(terminoBusqueda)
          );
        }

        setRepuestos(repuestosFiltrados.map(repuesto => ({
          ...repuesto,
          stock: repuesto.stock_actual || repuesto.stock || 0
        })));
        setTotalRepuestos(repuestosFiltrados.length);
        
        // Mostrar mensaje si no hay resultados
        if (repuestosFiltrados.length === 0 && busqueda) {
          setError(`No se encontraron repuestos que coincidan con "${busqueda}"`);
        } else {
          setError('');
        }
      } else {
        setRepuestos([]);
        setTotalRepuestos(0);
        setError('Error en el formato de los datos recibidos');
      }
      
      console.log('✅ Repuestos actualizados en estado');
    } catch (error) {
      console.error('❌ Error en cargarRepuestos:', error);
      setError('Error al cargar repuestos');
      setRepuestos([]);
      setTotalRepuestos(0);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  // Efecto inicial para cargar datos
  useEffect(() => {
    cargarRepuestos();
  }, []);

  // Efecto para recargar cuando cambia la página o el tamaño
  useEffect(() => {
    if (page !== undefined && rowsPerPage !== undefined) {
      cargarRepuestos();
    }
  }, [page, rowsPerPage]);

  // Efecto para manejar la búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (busqueda !== undefined) {
        setPage(0); // Resetear a la primera página
        cargarRepuestos();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [busqueda]);

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

  // Función para escáner
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
          readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "upc_reader", "upc_e_reader"]
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
        console.log('Código detectado:', code);
        
        // Buscar el repuesto por código
        buscarPorCodigo(code);
        
        // Cerrar el escáner
        stopScanner();
      });

    } catch (error) {
      setError('Error al cargar el escáner. Verifica que la librería esté instalada.');
      setIsScanning(false);
    }
  };

  // Función para buscar por código
  const buscarPorCodigo = async (codigo) => {
    try {
      setLoading(true);
      setBusqueda(codigo); // Actualizar el campo de búsqueda
      
      const response = await fetch(`http://localhost:5000/api/inventario/repuestos?page=1&per_page=${rowsPerPage}&search=${encodeURIComponent(codigo)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al buscar el repuesto');
      }

      const data = await response.json();
      
      if (data.repuestos && data.repuestos.length > 0) {
        // Filtrar por código exacto
        const repuestosFiltrados = data.repuestos.filter(repuesto => 
          repuesto.codigo?.toLowerCase() === codigo.toLowerCase()
        );

        setRepuestos(repuestosFiltrados.map(repuesto => ({
          ...repuesto,
          stock: repuesto.stock_actual || repuesto.stock || 0
        })));
        setTotalRepuestos(repuestosFiltrados.length);
        
        if (repuestosFiltrados.length > 0) {
          setSuccess(`Repuesto encontrado: ${repuestosFiltrados[0].nombre}`);
          setError('');
        } else {
          setError(`No se encontró ningún repuesto con el código ${codigo}`);
        }
      } else {
        setRepuestos([]);
        setTotalRepuestos(0);
        setError(`No se encontró ningún repuesto con el código ${codigo}`);
      }
    } catch (error) {
      console.error('Error en buscarPorCodigo:', error);
      setError('Error al buscar el repuesto');
      setRepuestos([]);
      setTotalRepuestos(0);
    } finally {
      setLoading(false);
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
          setPrecioCompraInput(repuesto.precio_compra?.toString() || '');
          setPrecioVentaInput(repuesto.precio_venta?.toString() || '');
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
      setPrecioCompraInput('');
      setPrecioVentaInput('');
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

  // Función para formatear precios
  const formatearPrecio = (valor) => {
    if (valor === null || valor === undefined || valor === '') return '';
    return valor.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'precio_compra') {
      setPrecioCompraInput(value);
      const valorNumerico = value === '' ? 0 : parseFloat(value.replace(',', '.'));
      setRepuestoActual(prev => ({
        ...prev,
        precio_compra: valorNumerico
      }));
    } else if (name === 'precio_venta') {
      setPrecioVentaInput(value);
      const valorNumerico = value === '' ? 0 : parseFloat(value.replace(',', '.'));
      setRepuestoActual(prev => ({
        ...prev,
        precio_venta: valorNumerico
      }));
    } else if (name === 'stock' || name === 'stock_minimo') {
      const valorNumerico = parseInt(value) || 0;
      setRepuestoActual(prev => ({
        ...prev,
        [name]: valorNumerico
      }));
    } else {
      setRepuestoActual(prev => ({
        ...prev,
        [name]: value
      }));
    }
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
      // Validar campos requeridos
      const camposRequeridos = {
        codigo: 'Código',
        nombre: 'Nombre',
        categoria: 'Categoría',
        precio_compra: 'Precio de Compra',
        precio_venta: 'Precio de Venta'
      };

      const camposFaltantes = Object.entries(camposRequeridos)
        .filter(([key]) => !repuestoActual[key])
        .map(([_, label]) => label);

      if (camposFaltantes.length > 0) {
        throw new Error(`Los siguientes campos son obligatorios: ${camposFaltantes.join(', ')}`);
      }

      // Validar que los precios sean números positivos
      if (repuestoActual.precio_compra <= 0 || repuestoActual.precio_venta <= 0) {
        throw new Error('Los precios deben ser mayores a 0');
      }

      // Validar que el stock y stock mínimo sean números no negativos
      if (repuestoActual.stock < 0 || repuestoActual.stock_minimo < 0) {
        throw new Error('El stock y stock mínimo no pueden ser negativos');
      }

      const url = repuestoActual.id
        ? `http://localhost:5000/api/inventario/repuestos/${repuestoActual.id}`
        : 'http://localhost:5000/api/inventario/repuestos';
      
      const method = repuestoActual.id ? 'PUT' : 'POST';

      const dataToSend = {
        codigo: repuestoActual.codigo.trim(),
        nombre: repuestoActual.nombre.trim(),
        categoria: repuestoActual.categoria,
        precio_compra: parseFloat(repuestoActual.precio_compra),
        precio_venta: parseFloat(repuestoActual.precio_venta),
        stock: parseInt(repuestoActual.stock) || 0,
        stock_minimo: parseInt(repuestoActual.stock_minimo) || 0,
        descripcion: repuestoActual.descripcion?.trim() || '',
        marca: repuestoActual.marca?.trim() || '',
        modelo: repuestoActual.modelo?.trim() || '',
        ubicacion: repuestoActual.ubicacion?.trim() || ''
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar el repuesto');
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

  const handleVerDetalles = (repuesto) => {
    setRepuestoDetalle(repuesto);
    setDialogoRepuestoAbierto(true);
  };

  const handleCloseDetalles = () => {
    setDialogoRepuestoAbierto(false);
    setRepuestoDetalle(null);
  };

  const handleEditarDesdeDetalles = () => {
    setDialogoRepuestoAbierto(false);
    setTimeout(() => {
      setRepuestoActual({
        ...repuestoDetalle,
        stock: repuestoDetalle.stock_actual || repuestoDetalle.stock || 0
      });
      setOpenDialog(true);
    }, 100);
  };

  const handleConfirmarEliminacion = async () => {
    if (!repuestoAEliminar) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/inventario/repuestos/${repuestoAEliminar.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorEliminacion(data.error);
        return;
      }

      setSuccess('Repuesto eliminado exitosamente');
      setOpenConfirmDialog(false);
      setRepuestoAEliminar(null);
      setErrorEliminacion(null);
      cargarRepuestos();
    } catch (error) {
      console.error('Error al eliminar repuesto:', error);
      setErrorEliminacion(error.message || 'Error al eliminar el repuesto');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarDesdeDetalles = () => {
    setRepuestoAEliminar(repuestoDetalle);
    setErrorEliminacion(null);
    setOpenConfirmDialog(true);
  };

  const handleDelete = (id) => {
    const repuesto = repuestos.find(r => r.id === id);
    if (repuesto) {
      setRepuestoAEliminar(repuesto);
      setErrorEliminacion(null);
      setOpenConfirmDialog(true);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Función para cargar el historial de movimientos
  const cargarHistorialMovimientos = async (repuestoId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/inventario/movimientos/${repuestoId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar el historial de movimientos');
      }

      const data = await response.json();
      setHistorialMovimientos(data.movimientos || []);
    } catch (error) {
      console.error('Error al cargar historial:', error);
      setError('Error al cargar el historial de movimientos');
    }
  };

  const handleOpenStockDialog = () => {
    setShowRepuestoSelector(true);
  };

  const handleSelectRepuestoForStock = (repuesto) => {
    setSelectedRepuesto(repuesto);
    setShowRepuestoSelector(false);
    setOpenStockDialog(true);
    cargarHistorialMovimientos(repuesto.id);
  };

  const handleCloseStockDialog = () => {
    setOpenStockDialog(false);
    setSelectedRepuesto(null);
    setHistorialMovimientos([]);
  };

  // Función para filtrar y ordenar repuestos
  const getFilteredAndSortedRepuestos = () => {
    let filtered = [...repuestos];
    
    // Aplicar filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(repuesto => 
        repuesto.nombre?.toLowerCase().includes(term) ||
        repuesto.codigo?.toLowerCase().includes(term) ||
        repuesto.categoria?.toLowerCase().includes(term)
      );
    }

    // Aplicar filtro de categoría
    if (selectedCategoria) {
      filtered = filtered.filter(repuesto => 
        repuesto.categoria === selectedCategoria
      );
    }

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      if (!a[sortConfig.key] || !b[sortConfig.key]) return 0;
      
      const aValue = a[sortConfig.key].toString().toLowerCase();
      const bValue = b[sortConfig.key].toString().toLowerCase();
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  // Función para manejar el ordenamiento
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Función para obtener los repuestos paginados
  const getPaginatedRepuestos = () => {
    const filtered = getFilteredAndSortedRepuestos();
    const start = virtualPage * virtualRowsPerPage;
    return filtered.slice(start, start + virtualRowsPerPage);
  };

  // Función para manejar el cambio de página
  const handleVirtualPageChange = (event, newPage) => {
    setVirtualPage(newPage);
  };

  // Función para iniciar el escáner en el selector
  const startScannerInSelector = async () => {
    setIsScanningInSelector(true);
    
    try {
      const Quagga = (await import('quagga')).default;
      
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: selectorVideoRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment"
          }
        },
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: 2,
        decoder: {
          readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "upc_reader", "upc_e_reader"]
        },
        locate: true
      }, (err) => {
        if (err) {
          console.error(err);
          setError('Error al inicializar el escáner');
          setIsScanningInSelector(false);
          return;
        }
        Quagga.start();
      });

      Quagga.onDetected((result) => {
        const code = result.codeResult.code;
        console.log('Código detectado en selector:', code);
        setSearchTerm(code);
        stopScannerInSelector();
      });

    } catch (error) {
      setError('Error al cargar el escáner');
      setIsScanningInSelector(false);
    }
  };

  // Función para detener el escáner en el selector
  const stopScannerInSelector = async () => {
    try {
      const Quagga = (await import('quagga')).default;
      Quagga.stop();
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
    setIsScanningInSelector(false);
  };

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
            variant="outlined"
            startIcon={<AutoGenerateIcon />}
            onClick={handleOpenStockDialog}
          >
            Stock
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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar por nombre, código o categoría..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              if (e.target.value === '') {
                setError('');
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: busqueda && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setBusqueda('');
                      setError('');
                      cargarRepuestos();
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Tooltip title="Escanear código de barras">
            <IconButton 
              onClick={startScanner}
              sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              <ScannerIcon />
            </IconButton>
          </Tooltip>
        </Box>
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : repuestos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">
                    No se encontraron repuestos
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              repuestos.map((repuesto) => (
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
                  <TableCell>${formatearPrecio(repuesto.precio_venta)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Ver detalles">
                        <IconButton onClick={() => handleOpenDialog(repuesto)}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalRepuestos}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </TableContainer>

      {/* Backdrop para operaciones de carga */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

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
                    error={!repuestoActual.codigo && error.includes('Código')}
                    helperText={!repuestoActual.codigo && error.includes('Código') ? 'El código es obligatorio' : ''}
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
                  error={!repuestoActual.nombre && error.includes('Nombre')}
                  helperText={!repuestoActual.nombre && error.includes('Nombre') ? 'El nombre es obligatorio' : ''}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!repuestoActual.categoria && error.includes('Categoría')}>
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    name="categoria"
                    value={repuestoActual.categoria}
                    onChange={handleInputChange}
                    label="Categoría"
                  >
                    {categorias.map((categoria) => (
                      <MenuItem key={categoria} value={categoria}>
                        {categoria}
                      </MenuItem>
                    ))}
                  </Select>
                  {!repuestoActual.categoria && error.includes('Categoría') && (
                    <FormHelperText>La categoría es obligatoria</FormHelperText>
                  )}
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
                  value={precioCompraInput}
                  onChange={handleInputChange}
                  required
                  error={(!repuestoActual.precio_compra || repuestoActual.precio_compra <= 0) && error.includes('Precio de Compra')}
                  helperText={(!repuestoActual.precio_compra || repuestoActual.precio_compra <= 0) && error.includes('Precio de Compra') ? 'El precio debe ser mayor a 0' : ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    inputMode: 'decimal'
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Precio de Venta"
                  name="precio_venta"
                  value={precioVentaInput}
                  onChange={handleInputChange}
                  required
                  error={(!repuestoActual.precio_venta || repuestoActual.precio_venta <= 0) && error.includes('Precio de Venta')}
                  helperText={(!repuestoActual.precio_venta || repuestoActual.precio_venta <= 0) && error.includes('Precio de Venta') ? 'El precio debe ser mayor a 0' : ''}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    inputMode: 'decimal'
                  }}
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
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : (repuestoActual.id ? 'Actualizar' : 'Crear')}
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
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  <video 
                    ref={videoRef}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '80%',
                      height: '2px',
                      bgcolor: 'primary.main',
                      animation: 'scan 2s linear infinite',
                      '@keyframes scan': {
                        '0%': { top: '20%' },
                        '50%': { top: '80%' },
                        '100%': { top: '20%' }
                      }
                    }}
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

      {/* Diálogo de detalles */}
      <Dialog 
        open={dialogoRepuestoAbierto} 
        onClose={handleCloseDetalles}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', px: 2, py: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Detalles del Repuesto
            </Typography>
            <IconButton 
              color="inherit" 
              onClick={handleCloseDetalles}
              aria-label="cerrar diálogo"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ p: 3 }}>
          {repuestoDetalle && (
            <Grid container spacing={3}>
              {/* Información Básica */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    Información Básica
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Código:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{repuestoDetalle.codigo}</Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Nombre:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{repuestoDetalle.nombre}</Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Marca:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{repuestoDetalle.marca}</Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Modelo:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{repuestoDetalle.modelo}</Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Categoría:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{repuestoDetalle.categoria}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Información de Stock y Precios */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    Stock y Precios
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Stock Actual:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">
                          {repuestoDetalle.stock_actual || repuestoDetalle.stock || 0} unidades
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Stock Mínimo:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">
                          {repuestoDetalle.stock_minimo || 0} unidades
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Precio Compra:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">
                          ${formatearPrecio(repuestoDetalle.precio_compra)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Precio Venta:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">
                          ${formatearPrecio(repuestoDetalle.precio_venta)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Información Adicional */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    Información Adicional
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Descripción:</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {repuestoDetalle.descripcion || 'Sin descripción'}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Ubicación:</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {repuestoDetalle.ubicacion || 'No especificada'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleCloseDetalles} 
            color="inherit"
          >
            Cerrar
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleEditarDesdeDetalles}
              startIcon={<EditIcon />}
              disabled={loading}
            >
              Editar
            </Button>
            <Button 
              variant="contained" 
              color="error"
              onClick={handleEliminarDesdeDetalles}
              startIcon={<DeleteIcon />}
              disabled={loading}
            >
              Eliminar
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog 
        open={openConfirmDialog} 
        onClose={() => {
          setOpenConfirmDialog(false);
          setRepuestoAEliminar(null);
          setErrorEliminacion(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            Confirmar Eliminación
          </Box>
        </DialogTitle>
        <DialogContent>
          {errorEliminacion ? (
            <Box sx={{ mt: 2 }}>
              <Typography color="error" gutterBottom>
                {errorEliminacion}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Para eliminar este repuesto, primero debe:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="1. Eliminar o cancelar los movimientos asociados"
                    secondary="Puede ver los movimientos en el historial del repuesto"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="2. Eliminar las referencias en servicios activos"
                    secondary="Verifique que el repuesto no esté siendo usado en servicios"
                  />
                </ListItem>
              </List>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>
                ¿Está seguro que desea eliminar el repuesto {repuestoAEliminar?.codigo} - {repuestoAEliminar?.nombre}?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Esta acción no se puede deshacer.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setOpenConfirmDialog(false);
              setRepuestoAEliminar(null);
              setErrorEliminacion(null);
            }}
          >
            Cancelar
          </Button>
          {!errorEliminacion && (
            <Button 
              onClick={handleConfirmarEliminacion} 
              color="error" 
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Eliminar'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Diálogo de Selección de Repuesto para Stock */}
      <Dialog
        open={showRepuestoSelector}
        onClose={() => {
          setShowRepuestoSelector(false);
          stopScannerInSelector();
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Seleccionar Repuesto para Gestionar Stock
            </Typography>
            <IconButton onClick={() => {
              setShowRepuestoSelector(false);
              stopScannerInSelector();
            }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Buscar por nombre, código o categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        {searchTerm && (
                          <IconButton
                            size="small"
                            onClick={() => setSearchTerm('')}
                          >
                            <CloseIcon />
                          </IconButton>
                        )}
                        <Tooltip title="Escanear código de barras">
                          <IconButton
                            size="small"
                            onClick={startScannerInSelector}
                            sx={{ ml: 1 }}
                          >
                            <ScannerIcon />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Filtrar por Categoría</InputLabel>
                  <Select
                    value={selectedCategoria}
                    onChange={(e) => setSelectedCategoria(e.target.value)}
                    label="Filtrar por Categoría"
                  >
                    <MenuItem value="">Todas las categorías</MenuItem>
                    {categorias.map((categoria) => (
                      <MenuItem key={categoria} value={categoria}>
                        {categoria}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Contenedor del escáner */}
          {isScanningInSelector && (
            <Box 
              sx={{ 
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'rgba(0, 0, 0, 0.8)',
                zIndex: 1300,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Box sx={{ 
                width: '100%', 
                maxWidth: 640,
                position: 'relative',
                bgcolor: 'black',
                borderRadius: 2,
                overflow: 'hidden'
              }}>
                <video 
                  ref={selectorVideoRef}
                  style={{ width: '100%', height: 'auto' }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '80%',
                    height: '2px',
                    bgcolor: 'primary.main',
                    animation: 'scan 2s linear infinite',
                    '@keyframes scan': {
                      '0%': { top: '20%' },
                      '50%': { top: '80%' },
                      '100%': { top: '20%' }
                    }
                  }}
                />
                <canvas 
                  ref={selectorCanvasRef}
                  style={{ display: 'none' }}
                />
                <IconButton
                  onClick={stopScannerInSelector}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.9)'
                    }
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'white', 
                  mt: 2,
                  textAlign: 'center'
                }}
              >
                Enfoca el código de barras en el área de la cámara
              </Typography>
            </Box>
          )}

          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell 
                    onClick={() => handleSort('codigo')}
                    sx={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Código
                    {sortConfig.key === 'codigo' && (
                      <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </TableCell>
                  <TableCell 
                    onClick={() => handleSort('nombre')}
                    sx={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Nombre
                    {sortConfig.key === 'nombre' && (
                      <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </TableCell>
                  <TableCell 
                    onClick={() => handleSort('categoria')}
                    sx={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Categoría
                    {sortConfig.key === 'categoria' && (
                      <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </TableCell>
                  <TableCell 
                    onClick={() => handleSort('stock')}
                    sx={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Stock Actual
                    {sortConfig.key === 'stock' && (
                      <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </TableCell>
                  <TableCell>Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getPaginatedRepuestos().map((repuesto) => (
                  <TableRow 
                    key={repuesto.id}
                    hover
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: 'action.hover',
                        cursor: 'pointer'
                      }
                    }}
                    onClick={() => handleSelectRepuestoForStock(repuesto)}
                  >
                    <TableCell>{repuesto.codigo}</TableCell>
                    <TableCell>{repuesto.nombre}</TableCell>
                    <TableCell>
                      <Chip 
                        label={repuesto.categoria} 
                        size="small"
                        sx={{ 
                          bgcolor: '#e3f2fd', 
                          color: '#1976d2',
                          '&:hover': {
                            bgcolor: '#bbdefb'
                          }
                        }}
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
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRepuestoForStock(repuesto);
                        }}
                      >
                        Seleccionar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={getFilteredAndSortedRepuestos().length}
            page={virtualPage}
            onPageChange={handleVirtualPageChange}
            rowsPerPage={virtualRowsPerPage}
            rowsPerPageOptions={[virtualRowsPerPage]}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo de Gestión de Stock */}
      <Dialog 
        open={openStockDialog} 
        onClose={handleCloseStockDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Gestión de Stock - {selectedRepuesto?.nombre}
            </Typography>
            <IconButton onClick={handleCloseStockDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Sección de Movimiento */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Registrar Movimiento
                </Typography>
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
                    <Grid item xs={12}>
                      <Button 
                        type="submit" 
                        variant="contained" 
                        fullWidth
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Registrar Movimiento'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>

            {/* Sección de Historial */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Historial de Movimientos
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Cantidad</TableCell>
                        <TableCell>Notas</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {historialMovimientos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            No hay movimientos registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        historialMovimientos.map((movimiento) => (
                          <TableRow key={movimiento.id}>
                            <TableCell>
                              {new Date(movimiento.fecha).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={movimiento.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                                color={movimiento.tipo === 'entrada' ? 'success' : 'error'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{movimiento.cantidad}</TableCell>
                            <TableCell>{movimiento.notas}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
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
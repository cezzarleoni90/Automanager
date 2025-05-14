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
  CircularProgress,
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

  const repuestosFiltrados = Array.isArray(repuestos) ? repuestos.filter((repuesto) =>
    `${repuesto.codigo} ${repuesto.nombre} ${repuesto.marca} ${repuesto.modelo}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  ) : [];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h4" gutterBottom>
          Gestión de Inventario
        </Typography>
        <Typography variant="body1">
          Módulo en desarrollo. Próximamente disponible.
        </Typography>
      </Paper>
    </Container>
  );
}

export default Inventario; 
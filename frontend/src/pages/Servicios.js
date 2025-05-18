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
  CircularProgress,
  Tabs,
  Tab,
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
  Close as CloseIcon,
  Info as InfoIcon,
  History as HistoryIcon,
  Update as UpdateIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  getServicios, 
  getServicio, 
  createServicio, 
  updateServicio, 
  deleteServicio,
  asignarMecanico,
  agregarRepuesto,
  eliminarRepuesto,
  actualizarCantidadRepuesto,
  obtenerRepuestos,
  cambiarEstado,
  obtenerHistorial,
  obtenerEstados,
  getVehiculos,
  getMecanicos,
  getRepuestos,
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
  const servicioVacio = {
    tipo_servicio: 'diagnostico',
    descripcion: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: null,
    estado: 'pendiente',
    vehiculo_id: '',
    mecanico_id: '',
    titulo: '',
    costo: 0,
    notas: ''
  };
  const [servicioActual, setServicioActual] = useState(servicioVacio);
  const [busqueda, setBusqueda] = useState('');
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
  const [mecanicoSeleccionado, setMecanicoSeleccionado] = useState('');
  const [repuestoSeleccionado, setRepuestoSeleccionado] = useState('');
  const [cantidadRepuesto, setCantidadRepuesto] = useState(1);
  const [estados, setEstados] = useState({});
  const [historial, setHistorial] = useState([]);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('');
  const [comentarioEstado, setComentarioEstado] = useState('');
  const [filtroHistorial, setFiltroHistorial] = useState('todos');
  const [repuestoAEditar, setRepuestoAEditar] = useState(null);
  const [nuevaCantidad, setNuevaCantidad] = useState(1);
  const [dialogRepuestoAbierto, setDialogRepuestoAbierto] = useState(false);
  const [dialogoDetalleAbierto, setDialogoDetalleAbierto] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [pestanaActiva, setPestanaActiva] = useState('detalles'); // 'detalles', 'repuestos', 'historial', 'estado'
  // Agregar nuevo estado para la modal de vehículo
  const [dialogoVehiculoAbierto, setDialogoVehiculoAbierto] = useState(false);
  const [vehiculoDetalle, setVehiculoDetalle] = useState(null);

  const tiposServicio = [
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'reparacion', label: 'Reparación' },
    { value: 'diagnostico', label: 'Diagnóstico' },
    { value: 'revision', label: 'Revisión' }
  ];

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
      console.log('Detectado servicioId en URL:', servicioId);
      handleOpenDialog({id: parseInt(servicioId)});
    } else if (vehiculoId) {
      console.log('🚗 Vehículo seleccionado desde vista de vehículos:', vehiculoId, vehiculoInfo);
      
      // Encontrar el vehículo completo para tener más información
      const vehiculoCompleto = vehiculos.find(v => String(v.id) === String(vehiculoId));
      
      const vehiculoSeleccionadoInfo = {
        id: String(vehiculoId),
        info: vehiculoInfo || (vehiculoCompleto ? `${vehiculoCompleto.marca} ${vehiculoCompleto.modelo} (${vehiculoCompleto.placa})` : '')
      };
      
      setVehiculoSeleccionado(vehiculoSeleccionadoInfo);
      
      // Actualizar el servicio actual con el vehículo seleccionado
      const servicioInicial = {
        ...servicioVacio,
        vehiculo_id: String(vehiculoId),
        fecha_inicio: new Date().toISOString().split('T')[0],
        estado: 'pendiente'
      };
      
      console.log('Nuevo servicio inicial con vehículo seleccionado:', servicioInicial);
      setServicioActual(servicioInicial);
      setOpenDialog(true);
    }
  }, [location.search, location.state]);

  useEffect(() => {
    const cargarEstados = async () => {
      try {
        console.log('🔄 Iniciando carga de estados de servicio...');
        const data = await obtenerEstados();
        console.log('📦 Estados recibidos:', data);
        
        // Asegurar que los estados se carguen correctamente
        if (!data || Object.keys(data).length === 0) {
          // Si no se obtienen estados del backend, usar un fallback básico
          setEstados({
            'pendiente': { nombre: 'Pendiente', descripcion: 'Servicio creado y pendiente de iniciar' },
            'diagnostico': { nombre: 'En Diagnóstico', descripcion: 'Evaluando el vehículo' },
            'aprobado': { nombre: 'Aprobado', descripcion: 'Servicio aprobado para iniciar' },
            'en_progreso': { nombre: 'En Progreso', descripcion: 'Trabajo en proceso' },
            'pausado': { nombre: 'Pausado', descripcion: 'Trabajo temporalmente suspendido' },
            'completado': { nombre: 'Completado', descripcion: 'Servicio finalizado' },
            'cancelado': { nombre: 'Cancelado', descripcion: 'Servicio cancelado' }
          });
          console.log('⚠️ Usando estados predeterminados debido a que el backend no devolvió datos');
        } else {
        setEstados(data);
          console.log('✅ Estados actualizados en estado desde API');
        }
      } catch (error) {
        console.error('❌ Error al cargar estados:', error);
        // Configurar estados predeterminados en caso de error
        setEstados({
          'pendiente': { nombre: 'Pendiente', descripcion: 'Servicio creado y pendiente de iniciar' },
          'diagnostico': { nombre: 'En Diagnóstico', descripcion: 'Evaluando el vehículo' },
          'aprobado': { nombre: 'Aprobado', descripcion: 'Servicio aprobado para iniciar' },
          'en_progreso': { nombre: 'En Progreso', descripcion: 'Trabajo en proceso' },
          'pausado': { nombre: 'Pausado', descripcion: 'Trabajo temporalmente suspendido' },
          'completado': { nombre: 'Completado', descripcion: 'Servicio finalizado' },
          'cancelado': { nombre: 'Cancelado', descripcion: 'Servicio cancelado' }
        });
        console.log('⚠️ Usando estados predeterminados debido a un error');
      }
    };
    cargarEstados();
  }, []);

  const cargarServicios = async () => {
    try {
      console.log('🔄 Iniciando carga de servicios...');
      const data = await getServicios();
      console.log('📦 Servicios recibidos:', data);
      
      // Asegurar que tengamos todos los datos completos con vehiculo_id y mecanico_id
      const serviciosCompletos = (data.servicios || []).map(servicio => {
        // Asegurar que vehiculo_id y mecanico_id estén como strings no undefined o null
        return {
          ...servicio,
          vehiculo_id: servicio.vehiculo_id || 
                      (servicio.vehiculo ? servicio.vehiculo.id : '') || '',
          mecanico_id: servicio.mecanico_id || 
                      (servicio.mecanico ? servicio.mecanico.id : '') || ''
        };
      });
      
      // Si estamos editando un servicio, asegurarnos de actualizar los datos en pantalla
      if (servicioActual && servicioActual.id) {
        const servicioActualizado = serviciosCompletos.find(s => s.id === servicioActual.id);
        if (servicioActualizado) {
          // Actualizar el estado del servicio actual con los datos más recientes
          setServicioActual(prev => ({
            ...prev,
            ...servicioActualizado,
            // Mantener los IDs como strings para consistencia con los componentes Select
            vehiculo_id: String(servicioActualizado.vehiculo_id || ''),
            mecanico_id: servicioActualizado.mecanico_id ? String(servicioActualizado.mecanico_id) : ''
          }));
        }
      }
      
      setServicios(serviciosCompletos);
      console.log('✅ Servicios actualizados en estado con datos completos:', serviciosCompletos);
    } catch (error) {
      console.error('❌ Error al cargar servicios:', error);
      setError(error.response?.data?.error || 'Error al cargar los servicios');
    } finally {
      setLoading(false);
    }
  };

  const cargarVehiculos = async () => {
    try {
      console.log('🔄 Iniciando carga de vehículos...');
      const data = await getVehiculos();
      console.log('📦 Vehículos recibidos:', data);
      setVehiculos(data.vehiculos || []);
      console.log('✅ Vehículos actualizados en estado');
    } catch (error) {
      console.error('❌ Error al cargar vehículos:', error);
      setError(error.response?.data?.error || 'Error al cargar los vehículos');
    }
  };

  const cargarMecanicos = async () => {
    try {
      console.log('🔄 Iniciando carga de mecánicos...');
      const data = await getMecanicos();
      console.log('📦 Mecánicos recibidos:', data);
      setMecanicos(data.mecanicos || []);
      console.log('✅ Mecánicos actualizados en estado');
    } catch (error) {
      console.error('❌ Error al cargar mecánicos:', error);
      setError(error.response?.data?.error || 'Error al cargar los mecánicos');
    }
  };

  const cargarRepuestos = async () => {
    try {
      console.log('🔄 Iniciando carga de repuestos...');
      const data = await getRepuestos();
      console.log('📦 Repuestos recibidos:', data);
      setRepuestos(data.repuestos || []);
      console.log('✅ Repuestos actualizados en estado');
    } catch (error) {
      console.error('❌ Error al cargar repuestos:', error);
      setError(error.response?.data?.error || 'Error al cargar los repuestos');
    }
  };

  const handleOpenDialog = async (servicio = null) => {
    try {
      if (servicio) {
        console.log('🔄 Cargando detalles completos del servicio:', servicio.id);
        
        // Si ya tenemos el servicio pero solo tenemos el ID, cargarlo completo
        let servicioDetallado;
        
        if (typeof servicio.tipo_servicio === 'undefined') {
          console.log('Cargando datos completos del servicio desde API');
          servicioDetallado = await getServicio(servicio.id);
        } else {
          console.log('Usando datos de servicio proporcionados');
          servicioDetallado = servicio;
        }
        
        console.log('📦 Detalles del servicio recibidos:', servicioDetallado);
        
        // Formatear las fechas antes de establecer en el estado
        const servicioFormateado = {
          ...servicioVacio,
          ...servicioDetallado,
          fecha_inicio: servicioDetallado.fecha_inicio ? 
            new Date(servicioDetallado.fecha_inicio).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0],
          fecha_fin: servicioDetallado.fecha_fin ? 
            new Date(servicioDetallado.fecha_fin).toISOString().split('T')[0] : '',
          vehiculo_id: String(servicioDetallado.vehiculo_id || 
                      (servicioDetallado.vehiculo ? servicioDetallado.vehiculo.id : '') || ''),
          mecanico_id: servicioDetallado.mecanico_id ? String(servicioDetallado.mecanico_id) : ''
        };
        
        console.log('✅ Servicio formateado para edición:', servicioFormateado);
        
        setServicioActual(servicioFormateado);
        setServicioSeleccionado(servicioFormateado);
        setDialogoDetalleAbierto(true);
        setPestanaActiva('detalles');
        
        setTimeout(() => {
          cargarRepuestosServicio(servicioDetallado.id);
          cargarHistorial(servicioDetallado.id);
        }, 500);
      } else {
        // Si no hay servicio, inicializar con valores por defecto
        const servicioInicial = {
          ...servicioVacio,
          vehiculo_id: vehiculoSeleccionado ? String(vehiculoSeleccionado.id) : '',
          fecha_inicio: new Date().toISOString().split('T')[0],
          estado: 'pendiente'
        };
        console.log('Nuevo servicio inicial:', servicioInicial);
        setServicioActual(servicioInicial);
        setOpenDialog(true);
      }
    } catch (error) {
      console.error('❌ Error al cargar detalles del servicio:', error);
      setError('Error al cargar los detalles del servicio. Inténtelo de nuevo.');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    
    // Limpiar la URL al cerrar el diálogo si incluye el parámetro servicio
    if (window.location.search.includes('servicio=')) {
      window.history.replaceState({}, document.title, '/servicios');
    }
    
    // Reset del formulario con un pequeño delay
    setTimeout(() => {
      setServicioActual(servicioVacio);
      setVehiculoSeleccionado(null);
      // Recargar los servicios para asegurar datos actualizados
      cargarServicios();
    }, 200);
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
      // Validar campos requeridos
      if (!servicioActual.descripcion) {
        setError('La descripción del servicio es requerida');
        setLoading(false);
        return;
      }

      // Validar que tengamos un vehículo
      const vehiculoId = vehiculoSeleccionado ? vehiculoSeleccionado.id : servicioActual.vehiculo_id;
      if (!vehiculoId) {
        setError('Debe seleccionar un vehículo');
        setLoading(false);
        return;
      }

      // Obtener el token JWT
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No se encontró el token de autenticación. Por favor, inicie sesión nuevamente.');
        setLoading(false);
        return;
      }

      // Preparar los datos para enviar al backend
      const datosServicio = {
        tipo_servicio: servicioActual.tipo_servicio,
        descripcion: servicioActual.descripcion,
        titulo: servicioActual.descripcion.substring(0, 100),
        vehiculo_id: Number(vehiculoId),
        mecanico_id: servicioActual.mecanico_id ? Number(servicioActual.mecanico_id) : null,
        fecha_inicio: servicioActual.fecha_inicio || new Date().toISOString().split('T')[0],
        fecha_fin: servicioActual.fecha_fin || undefined,
        estado: servicioActual.estado || 'pendiente',
        costo: servicioActual.costo || 0,
        notas: servicioActual.notas || '',
        prioridad: 'normal',
        fecha_creacion: new Date().toISOString().split('T')[0]
      };

      // Asegurarnos de que fecha_fin sea undefined si está vacía o es null
      if (!datosServicio.fecha_fin || datosServicio.fecha_fin === '') {
        delete datosServicio.fecha_fin;
      }

      console.log('Enviando datos del servicio:', datosServicio);

      // Asegurarnos de que la URL termine con /
      const url = servicioActual.id
        ? `http://localhost:5000/api/servicios/${servicioActual.id}/`
        : 'http://localhost:5000/api/servicios/';
      
      const method = servicioActual.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(datosServicio),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error del servidor:', errorData);
        throw new Error(errorData.error || 'Error al guardar el servicio');
      }

      const responseData = await response.json();
      console.log('Respuesta del servidor:', responseData);

      setSuccess(`Servicio ${servicioActual.id ? 'actualizado' : 'creado'} exitosamente`);
      handleCloseDialog();
      cargarServicios();
    } catch (error) {
      console.error('Error al guardar servicio:', error);
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
      console.log('🔄 Iniciando eliminación de servicio ID:', id);
      const resultado = await deleteServicio(id);
      console.log('📦 Respuesta del servidor:', resultado);
      setSuccess('Servicio eliminado exitosamente');
      cargarServicios();
      console.log('✅ Servicio eliminado correctamente');
    } catch (error) {
      console.error('❌ Error al eliminar servicio:', error);
      setError(error.response?.data?.error || 'Error al eliminar el servicio');
    }
  };

  const handleIrAVehiculo = (vehiculoId) => {
    const vehiculo = vehiculos.find(v => v.id === vehiculoId);
    if (vehiculo) {
      setVehiculoDetalle(vehiculo);
      setDialogoVehiculoAbierto(true);
    }
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

      console.log('🔄 Iniciando asignación de mecánico...', {
        servicio_id: servicioActual.id,
        mecanico_id: parseInt(mecanicoSeleccionado)
      });
      
      const resultado = await asignarMecanico(servicioActual.id, { 
        mecanico_id: parseInt(mecanicoSeleccionado) 
      });
      
      console.log('📦 Respuesta del servidor:', resultado);
      
      // Actualizar el servicio actual para reflejar el cambio
      setServicioActual(prev => ({
        ...prev,
        mecanico_id: mecanicoSeleccionado
      }));
      
      // Recargar detalles del servicio para asegurar que los datos estén actualizados
      try {
        const servicioActualizado = await getServicio(servicioActual.id);
        setServicioActual(prev => ({
          ...prev,
          ...servicioActualizado,
          mecanico_id: mecanicoSeleccionado,
          vehiculo_id: prev.vehiculo_id
        }));
      } catch (err) {
        console.error('Error al recargar servicio:', err);
      }
      
      setSuccess('Mecánico asignado exitosamente');
      setMecanicoSeleccionado('');
      await cargarServicios();
      console.log('✅ Mecánico asignado correctamente');
    } catch (error) {
      console.error('❌ Error al asignar mecánico:', error);
      setError(error.response?.data?.error || 'Error al asignar mecánico');
    }
  };

  const handleAgregarRepuesto = async () => {
    try {
      if (!servicioActual.id || !repuestoSeleccionado || !cantidadRepuesto) {
        setError('Complete todos los campos');
        return;
      }

      console.log('🔄 Iniciando agregado de repuesto...', {
        servicio_id: servicioActual.id,
        repuesto_id: repuestoSeleccionado,
        cantidad: cantidadRepuesto
      });
      
      const resultado = await agregarRepuesto(servicioActual.id, {
        repuesto_id: repuestoSeleccionado,
        cantidad: parseInt(cantidadRepuesto)
      });
      
      console.log('📦 Respuesta del servidor:', resultado);
      setSuccess('Repuesto agregado exitosamente');
      setRepuestoSeleccionado('');
      setCantidadRepuesto(1);
      cargarRepuestosServicio();
      cargarRepuestos();
      console.log('✅ Repuesto agregado correctamente');
    } catch (error) {
      console.error('❌ Error al agregar repuesto:', error);
      setError(error.response?.data?.error || 'Error al agregar repuesto');
    }
  };

  const cargarRepuestosServicio = async (servId) => {
    // Usar el ID proporcionado o el del servicio actual
    const servicioId = servId || servicioActual.id;
    
    if (!servicioId) {
      console.log('No hay ID de servicio para cargar repuestos');
      return;
    }
    
    try {
      console.log('🔄 Iniciando carga de repuestos del servicio ID:', servicioId);
      const data = await obtenerRepuestos(servicioId);
      console.log('📦 Repuestos del servicio recibidos:', data);
      // Asegurar que hay una propiedad repuestos en los datos
      if (data && Array.isArray(data.repuestos)) {
      setRepuestosServicio(data.repuestos);
      } else if (data && !Array.isArray(data.repuestos)) {
        // Si no es un array, inicializamos como array vacío
        setRepuestosServicio([]);
        console.warn('❓ La respuesta no contiene un array de repuestos:', data);
      }
      console.log('✅ Repuestos del servicio actualizados en estado');
    } catch (error) {
      console.error('❌ Error al cargar repuestos del servicio:', error);
      setRepuestosServicio([]);
    }
  };

  const handleQuitarRepuesto = async (repuestoId) => {
    if (!window.confirm('¿Está seguro de quitar este repuesto? Esta acción reintegrará el repuesto al inventario.')) {
      return;
    }
    
    try {
      console.log('🔄 Iniciando eliminación de repuesto...', {
        servicio_id: servicioActual.id,
        repuesto_id: repuestoId
      });
      
      // Usar la función API en lugar de fetch directamente
      const resultado = await eliminarRepuesto(servicioActual.id, repuestoId);
      
      console.log('📦 Respuesta del servidor:', resultado);
      
      // Mostrar mensaje de éxito
      setSuccess('Repuesto eliminado exitosamente');
      
      // Recargar datos
      await cargarRepuestosServicio(servicioActual.id);
      await cargarRepuestos(); // Actualizar también la lista de repuestos disponibles
      
      console.log('✅ Repuesto eliminado correctamente');
    } catch (error) {
      console.error('❌ Error al eliminar repuesto:', error);
      setError(error.message || 'Error al eliminar el repuesto');
    }
  };

  const handleEditarCantidadRepuesto = (repuesto) => {
    setRepuestoAEditar(repuesto);
    setNuevaCantidad(repuesto.cantidad);
    setDialogRepuestoAbierto(true);
  };

  const actualizarCantidadRepuesto = async () => {
    try {
      if (!repuestoAEditar || nuevaCantidad === repuestoAEditar.cantidad) {
        setDialogRepuestoAbierto(false);
        return;
      }
      
      console.log('🔄 Actualizando cantidad de repuesto...', {
        servicio_id: servicioActual.id,
        repuesto_id: repuestoAEditar.id,
        cantidad: nuevaCantidad
      });
      
      // Usar la función API en lugar de fetch directamente
      const resultado = await actualizarCantidadRepuesto(
        servicioActual.id, 
        repuestoAEditar.id, 
        parseInt(nuevaCantidad)
      );
      
      console.log('📦 Respuesta del servidor:', resultado);
      
      // Mostrar mensaje de éxito
      setSuccess('Cantidad actualizada exitosamente');
      
      // Recargar datos
      await cargarRepuestosServicio(servicioActual.id);
      await cargarRepuestos(); // Actualizar también la lista de repuestos disponibles
      
      console.log('✅ Cantidad actualizada correctamente');
      
      // Cerrar el diálogo
      setDialogRepuestoAbierto(false);
      setRepuestoAEditar(null);
      setNuevaCantidad(1);
    } catch (error) {
      console.error('❌ Error al actualizar cantidad:', error);
      setError(error.message || 'Error al actualizar la cantidad');
    }
  };

  const cargarHistorial = async (servId) => {
    // Usar el ID proporcionado o el del servicio actual
    const servicioId = servId || servicioActual.id;
    
    if (!servicioId) {
      console.log('No hay ID de servicio para cargar historial');
      return;
    }
    
    try {
      console.log('🔄 Iniciando carga de historial del servicio ID:', servicioId);
      const data = await obtenerHistorial(servicioId);
      console.log('📦 Historial recibido:', data);
      setHistorial(data.historial || []);
      console.log('✅ Historial actualizado en estado');
    } catch (error) {
      console.error('❌ Error al cargar historial:', error);
      // Establecer un array vacío en caso de error para evitar fallos
      setHistorial([]);
    }
  };

  const handleCambiarEstado = async () => {
    if (!estadoSeleccionado) {
      setError('Por favor seleccione un estado');
      return;
    }

    // Validar transiciones de estado no permitidas
    if (servicioActual.estado === 'cancelado' && estadoSeleccionado === 'completado') {
      setError('No se permite cambiar de "cancelado" a "completado". Un servicio cancelado no puede ser completado.');
      return;
    }

    setLoading(true);

    try {
      console.log('🔄 Iniciando cambio de estado...', {
        servicio_id: servicioActual.id,
        estado: estadoSeleccionado,
        comentario: comentarioEstado
      });
      
      const resultado = await cambiarEstado(servicioActual.id, {
        estado: estadoSeleccionado,
        comentario: comentarioEstado || `Cambio de estado a ${estadoSeleccionado}`
      });
      
      console.log('📦 Respuesta del servidor:', resultado);
      
      // Actualizar estado en el objeto local de servicio inmediatamente
      setServicioActual(prev => ({
        ...prev,
        estado: estadoSeleccionado
      }));
      
      // Actualizar la lista de servicios para reflejar el cambio
      setServicios(prevServicios => 
        prevServicios.map(s => 
          s.id === servicioActual.id 
            ? { ...s, estado: estadoSeleccionado } 
            : s
        )
      );
      
      // Mostrar mensaje de éxito
      setSuccess(`Estado cambiado exitosamente a: ${estadoSeleccionado}`);
      
      // Recargar datos completos para asegurar sincronización
      setTimeout(async () => {
        try {
          // Recargar el servicio actual con datos frescos
          const servicioActualizado = await getServicio(servicioActual.id);
          if (servicioActualizado) {
            console.log('Servicio recargado después del cambio de estado:', servicioActualizado);
            setServicioActual(prevServicio => ({
              ...prevServicio,
              ...servicioActualizado,
              estado: servicioActualizado.estado || estadoSeleccionado
            }));
          }
          
          // Recargar historial
      await cargarHistorial(servicioActual.id);
      
          // Recargar la lista completa de servicios
          await cargarServicios();
          
          // Limpiar formulario de cambio de estado
      setEstadoSeleccionado('');
      setComentarioEstado('');
    } catch (error) {
          console.error('Error al recargar datos después del cambio de estado:', error);
        } finally {
          setLoading(false);
        }
      }, 1000);
    } catch (error) {
      console.error('❌ Error al cambiar estado:', error);
      setError(error.response?.data?.error || 'Error al cambiar estado');
      setLoading(false);
    }
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      if (isNaN(date.getTime())) {
        console.error('Fecha inválida:', isoDate);
        return '';
      }
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return '';
    }
  };

  const formatEstadoLabel = (estado) => {
    // Mapear nombres de estados a nombres más amigables para el usuario
    const estadosLabels = {
      'pendiente': 'Pendiente',
      'diagnostico': 'En Diagnóstico',
      'aprobado': 'Aprobado',
      'en_progreso': 'En Progreso',
      'pausado': 'Pausado',
      'completado': 'Completado',
      'cancelado': 'Cancelado'
    };
    
    return estadosLabels[estado] || estado;
  };

  const formatDateTime = (isoDate) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'America/Bogota'
    });
  };

  // Nueva función para manejar la selección de servicio
  const handleSeleccionarServicio = (servicio) => {
    setServicioSeleccionado(servicio);
    setServicioActual(servicio);
    setDialogoDetalleAbierto(true);
    setPestanaActiva('detalles');
    
    // Cargar datos adicionales para este servicio
    cargarRepuestosServicio(servicio.id);
    cargarHistorial(servicio.id);
  };

  const handleEdit = (servicio) => {
    console.log('Editando servicio:', servicio);
    setServicioActual({
      ...servicio,
      fecha_inicio: formatDate(servicio.fecha_inicio),
      fecha_fin: formatDate(servicio.fecha_fin),
      fecha_creacion: formatDate(servicio.fecha_creacion)
    });
    setVehiculoSeleccionado(vehiculos.find(v => v.id === servicio.vehiculo_id) || null);
    setOpenDialog(true);
  };

  const handleDateChange = (field, value) => {
    console.log(`Cambiando fecha ${field}:`, value);
    
    // Si el campo es fecha_fin y está vacío, establecer como string vacío
    if (field === 'fecha_fin' && (!value || value.trim() === '')) {
      setServicioActual(prev => ({
        ...prev,
        [field]: ''
      }));
      return;
    }

    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        console.error('Fecha inválida:', value);
        return;
      }
      
      // Formatear la fecha como YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];
      
      setServicioActual(prev => ({
        ...prev,
        [field]: formattedDate
      }));
    } catch (error) {
      console.error('Error al cambiar fecha:', error);
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
                    {servicio.vehiculo_id && vehiculos.find(v => v.id === servicio.vehiculo_id) ? (
                    <Link
                      component="button"
                      variant="body2"
                      onClick={() => handleIrAVehiculo(servicio.vehiculo_id)}
                      sx={{ textDecoration: 'none' }}
                    >
                        {vehiculos.find(v => v.id === servicio.vehiculo_id)?.placa}
                    </Link>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Sin asignar
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  {servicio.mecanico_id && mecanicos.find(m => m.id === servicio.mecanico_id) ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      <Link
                        component="button"
                        variant="body2"
                        onClick={() => handleIrAMecanico(servicio.mecanico_id)}
                        sx={{ textDecoration: 'none' }}
                      >
                        {mecanicos.find(m => m.id === servicio.mecanico_id)?.nombre || ''}
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
                    label={formatEstadoLabel(servicio.estado)}
                    color={
                      servicio.estado === 'completado' ? 'success' :
                      servicio.estado === 'en_progreso' ? 'warning' :
                      servicio.estado === 'diagnostico' ? 'info' :
                      servicio.estado === 'pausado' ? 'secondary' :
                      servicio.estado === 'cancelado' ? 'error' : 
                      'primary'
                    }
                    size="small"
                    sx={{ 
                      fontWeight: 'medium',
                      '&.MuiChip-colorSuccess': {
                        bgcolor: '#4CAF50',
                        color: 'white'
                      },
                      '&.MuiChip-colorWarning': {
                        bgcolor: '#FF9800',
                        color: 'white'
                      },
                      '&.MuiChip-colorInfo': {
                        bgcolor: '#2196F3',
                        color: 'white'
                      },
                      '&.MuiChip-colorSecondary': {
                        bgcolor: '#9C27B0',
                        color: 'white'
                      },
                      '&.MuiChip-colorError': {
                        bgcolor: '#F44336',
                        color: 'white'
                      },
                      '&.MuiChip-colorPrimary': {
                        bgcolor: '#3F51B5',
                        color: 'white'
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {servicio.fecha_inicio ? new Date(servicio.fecha_inicio).toLocaleDateString() : 'No disponible'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Ver Detalles">
                      <IconButton 
                        onClick={() => handleSeleccionarServicio(servicio)}
                        color="primary"
                      >
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

      {/* Resumen de Servicios Activos */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Resumen de Servicios Activos
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                bgcolor: '#3F51B5',
                color: 'white',
                borderRadius: 2
              }}
            >
              <Typography variant="h4" fontWeight="bold">
                {servicios.filter(s => s.estado === 'pendiente').length}
              </Typography>
              <Typography variant="subtitle1">Pendientes</Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                bgcolor: '#2196F3',
                color: 'white',
                borderRadius: 2
              }}
            >
              <Typography variant="h4" fontWeight="bold">
                {servicios.filter(s => s.estado === 'diagnostico').length}
              </Typography>
              <Typography variant="subtitle1">En Diagnóstico</Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                bgcolor: '#FF9800',
                color: 'white',
                borderRadius: 2
              }}
            >
              <Typography variant="h4" fontWeight="bold">
                {servicios.filter(s => s.estado === 'en_progreso').length}
              </Typography>
              <Typography variant="subtitle1">En Progreso</Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                bgcolor: '#4CAF50',
                color: 'white',
                borderRadius: 2
              }}
            >
              <Typography variant="h4" fontWeight="bold">
                {servicios.filter(s => s.estado === 'completado').length}
              </Typography>
              <Typography variant="subtitle1">Completados</Typography>
            </Paper>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Servicios por Mecánico
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Mecánico</TableCell>
                  <TableCell align="center">Servicios Asignados</TableCell>
                  <TableCell align="center">En Progreso</TableCell>
                  <TableCell align="center">Pendientes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mecanicos
                  .filter(m => m.estado === 'activo')
                  .map(mecanico => {
                    const serviciosAsignados = servicios.filter(s => s.mecanico_id === mecanico.id);
                    const enProgreso = serviciosAsignados.filter(s => s.estado === 'en_progreso' || s.estado === 'diagnostico');
                    const pendientes = serviciosAsignados.filter(s => s.estado === 'pendiente');
                    
                    return (
                      <TableRow key={mecanico.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="small" color="action" />
                            <Typography variant="body2">{mecanico.nombre} {mecanico.apellido}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">{serviciosAsignados.length}</TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={enProgreso.length} 
                            color={enProgreso.length > 0 ? "warning" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={pendientes.length} 
                            color={pendientes.length > 0 ? "primary" : "default"}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                {mecanicos.filter(m => m.estado === 'activo').length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No hay mecánicos activos</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>

      {/* Modal de detalle de servicio seleccionado */}
      <Dialog 
        open={dialogoDetalleAbierto} 
        onClose={() => setDialogoDetalleAbierto(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ 
          sx: { 
            minHeight: '80vh',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          } 
        }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', px: 2, py: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Servicio #{servicioSeleccionado?.id}: {servicioSeleccionado?.tipo_servicio} - {servicioSeleccionado && formatEstadoLabel(servicioSeleccionado.estado)}
            </Typography>
            <IconButton 
              color="inherit" 
              onClick={() => setDialogoDetalleAbierto(false)}
              aria-label="cerrar diálogo"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        {/* Pestañas de navegación */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={pestanaActiva}
            onChange={(e, newValue) => setPestanaActiva(newValue)}
            aria-label="pestañas de servicio"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2 }}
          >
            <Tab 
              label="Detalles" 
              value="detalles" 
              icon={<InfoIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Repuestos" 
              value="repuestos" 
              icon={<BuildIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Historial" 
              value="historial" 
              icon={<HistoryIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Cambiar Estado" 
              value="estado" 
              icon={<UpdateIcon />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'auto' }}>
          {/* Contenido de la pestaña: Detalles */}
          {pestanaActiva === 'detalles' && servicioSeleccionado && (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Información General
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">Tipo:</Typography>
                        </Grid>
                        <Grid item xs={8}>
                          <Typography variant="body2">{servicioSeleccionado.tipo_servicio}</Typography>
                        </Grid>
                        
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">Estado:</Typography>
                        </Grid>
                        <Grid item xs={8}>
                          <Chip
                            label={formatEstadoLabel(servicioSeleccionado.estado)}
                            color={
                              servicioSeleccionado.estado === 'completado' ? 'success' :
                              servicioSeleccionado.estado === 'en_progreso' ? 'warning' :
                              servicioSeleccionado.estado === 'diagnostico' ? 'info' :
                              servicioSeleccionado.estado === 'cancelado' ? 'error' : 
                              'primary'
                            }
                            size="small"
                            sx={{ 
                              fontWeight: 'medium',
                              '&.MuiChip-colorSuccess': {
                                bgcolor: '#4CAF50',
                                color: 'white'
                              },
                              '&.MuiChip-colorWarning': {
                                bgcolor: '#FF9800',
                                color: 'white'
                              },
                              '&.MuiChip-colorInfo': {
                                bgcolor: '#2196F3',
                                color: 'white'
                              },
                              '&.MuiChip-colorSecondary': {
                                bgcolor: '#9C27B0',
                                color: 'white'
                              },
                              '&.MuiChip-colorError': {
                                bgcolor: '#F44336',
                                color: 'white'
                              },
                              '&.MuiChip-colorPrimary': {
                                bgcolor: '#3F51B5',
                                color: 'white'
                              }
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">Fecha de inicio:</Typography>
                        </Grid>
                        <Grid item xs={8}>
                          <Typography variant="body2">
                            {servicioSeleccionado.fecha_inicio ? new Date(servicioSeleccionado.fecha_inicio).toLocaleDateString() : 'No disponible'}
                          </Typography>
                        </Grid>
                        
                        {servicioSeleccionado.fecha_fin && (
                          <>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="text.secondary">Fecha de fin:</Typography>
                            </Grid>
                            <Grid item xs={8}>
                              <Typography variant="body2">
                                {new Date(servicioSeleccionado.fecha_fin).toLocaleDateString()}
                              </Typography>
                            </Grid>
                          </>
                        )}
                      </Grid>
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Vehículo y Cliente
                    </Typography>
                    {servicioSeleccionado.vehiculo ? (
                      <Box sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">Vehículo:</Typography>
                          </Grid>
                          <Grid item xs={8}>
                            <Typography variant="body2">
                              {servicioSeleccionado.vehiculo.marca} {servicioSeleccionado.vehiculo.modelo}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">Placa:</Typography>
                          </Grid>
                          <Grid item xs={8}>
                            <Typography variant="body2">{servicioSeleccionado.vehiculo.placa}</Typography>
                          </Grid>
                          
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">Año:</Typography>
                          </Grid>
                          <Grid item xs={8}>
                            <Typography variant="body2">{servicioSeleccionado.vehiculo.año || 'No disponible'}</Typography>
                          </Grid>
                          
                          {servicioSeleccionado.cliente && (
                            <>
                              <Grid item xs={4}>
                                <Typography variant="body2" color="text.secondary">Cliente:</Typography>
                              </Grid>
                              <Grid item xs={8}>
                                <Typography variant="body2">
                                  {servicioSeleccionado.cliente.nombre} {servicioSeleccionado.cliente.apellido}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={4}>
                                <Typography variant="body2" color="text.secondary">Teléfono:</Typography>
                              </Grid>
                              <Grid item xs={8}>
                                <Typography variant="body2">{servicioSeleccionado.cliente.telefono || 'No disponible'}</Typography>
                              </Grid>
                            </>
                          )}
                        </Grid>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No hay información del vehículo disponible
                      </Typography>
                    )}
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Descripción del Servicio
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {servicioSeleccionado.descripcion || 'No hay descripción disponible'}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Mecánico Asignado
                    </Typography>
                    {servicioSeleccionado.mecanico_id && mecanicos.find(m => m.id === Number(servicioSeleccionado.mecanico_id)) ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                        <PersonIcon color="primary" />
                        <Box sx={{ ml: 2 }}>
                          <Typography>
                            {mecanicos.find(m => m.id === Number(servicioSeleccionado.mecanico_id))?.nombre} {' '}
                            {mecanicos.find(m => m.id === Number(servicioSeleccionado.mecanico_id))?.apellido}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {mecanicos.find(m => m.id === Number(servicioSeleccionado.mecanico_id))?.especialidad}
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        No hay mecánico asignado a este servicio
                      </Typography>
                    )}
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Datos Adicionales
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Grid container spacing={2}>
                        {servicioSeleccionado.kilometraje_entrada && (
                          <>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">Kilometraje:</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">{servicioSeleccionado.kilometraje_entrada} km</Typography>
                            </Grid>
                          </>
                        )}
                        
                        {servicioSeleccionado.costo_estimado > 0 && (
                          <>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">Costo estimado:</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">${servicioSeleccionado.costo_estimado.toFixed(2)}</Typography>
                            </Grid>
                          </>
                        )}
                        
                        {servicioSeleccionado.costo_real > 0 && (
                          <>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">Costo real:</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">${servicioSeleccionado.costo_real.toFixed(2)}</Typography>
                            </Grid>
                          </>
                        )}
                      </Grid>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Contenido de la pestaña: Repuestos */}
          {pestanaActiva === 'repuestos' && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Gestionar Repuestos para Servicio #{servicioSeleccionado?.id}
              </Typography>
              <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Grid item xs={12} sm={5}>
                  <FormControl fullWidth>
                    <InputLabel>Repuesto</InputLabel>
                    <Select
                      value={repuestoSeleccionado || ''}
                      onChange={(e) => setRepuestoSeleccionado(e.target.value)}
                      label="Repuesto"
                    >
                      <MenuItem value="">Seleccione un repuesto</MenuItem>
                      {repuestos
                        .filter(r => (r.stock_actual !== undefined ? r.stock_actual > 0 : r.stock > 0))
                        .map((repuesto) => (
                          <MenuItem key={repuesto.id} value={repuesto.id}>
                            {repuesto.nombre} - Stock: {repuesto.stock_actual !== undefined ? repuesto.stock_actual : repuesto.stock} - Precio: ${repuesto.precio_venta}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Cantidad"
                    value={cantidadRepuesto}
                    onChange={(e) => {
                      const valor = parseInt(e.target.value);
                      if (valor > 0) {
                        // Verificar si la cantidad no excede el stock disponible
                        const repuesto = repuestos.find(r => r.id === repuestoSeleccionado);
                        if (repuesto) {
                          const stockDisponible = repuesto.stock_actual !== undefined ? repuesto.stock_actual : repuesto.stock;
                          if (valor <= stockDisponible) {
                            setCantidadRepuesto(valor);
                          } else {
                            setCantidadRepuesto(stockDisponible);
                            setError(`Solo hay ${stockDisponible} unidades disponibles`);
                            setTimeout(() => setError(''), 3000);
                          }
                        }
                      } else {
                        setCantidadRepuesto(1);
                      }
                    }}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAgregarRepuesto}
                    fullWidth
                    disabled={!repuestoSeleccionado || cantidadRepuesto <= 0}
                    startIcon={<AddIcon />}
                  >
                    Agregar Repuesto
                  </Button>
                </Grid>
              </Grid>

              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Repuesto</TableCell>
                      <TableCell align="center">Cantidad</TableCell>
                      <TableCell align="right">Precio Unitario</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {repuestosServicio.length > 0 ? (
                      repuestosServicio.map((repuesto) => (
                        <TableRow key={repuesto.id}>
                          <TableCell>{repuesto.nombre}</TableCell>
                          <TableCell align="center">{repuesto.cantidad}</TableCell>
                          <TableCell align="right">${repuesto.precio_unitario.toFixed(2)}</TableCell>
                          <TableCell align="right">${repuesto.subtotal.toFixed(2)}</TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                              <Tooltip title="Editar cantidad">
                                <IconButton 
                                  size="small" 
                                  color="primary"
                                  onClick={() => handleEditarCantidadRepuesto(repuesto)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Quitar repuesto">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleQuitarRepuesto(repuesto.id)}
                                >
                                  <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                            No hay repuestos agregados a este servicio
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {repuestosServicio.length > 0 && (
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell colSpan={2}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            Total ({repuestosServicio.reduce((sum, item) => sum + item.cantidad, 0)} unidades):
                          </Typography>
                        </TableCell>
                        <TableCell align="right" colSpan={2}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            ${repuestosServicio.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    )}
          </TableBody>
        </Table>
      </TableContainer>
            </Box>
          )}

          {/* Contenido de la pestaña: Historial */}
          {pestanaActiva === 'historial' && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Historial de Estados
                </Typography>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Filtrar por</InputLabel>
                  <Select
                    value={filtroHistorial}
                    onChange={(e) => setFiltroHistorial(e.target.value)}
                    label="Filtrar por"
                  >
                    <MenuItem value="todos">Todos los estados</MenuItem>
                    <MenuItem value="completado">Completado</MenuItem>
                    <MenuItem value="cancelado">Cancelado</MenuItem>
                    <MenuItem value="en_progreso">En Progreso</MenuItem>
                    <MenuItem value="diagnostico">Diagnóstico</MenuItem>
                    <MenuItem value="pausado">Pausado</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              {historial.length > 0 ? (
                <List sx={{ bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
                  {historial
                    .filter(item => filtroHistorial === 'todos' || item.estado_nuevo === filtroHistorial)
                    .map((item) => (
                      <ListItem 
                        key={item.id}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1,
                          p: 2,
                          bgcolor: item.estado_nuevo === 'completado' ? 'rgba(76, 175, 80, 0.1)' : 
                                  item.estado_nuevo === 'cancelado' ? 'rgba(244, 67, 54, 0.1)' :
                                  item.estado_nuevo === 'en_progreso' ? 'rgba(255, 152, 0, 0.1)' :
                                  item.estado_nuevo === 'diagnostico' ? 'rgba(33, 150, 243, 0.1)' :
                                  item.estado_nuevo === 'pausado' ? 'rgba(156, 39, 176, 0.1)' :
                                  'background.paper'
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1" fontWeight="bold" component="span">
                                {formatEstadoLabel(item.estado_anterior)} 
                              </Typography>
                              <span>→</span>
                              <Chip 
                                label={formatEstadoLabel(item.estado_nuevo)}
                                color={
                                  item.estado_nuevo === 'completado' ? 'success' :
                                  item.estado_nuevo === 'cancelado' ? 'error' :
                                  item.estado_nuevo === 'en_progreso' ? 'warning' :
                                  item.estado_nuevo === 'diagnostico' ? 'info' :
                                  'default'
                                }
                                size="small"
                                sx={{ fontWeight: 'medium' }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box component="span">
                              <Typography variant="body2" color="text.primary" component="span" display="block">
                                {item.comentario}
                              </Typography>
                              <Box component="span" sx={{ display: 'flex', alignItems: 'center', mt: 1, color: 'text.secondary' }}>
                                <Typography variant="caption" component="span" display="block" sx={{ fontWeight: 'medium' }}>
                                  {item.fecha ? new Date(item.fecha).toLocaleString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                  }) : 'Fecha no disponible'}
                                </Typography>
                                {item.usuario && (
                                  <Typography variant="caption" component="span" display="block" sx={{ ml: 2 }}>
                                    <PersonIcon fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'text-bottom' }} />
                                    {item.usuario}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                </List>
              ) : (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No hay historial de cambios de estado disponible
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Contenido de la pestaña: Cambiar Estado */}
          {pestanaActiva === 'estado' && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Cambiar Estado del Servicio
              </Typography>
              <Box sx={{ mb: 2, p: 2, bgcolor: servicioActual.estado === 'completado' ? 'success.light' : 
                  servicioActual.estado === 'pausado' ? 'warning.light' : 
                  servicioActual.estado === 'cancelado' ? 'error.light' : 
                  'background.paper', 
                  borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Estado actual:
                </Typography>
                <Chip
                  label={servicioActual.estado || 'pendiente'}
                  color={
                    servicioActual.estado === 'completado' ? 'success' :
                    servicioActual.estado === 'en_progreso' || servicioActual.estado === 'diagnostico' ? 'warning' :
                    servicioActual.estado === 'cancelado' ? 'error' : 
                    'primary'
                  }
                  sx={{ fontWeight: 'bold' }}
                />
                {servicioActual.fecha_fin && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Fecha de finalización: {new Date(servicioActual.fecha_fin).toLocaleString('es-ES')}
                  </Typography>
                )}
              </Box>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={5}>
                  <FormControl fullWidth>
                    <InputLabel>Nuevo Estado</InputLabel>
                    <Select
                      value={estadoSeleccionado || ''}
                      onChange={(e) => setEstadoSeleccionado(e.target.value)}
                      label="Nuevo Estado"
                      disabled={loading}
                    >
                      <MenuItem value="">Seleccione un nuevo estado</MenuItem>
                      {Object.entries(estados || {}).map(([key, estado]) => {
                        // No mostrar el estado actual
                        if (key === servicioActual.estado) return null;
                        
                        // No mostrar "completado" si el estado actual es "cancelado"
                        if (servicioActual.estado === 'cancelado' && key === 'completado') return null;
                        
                        return (
                          <MenuItem key={key} value={key}>
                            {estado.nombre || key}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={7}>
                  <TextField
                    fullWidth
                    label="Comentario sobre el cambio"
                    value={comentarioEstado || ''}
                    onChange={(e) => setComentarioEstado(e.target.value)}
                    placeholder="Razón del cambio de estado"
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleCambiarEstado}
                    disabled={!estadoSeleccionado || loading}
                    fullWidth
                    startIcon={loading ? <CircularProgress size={20} /> : <UpdateIcon />}
                  >
                    {loading ? 'Cambiando estado...' : 'Cambiar Estado'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => setDialogoDetalleAbierto(false)} 
            color="inherit"
          >
            Cerrar
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => {
                // Preparar los datos del servicio para edición
                const servicioParaEditar = {
                  ...servicioSeleccionado,
                  vehiculo_id: servicioSeleccionado.vehiculo_id || 
                              (servicioSeleccionado.vehiculo ? servicioSeleccionado.vehiculo.id : ''),
                  mecanico_id: servicioSeleccionado.mecanico_id || 
                              (servicioSeleccionado.mecanico ? servicioSeleccionado.mecanico.id : ''),
                  fecha_inicio: formatDate(servicioSeleccionado.fecha_inicio),
                  fecha_fin: formatDate(servicioSeleccionado.fecha_fin)
                };
                
                // Cerrar el modal de detalles
                setDialogoDetalleAbierto(false);
                
                // Pequeño delay para asegurar que el modal de detalles se cierre antes de abrir el de edición
                setTimeout(() => {
                  setServicioActual(servicioParaEditar);
                  setOpenDialog(true);
                }, 100);
              }}
              startIcon={<EditIcon />}
            >
              Editar
            </Button>
            <Button 
              variant="contained" 
              color="error"
              onClick={() => {
                if (window.confirm('¿Está seguro de eliminar este servicio?')) {
                  handleDelete(servicioSeleccionado.id);
                  setDialogoDetalleAbierto(false);
                }
              }}
              startIcon={<DeleteIcon />}
            >
              Eliminar
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Diálogo para crear/editar servicio */}
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
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Servicio</InputLabel>
                  <Select
                    name="tipo_servicio"
                    value={servicioActual.tipo_servicio}
                    onChange={handleInputChange}
                    label="Tipo de Servicio"
                    required
                  >
                    <MenuItem value="mantenimiento">Mantenimiento</MenuItem>
                    <MenuItem value="reparacion">Reparación</MenuItem>
                    <MenuItem value="diagnostico">Diagnóstico</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  name="descripcion"
                  value={servicioActual.descripcion || ''}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                  required
                  error={!servicioActual.descripcion && servicioActual.descripcion !== ''}
                  helperText={!servicioActual.descripcion && servicioActual.descripcion !== '' ? 'La descripción es requerida' : ''}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fecha de Inicio"
                  type="date"
                  value={servicioActual.fecha_inicio || ''}
                  onChange={(e) => handleDateChange('fecha_inicio', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fecha de Finalización"
                  type="date"
                  value={servicioActual.fecha_fin || ''}
                  onChange={(e) => handleDateChange('fecha_fin', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    name="estado"
                    value={servicioActual.estado || 'pendiente'}
                    onChange={(e) => {
                      // Capturar el cambio y actualizar inmediatamente el estado local
                      const nuevoEstado = e.target.value;
                      setServicioActual(prev => ({
                        ...prev,
                        estado: nuevoEstado
                      }));
                      
                      // También actualizar la lista de servicios para reflejar el cambio inmediatamente
                      setServicios(prevServicios => 
                        prevServicios.map(s => 
                          s.id === servicioActual.id 
                            ? { ...s, estado: nuevoEstado } 
                            : s
                        )
                      );
                    }}
                    label="Estado"
                  >
                    <MenuItem value="pendiente">Pendiente</MenuItem>
                    <MenuItem value="diagnostico">En Diagnóstico</MenuItem>
                    <MenuItem value="aprobado">Aprobado</MenuItem>
                    <MenuItem value="en_progreso">En Progreso</MenuItem>
                    <MenuItem value="pausado">Pausado</MenuItem>
                    <MenuItem value="completado">Completado</MenuItem>
                    <MenuItem value="cancelado">Cancelado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Vehículo</InputLabel>
                  <Select
                    name="vehiculo_id"
                    value={vehiculoSeleccionado ? String(vehiculoSeleccionado.id) : (servicioActual.vehiculo_id || '')}
                    onChange={(e) => {
                      const value = e.target.value;
                      console.log('Vehículo seleccionado:', value);
                      setServicioActual(prev => ({
                        ...prev,
                        vehiculo_id: value
                      }));
                    }}
                    label="Vehículo"
                    disabled={!!vehiculoSeleccionado}
                  >
                    <MenuItem value="">Seleccionar vehículo</MenuItem>
                    {vehiculos.map((vehiculo) => (
                      <MenuItem key={vehiculo.id} value={String(vehiculo.id)}>
                        {vehiculo.marca} {vehiculo.modelo} ({vehiculo.placa})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {vehiculoSeleccionado && (
                  <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block' }}>
                    Vehículo seleccionado: {vehiculoSeleccionado.info}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Mecánico</InputLabel>
                  <Select
                    name="mecanico_id"
                    value={servicioActual.mecanico_id || ''}
                    onChange={handleInputChange}
                    label="Mecánico"
                  >
                    <MenuItem value="">Sin asignar</MenuItem>
                    {mecanicos
                      .filter(m => m.estado === 'activo')
                      .map((mecanico) => (
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
          <Button 
            onClick={handleCloseDialog} 
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={loading}
          >
            {servicioActual.id ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para editar cantidad de repuesto */}
      <Dialog
        open={dialogRepuestoAbierto}
        onClose={() => setDialogRepuestoAbierto(false)}
        maxWidth="xs"
              fullWidth
            >
        <DialogTitle>Editar Cantidad de Repuesto</DialogTitle>
        <DialogContent>
          {repuestoAEditar && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                {repuestoAEditar.nombre}
        </Typography>
            <TextField
                autoFocus
                margin="dense"
                label="Nueva cantidad"
              type="number"
                fullWidth
                value={nuevaCantidad}
                onChange={(e) => {
                  const valor = parseInt(e.target.value);
                  if (valor > 0) {
                    // Permitir aumentar o disminuir la cantidad
                    setNuevaCantidad(valor);
                  } else {
                    setNuevaCantidad(1);
                  }
                }}
              inputProps={{ min: 1 }}
            />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Cantidad actual: {repuestoAEditar.cantidad} unidades
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Precio unitario: ${repuestoAEditar.precio_unitario ? repuestoAEditar.precio_unitario.toFixed(2) : '0.00'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogRepuestoAbierto(false)}>Cancelar</Button>
            <Button
            onClick={actualizarCantidadRepuesto} 
              variant="contained"
              color="primary"
            >
            Actualizar
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

      {/* Modal de detalles del vehículo */}
      <Dialog 
        open={dialogoVehiculoAbierto} 
        onClose={() => setDialogoVehiculoAbierto(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', px: 2, py: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Detalles del Vehículo
            </Typography>
            <IconButton 
              color="inherit" 
              onClick={() => setDialogoVehiculoAbierto(false)}
              aria-label="cerrar diálogo"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ p: 3 }}>
          {vehiculoDetalle && (
            <Grid container spacing={3}>
              {/* Información del Vehículo */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    Información del Vehículo
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Marca:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{vehiculoDetalle.marca}</Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Modelo:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{vehiculoDetalle.modelo}</Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Placa:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{vehiculoDetalle.placa}</Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Año:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{vehiculoDetalle.año || 'No disponible'}</Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Color:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{vehiculoDetalle.color || 'No disponible'}</Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">VIN:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{vehiculoDetalle.vin || 'No disponible'}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Información del Cliente */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    Información del Propietario
                  </Typography>
                  {vehiculoDetalle.cliente ? (
                    <Box sx={{ mt: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">Nombre:</Typography>
                        </Grid>
                        <Grid item xs={8}>
                          <Typography variant="body2">
                            {vehiculoDetalle.cliente.nombre} {vehiculoDetalle.cliente.apellido}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">Teléfono:</Typography>
                        </Grid>
                        <Grid item xs={8}>
                          <Typography variant="body2">{vehiculoDetalle.cliente.telefono || 'No disponible'}</Typography>
                        </Grid>
                        
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">Email:</Typography>
                        </Grid>
                        <Grid item xs={8}>
                          <Typography variant="body2">{vehiculoDetalle.cliente.email || 'No disponible'}</Typography>
                        </Grid>
                        
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">Dirección:</Typography>
                        </Grid>
                        <Grid item xs={8}>
                          <Typography variant="body2">{vehiculoDetalle.cliente.direccion || 'No disponible'}</Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      No hay información del propietario disponible
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              {/* Historial de Servicios */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    Historial de Servicios
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Fecha</TableCell>
                          <TableCell>Tipo</TableCell>
                          <TableCell>Estado</TableCell>
                          <TableCell>Mecánico</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {servicios
                          .filter(s => s.vehiculo_id === vehiculoDetalle.id)
                          .sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio))
                          .map((servicio) => (
                            <TableRow key={servicio.id}>
                              <TableCell>
                                {new Date(servicio.fecha_inicio).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{servicio.tipo_servicio}</TableCell>
                              <TableCell>
                                <Chip
                                  label={formatEstadoLabel(servicio.estado)}
                                  color={
                                    servicio.estado === 'completado' ? 'success' :
                                    servicio.estado === 'en_progreso' ? 'warning' :
                                    servicio.estado === 'diagnostico' ? 'info' :
                                    servicio.estado === 'pausado' ? 'secondary' :
                                    servicio.estado === 'cancelado' ? 'error' : 
                                    'primary'
                                  }
                                  size="small"
                                  sx={{ 
                                    fontWeight: 'medium',
                                    '&.MuiChip-colorSuccess': {
                                      bgcolor: '#4CAF50',
                                      color: 'white'
                                    },
                                    '&.MuiChip-colorWarning': {
                                      bgcolor: '#FF9800',
                                      color: 'white'
                                    },
                                    '&.MuiChip-colorInfo': {
                                      bgcolor: '#2196F3',
                                      color: 'white'
                                    },
                                    '&.MuiChip-colorSecondary': {
                                      bgcolor: '#9C27B0',
                                      color: 'white'
                                    },
                                    '&.MuiChip-colorError': {
                                      bgcolor: '#F44336',
                                      color: 'white'
                                    },
                                    '&.MuiChip-colorPrimary': {
                                      bgcolor: '#3F51B5',
                                      color: 'white'
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                {servicio.mecanico_id && mecanicos.find(m => m.id === servicio.mecanico_id) ? (
                                  `${mecanicos.find(m => m.id === servicio.mecanico_id)?.nombre} ${mecanicos.find(m => m.id === servicio.mecanico_id)?.apellido}`
                                ) : (
                                  'Sin asignar'
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
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
            onClick={() => setDialogoVehiculoAbierto(false)} 
            color="inherit"
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Servicios; 
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
  Pagination,
  FormHelperText,
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
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { asignarMecanico, getServicio } from '../services/api';

function Mecanicos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mecanicos, setMecanicos] = useState([]);
  const [serviciosMecanico, setServiciosMecanico] = useState([]);
  const [horasTrabajo, setHorasTrabajo] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    total_servicios: 0,
    servicios_activos: 0,
    servicios_por_estado: {},
    ingresos_generados_mes: 0,
    tarifa_actual: 0
  });
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
  const [dialogoMecanicoAbierto, setDialogoMecanicoAbierto] = useState(false);
  const [mecanicoDetalle, setMecanicoDetalle] = useState(null);
  const [mecanicoSeleccionado, setMecanicoSeleccionado] = useState('');
  const [servicioActual, setServicioActual] = useState(null);
  const [honorariosEditando, setHonorariosEditando] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0
  });
  const [filtros, setFiltros] = useState({
    estado: '',
    search: ''
  });
  const [filtroMes, setFiltroMes] = useState('');

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
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Primero cargar servicios
        await cargarServicios();
        
        // Luego cargar mecánicos (que ahora incluirá el cálculo de servicios activos)
        await cargarMecanicos();

        // Manejar la navegación desde otras páginas
        const searchParams = new URLSearchParams(location.search);
        const mecanicoId = searchParams.get('mecanico');

        if (mecanicoId) {
          await obtenerMecanico(parseInt(mecanicoId));
        }
      } catch (error) {
        console.error('❌ Error al cargar datos:', error);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [location]);

  const cargarMecanicos = async () => {
    try {
      console.log('🔄 Iniciando carga de mecánicos...');
      const response = await fetch('http://localhost:5000/api/mecanicos/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar mecánicos');
      }

      const data = await response.json();
      const mecanicosData = data.mecanicos || [];

      console.log('📦 Mecánicos recibidos:', mecanicosData);

      // Obtener servicios activos para cada mecánico
      const mecanicosConServiciosActivos = await Promise.all(mecanicosData.map(async (mecanico) => {
        try {
          // Obtener servicios del mecánico desde el backend
          const serviciosResponse = await fetch(`http://localhost:5000/api/mecanicos/${mecanico.id}/servicios`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (!serviciosResponse.ok) {
            throw new Error(`Error al obtener servicios del mecánico ${mecanico.id}`);
          }

          const serviciosData = await serviciosResponse.json();
          const serviciosMecanico = serviciosData.servicios || [];

          // Asegurarse de que los honorarios sean números
          const serviciosFormateados = serviciosMecanico.map(servicio => ({
            ...servicio,
            honorarios: servicio.honorarios ? Number(servicio.honorarios) : 0
          }));

          // Filtrar servicios activos
          const serviciosActivos = serviciosFormateados.filter(servicio => 
            ['pendiente', 'diagnostico', 'aprobado', 'en_progreso', 'pausado'].includes(servicio.estado)
          );

          console.log(`Mecánico ${mecanico.nombre} ${mecanico.apellido} (ID: ${mecanico.id}):`, {
            totalServicios: serviciosFormateados.length,
            serviciosActivos: serviciosActivos.length,
            servicios: serviciosActivos
          });

          return {
            ...mecanico,
            servicios_activos: serviciosActivos.length,
            servicios: serviciosFormateados
          };
        } catch (error) {
          console.error(`Error al cargar servicios del mecánico ${mecanico.id}:`, error);
          return {
            ...mecanico,
            servicios_activos: 0,
            servicios: []
          };
        }
      }));

      console.log('✅ Mecánicos actualizados con servicios activos:', mecanicosConServiciosActivos);
      setMecanicos(mecanicosConServiciosActivos);
    } catch (error) {
      console.error('❌ Error al cargar mecánicos:', error);
      setError(error.message);
    }
  };

  const cargarServicios = async () => {
    try {
      console.log('🔄 Iniciando carga de servicios...');
      const response = await fetch('http://localhost:5000/api/servicios/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar servicios');
      }

      const data = await response.json();
      // Asegurarse de que los IDs de mecánicos sean números y los honorarios sean números
      const serviciosFormateados = (data.servicios || []).map(servicio => ({
        ...servicio,
        mecanico_id: servicio.mecanico_id ? Number(servicio.mecanico_id) : null,
        id: Number(servicio.id),
        honorarios: servicio.honorarios ? Number(servicio.honorarios) : 0
      }));
      
      console.log('📦 Servicios recibidos y formateados:', serviciosFormateados);
      setServicios(serviciosFormateados);

      // Si hay un mecánico detalle abierto, actualizar sus servicios
      if (mecanicoDetalle) {
        const serviciosMecanico = serviciosFormateados.filter(s => 
          s.mecanico_id === mecanicoDetalle.id
        );
        setMecanicoDetalle(prev => ({
          ...prev,
          servicios: serviciosMecanico
        }));
      }

      // Actualizar los servicios del mecánico actual si estamos en el diálogo de servicios
      if (openServiciosDialog && mecanicoActual) {
        const serviciosMecanico = serviciosFormateados.filter(s => 
          s.mecanico_id === mecanicoActual.id
        );
        setServiciosMecanico(serviciosMecanico);
      }
    } catch (error) {
      console.error('❌ Error al cargar servicios:', error);
      setError('Error al cargar los servicios');
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
      handleOpenDialog(data);
    } catch (error) {
      setError(error.message);
      console.error('Error al obtener mecánico:', error);
    }
  };

  const obtenerServiciosMecanico = async (id) => {
    try {
      console.log('🔄 Obteniendo servicios del mecánico:', id);
      const response = await fetch(`http://localhost:5000/api/mecanicos/${id}/servicios`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener servicios del mecánico');
      }

      const data = await response.json();
      console.log('📦 Servicios del mecánico recibidos:', data);
      
      // Formatear los servicios para asegurar que los honorarios sean números
      const serviciosFormateados = (data.servicios || []).map(servicio => ({
        ...servicio,
        honorarios: servicio.honorarios ? Number(servicio.honorarios) : 0
      }));
      
      // Actualizar los servicios en el estado global
      setServicios(prevServicios => {
        const serviciosActualizados = [...prevServicios];
        serviciosFormateados.forEach(servicio => {
          const index = serviciosActualizados.findIndex(s => s.id === servicio.id);
          if (index >= 0) {
            serviciosActualizados[index] = servicio;
          } else {
            serviciosActualizados.push(servicio);
          }
        });
        return serviciosActualizados;
      });
      
      setServiciosMecanico(serviciosFormateados);
      setOpenServiciosDialog(true);
      
      // Recalcular servicios activos
      await cargarMecanicos();
    } catch (error) {
      console.error('❌ Error al obtener servicios del mecánico:', error);
      setError(error.message);
    }
  };

  const calcularIngresosTotales = (servicios) => {
    return servicios.reduce((total, servicio) => {
      const honorarios = parseFloat(servicio.honorarios) || 0;
      return total + honorarios;
    }, 0);
  };

  const obtenerEstadisticasMecanico = async (id) => {
    try {
      console.log('🔄 Obteniendo estadísticas del mecánico:', id);
      
      // Obtener servicios del mecánico
      const serviciosResponse = await fetch(`http://localhost:5000/api/mecanicos/${id}/servicios`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!serviciosResponse.ok) {
        throw new Error('Error al obtener servicios del mecánico');
      }

      const serviciosData = await serviciosResponse.json();
      const serviciosMecanico = serviciosData.servicios || [];

      // Filtrar servicios activos
      const serviciosActivos = serviciosMecanico.filter(servicio => 
        ['pendiente', 'diagnostico', 'aprobado', 'en_progreso', 'pausado'].includes(servicio.estado)
      );

      // Calcular ingresos totales
      const ingresosTotales = calcularIngresosTotales(serviciosMecanico);

      // Obtener estadísticas del mecánico
      const response = await fetch(`http://localhost:5000/api/mecanicos/${id}/estadisticas`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener estadísticas del mecánico');
      }

      const data = await response.json();
      console.log('📦 Estadísticas recibidas:', data);

      // Actualizar las estadísticas con los servicios activos y honorarios
      const estadisticasActualizadas = {
        ...data,
        servicios_activos: serviciosActivos.length,
        servicios_por_estado: {
          ...data.servicios_por_estado,
          activos: serviciosActivos.length
        },
        servicios: serviciosMecanico,
        ingresos_generados_mes: ingresosTotales
      };

      console.log('✅ Estadísticas actualizadas:', estadisticasActualizadas);
      setEstadisticas(estadisticasActualizadas);
      setOpenEstadisticasDialog(true);
    } catch (error) {
      console.error('❌ Error al obtener estadísticas del mecánico:', error);
      setError(error.message);
    }
  };

  const handleOpenDialog = async (mecanico = null) => {
    if (mecanico) {
        try {
            // Obtener los datos actualizados del mecánico
            const response = await fetch(`http://localhost:5000/api/mecanicos/${mecanico.id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al obtener detalles del mecánico');
            }

            const data = await response.json();
            
            // Obtener servicios activos del mecánico
            const serviciosResponse = await fetch(`http://localhost:5000/api/mecanicos/${mecanico.id}/servicios`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!serviciosResponse.ok) {
                throw new Error('Error al obtener servicios del mecánico');
            }

            const serviciosData = await serviciosResponse.json();
            const serviciosFormateados = serviciosData.servicios.map(servicio => ({
                ...servicio,
                honorarios: servicio.honorarios ? Number(servicio.honorarios) : 0
            }));

            // Filtrar servicios activos
            const serviciosActivos = serviciosFormateados.filter(servicio => 
                ['pendiente', 'diagnostico', 'aprobado', 'en_progreso', 'pausado'].includes(servicio.estado)
            );

            // Calcular ingresos del mes actual
            const fechaActual = new Date();
            const primerDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
            const ultimoDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);

            const ingresosMes = serviciosFormateados.reduce((total, servicio) => {
                const fechaServicio = new Date(servicio.fecha_inicio);
                if (fechaServicio >= primerDiaMes && fechaServicio <= ultimoDiaMes) {
                    return total + (servicio.honorarios || 0);
                }
                return total;
            }, 0);

            // Actualizar el estado con los datos completos
            const mecanicoCompleto = {
                ...data,
                servicios: serviciosFormateados,
                servicios_activos: serviciosActivos.length,
                ingresos_generados_mes: ingresosMes
            };
            
            if (dialogoMecanicoAbierto) {
                setDialogoMecanicoAbierto(false);
                // Reducir el tiempo de espera para una transición más fluida
                setTimeout(() => {
                    setMecanicoActual({
                        ...mecanicoCompleto,
                        tarifa_hora: mecanicoCompleto.tarifa_hora || 0
                    });
                    setOpenDialog(true);
                }, 50); // Reducido de 100ms a 50ms
            } else {
                setMecanicoDetalle(mecanicoCompleto);
                setDialogoMecanicoAbierto(true);
            }
        } catch (error) {
            console.error('Error al cargar detalles del mecánico:', error);
            setError('Error al cargar los detalles del mecánico');
        }
    } else {
        setMecanicoActual({
            nombre: '',
            apellido: '',
            email: '',
            telefono: '',
            especialidad: '',
            tarifa_hora: '',
            estado: 'activo'
        });
        setOpenDialog(true);
    }
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
      // Validar campos obligatorios
      const camposRequeridos = ['nombre', 'apellido', 'email', 'especialidad', 'tarifa_hora'];
      const camposFaltantes = camposRequeridos.filter(campo => !mecanicoActual[campo]);
      
      if (camposFaltantes.length > 0) {
        throw new Error(`Los siguientes campos son obligatorios: ${camposFaltantes.join(', ')}`);
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(mecanicoActual.email)) {
        throw new Error('El formato del email no es válido');
      }

      // Convertir tarifa_hora a float
      const tarifaHora = parseFloat(mecanicoActual.tarifa_hora);
      if (isNaN(tarifaHora) || tarifaHora < 0) {
        throw new Error('La tarifa por hora debe ser un número válido mayor o igual a 0');
      }

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
        body: JSON.stringify({
          ...mecanicoActual,
          tarifa_hora: tarifaHora
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar el mecánico');
      }

      const data = await response.json();
      setSuccess(`Mecánico ${mecanicoActual.id ? 'actualizado' : 'creado'} exitosamente`);
      
      await cargarMecanicos();
      
      if (mecanicoActual.id && mecanicoDetalle?.id === mecanicoActual.id) {
        setMecanicoDetalle(data.mecanico);
      }
      
      handleCloseDialog();
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
      setLoading(true);
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
      
      if (dialogoMecanicoAbierto) {
        setDialogoMecanicoAbierto(false);
      }
      
      await cargarMecanicos();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
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

  const formatEstadoLabel = (estado) => {
    switch (estado) {
      case 'completado':
        return 'Completado';
      case 'en_progreso':
        return 'En Progreso';
      case 'diagnostico':
        return 'Diagnóstico';
      case 'pausado':
        return 'Pausado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return estado;
    }
  };

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
      
      // Recargar servicios y mecánicos para actualizar los contadores
      await cargarServicios();
      await cargarMecanicos();
      
      console.log('✅ Mecánico asignado correctamente');
    } catch (error) {
      console.error('❌ Error al asignar mecánico:', error);
      setError(error.response?.data?.error || 'Error al asignar mecánico');
    }
  };

  const formatearNumero = (numero) => {
    if (numero === undefined || numero === null) return '0,00';
    return numero.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true
    });
  };

  const parsearNumero = (valor) => {
    if (!valor) return 0;
    // Reemplazar punto por nada (para miles) y coma por punto (para decimales)
    const numeroLimpio = valor.replace(/\./g, '').replace(',', '.');
    return parseFloat(numeroLimpio) || 0;
  };

  const handleHonorariosChange = (servicioId, valor) => {
    // Solo permitir números, punto y coma
    const valorLimpio = valor.replace(/[^\d.,]/g, '');
    setHonorariosEditando(prev => ({
      ...prev,
      [servicioId]: valorLimpio
    }));
  };

  const actualizarHonorarios = async (servicioId, nuevosHonorarios) => {
    try {
        console.log('Iniciando actualización de honorarios:', { servicioId, nuevosHonorarios });
        
        const honorariosNumerico = Number(nuevosHonorarios);
        if (isNaN(honorariosNumerico)) {
            throw new Error('El valor de honorarios no es válido');
        }

        const response = await fetch(`http://localhost:5000/api/servicios/${servicioId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                honorarios: honorariosNumerico
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al actualizar honorarios');
        }

        const data = await response.json();

        // Actualizar el servicio en la lista local
        setServiciosMecanico(prevServicios => 
            prevServicios.map(s => 
                s.id === servicioId 
                    ? { ...s, honorarios: honorariosNumerico }
                    : s
            )
        );

        // Actualizar también en el estado global de servicios
        setServicios(prevServicios =>
            prevServicios.map(s =>
                s.id === servicioId
                    ? { ...s, honorarios: honorariosNumerico }
                    : s
            )
        );

        // Si estamos en el diálogo de detalles del mecánico, actualizar también ahí
        if (mecanicoDetalle) {
            // Calcular nuevos ingresos del mes
            const fechaActual = new Date();
            const primerDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
            const ultimoDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);

            const serviciosActualizados = mecanicoDetalle.servicios.map(s =>
                s.id === servicioId
                    ? { ...s, honorarios: honorariosNumerico }
                    : s
            );

            const ingresosMes = serviciosActualizados.reduce((total, servicio) => {
                const fechaServicio = new Date(servicio.fecha_inicio);
                if (fechaServicio >= primerDiaMes && fechaServicio <= ultimoDiaMes) {
                    return total + (servicio.honorarios || 0);
                }
                return total;
            }, 0);

            setMecanicoDetalle(prev => ({
                ...prev,
                servicios: serviciosActualizados,
                ingresos_generados_mes: ingresosMes
            }));
        }

        // Actualizar el estado de edición
        setHonorariosEditando(prev => {
            const nuevo = { ...prev };
            delete nuevo[servicioId];
            return nuevo;
        });

        setSuccess('Honorarios actualizados correctamente');
        return true;
    } catch (error) {
        console.error('Error al actualizar honorarios:', error);
        setError(error.message);
        throw error;
    }
  };

  const handleGuardarHonorarios = async (servicioId) => {
    const valor = honorariosEditando[servicioId];
    if (valor !== undefined) {
        try {
            // Limpiar el valor de cualquier formato
            const valorLimpio = valor.replace(/[^\d.,]/g, '').replace(',', '.');
            const nuevosHonorarios = parseFloat(valorLimpio);
            
            if (isNaN(nuevosHonorarios)) {
                throw new Error('El valor de honorarios no es válido');
            }

            console.log('Guardando honorarios:', {
                servicioId,
                valorOriginal: valor,
                valorLimpio,
                nuevosHonorarios
            });

            // Actualizar los honorarios
            await actualizarHonorarios(servicioId, nuevosHonorarios);
            
            // Recargar los servicios del mecánico actual
            if (mecanicoDetalle) {
                const serviciosResponse = await fetch(`http://localhost:5000/api/mecanicos/${mecanicoDetalle.id}/servicios`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!serviciosResponse.ok) {
                    throw new Error('Error al recargar servicios');
                }

                const serviciosData = await serviciosResponse.json();
                const serviciosFormateados = serviciosData.servicios.map(servicio => ({
                    ...servicio,
                    honorarios: servicio.honorarios ? Number(servicio.honorarios) : 0
                }));

                // Actualizar el estado del mecánico con los servicios actualizados
                setMecanicoDetalle(prev => ({
                    ...prev,
                    servicios: serviciosFormateados
                }));
            }

            // Limpiar el estado de edición
            setHonorariosEditando(prev => {
                const nuevo = { ...prev };
                delete nuevo[servicioId];
                return nuevo;
            });

            setSuccess('Honorarios actualizados correctamente');
        } catch (error) {
            console.error('Error al guardar honorarios:', error);
            setError(error.message);
        }
    }
  };

  const cargarServiciosMecanico = async (mecanicoId, page = 1, filtros = {}) => {
    try {
      console.log('🔄 Cargando servicios del mecánico:', { mecanicoId, page, filtros });
      
      const queryParams = new URLSearchParams({
        page: page,
        per_page: pagination.per_page,
        ...filtros
      });

      const response = await fetch(`http://localhost:5000/api/mecanicos/${mecanicoId}/servicios?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar servicios del mecánico');
      }

      const data = await response.json();
      console.log('📦 Servicios recibidos:', data);

      // Formatear los servicios
      const serviciosFormateados = data.servicios.map(servicio => ({
        ...servicio,
        honorarios: servicio.honorarios ? Number(servicio.honorarios) : 0
      }));

      setServiciosMecanico(serviciosFormateados);
      setPagination({
        page: data.page,
        per_page: data.per_page,
        total: data.total,
        total_pages: data.total_pages
      });
    } catch (error) {
      console.error('❌ Error al cargar servicios:', error);
      setError(error.message);
    }
  };

  const handlePageChange = (event, newPage) => {
    cargarServiciosMecanico(mecanicoActual.id, newPage + 1, filtros);
  };

  const handleFiltrosChange = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    cargarServiciosMecanico(mecanicoActual.id, 1, nuevosFiltros);
  };

  const obtenerMeses = () => {
    const meses = [];
    const fechaActual = new Date();
    for (let i = 0; i < 12; i++) {
        const fecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1);
        meses.push({
            value: fecha.toISOString().slice(0, 7), // Formato YYYY-MM
            label: fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
        });
    }
    return meses;
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
                <TableCell>Honorarios</TableCell>
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
                    <Tooltip title="Ver detalles">
                      <IconButton onClick={() => handleOpenDialog(mecanico)}>
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
                  error={!mecanicoActual.nombre && error.includes('nombre')}
                  helperText={!mecanicoActual.nombre && error.includes('nombre') ? 'El nombre es obligatorio' : ''}
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
                  error={!mecanicoActual.apellido && error.includes('apellido')}
                  helperText={!mecanicoActual.apellido && error.includes('apellido') ? 'El apellido es obligatorio' : ''}
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
                  error={!mecanicoActual.email && error.includes('email')}
                  helperText={!mecanicoActual.email && error.includes('email') ? 'El email es obligatorio' : ''}
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
                <FormControl fullWidth required error={!mecanicoActual.especialidad && error.includes('especialidad')}>
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
                  {!mecanicoActual.especialidad && error.includes('especialidad') && (
                    <FormHelperText>La especialidad es obligatoria</FormHelperText>
                  )}
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
                  error={!mecanicoActual.tarifa_hora && error.includes('tarifa_hora')}
                  helperText={!mecanicoActual.tarifa_hora && error.includes('tarifa_hora') ? 'La tarifa por hora es obligatoria' : ''}
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
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? 'Guardando...' : (mecanicoActual.id ? 'Actualizar' : 'Crear')}
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
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Buscar servicios"
                  value={filtros.search}
                  onChange={(e) => handleFiltrosChange({ ...filtros, search: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filtros.estado}
                    onChange={(e) => handleFiltrosChange({ ...filtros, estado: e.target.value })}
                    label="Estado"
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="pendiente">Pendiente</MenuItem>
                    <MenuItem value="diagnostico">Diagnóstico</MenuItem>
                    <MenuItem value="en_progreso">En Progreso</MenuItem>
                    <MenuItem value="pausado">Pausado</MenuItem>
                    <MenuItem value="completado">Completado</MenuItem>
                    <MenuItem value="cancelado">Cancelado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Mes</InputLabel>
                  <Select
                    value={filtroMes}
                    onChange={(e) => setFiltroMes(e.target.value)}
                    label="Mes"
                  >
                    <MenuItem value="">Todos los meses</MenuItem>
                    {obtenerMeses().map((mes) => (
                        <MenuItem key={mes.value} value={mes.value}>
                            {mes.label}
                        </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Vehículo</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Honorarios</TableCell>
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField
                            type="text"
                            size="small"
                            value={honorariosEditando[servicio.id] !== undefined ? 
                              honorariosEditando[servicio.id] : 
                              formatearNumero(servicio.honorarios)}
                            onChange={(e) => handleHonorariosChange(servicio.id, e.target.value)}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                              style: { textAlign: 'right' }
                            }}
                            sx={{ width: '150px' }}
                          />
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleGuardarHonorarios(servicio.id)}
                            sx={{ 
                              bgcolor: 'primary.light',
                              '&:hover': { bgcolor: 'primary.main' },
                              color: 'white'
                            }}
                          >
                            <SaveIcon fontSize="small" />
                          </IconButton>
                        </Box>
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

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={pagination.total_pages}
              page={pagination.page}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
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

      {/* Modal de detalles del mecánico */}
      <Dialog 
        open={dialogoMecanicoAbierto} 
        onClose={() => setDialogoMecanicoAbierto(false)}
        maxWidth="md"
        fullWidth
        TransitionProps={{
            timeout: 200, // Reducir el tiempo de transición
            easing: {
                enter: 'ease-out',
                exit: 'ease-in'
            }
        }}
        PaperProps={{
            sx: {
                transition: 'all 0.2s ease-in-out',
                transform: 'scale(1)',
                opacity: 1,
                '&.MuiDialog-paper': {
                    transition: 'all 0.2s ease-in-out'
                }
            }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', px: 2, py: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Detalles del Mecánico
            </Typography>
            <IconButton 
              color="inherit" 
              onClick={() => setDialogoMecanicoAbierto(false)}
              aria-label="cerrar diálogo"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ p: 3 }}>
          {mecanicoDetalle && (
            <Grid container spacing={3}>
              {/* Información del Mecánico */}
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
                        <Typography variant="body2">
                          {mecanicoDetalle.nombre} {mecanicoDetalle.apellido}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Email:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{mecanicoDetalle.email}</Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Teléfono:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{mecanicoDetalle.telefono}</Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Especialidad:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">{mecanicoDetalle.especialidad}</Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Tarifa/Hora:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography variant="body2">${mecanicoDetalle.tarifa_hora}</Typography>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Estado:</Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Chip
                          label={mecanicoDetalle.estado === 'activo' ? 'Activo' : 'Inactivo'}
                          color={mecanicoDetalle.estado === 'activo' ? 'success' : 'error'}
                          size="small"
                      />
                    </Grid>
                  </Grid>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Estadísticas */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    Estadísticas
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            p: 2, 
                            bgcolor: 'primary.light', 
                            color: 'white',
                            textAlign: 'center'
                          }}
                        >
                          <Typography variant="h4">
                            {mecanicoDetalle.servicios_activos || 0}
                          </Typography>
                          <Typography variant="body2">
                            Servicios Activos
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            p: 2, 
                            bgcolor: 'success.light', 
                            color: 'white',
                            textAlign: 'center'
                          }}
                        >
                          <Typography variant="h4">
                            ${mecanicoDetalle.ingresos_generados_mes || 0}
                          </Typography>
                          <Typography variant="body2">
                            Ingresos del Mes
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Servicios Activos */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                        Servicios
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Buscar servicios"
                                    value={filtros.search}
                                    onChange={(e) => handleFiltrosChange({ ...filtros, search: e.target.value })}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Estado</InputLabel>
                                    <Select
                                        value={filtros.estado}
                                        onChange={(e) => handleFiltrosChange({ ...filtros, estado: e.target.value })}
                                        label="Estado"
                                    >
                                        <MenuItem value="">Todos</MenuItem>
                                        <MenuItem value="pendiente">Pendiente</MenuItem>
                                        <MenuItem value="diagnostico">Diagnóstico</MenuItem>
                                        <MenuItem value="en_progreso">En Progreso</MenuItem>
                                        <MenuItem value="pausado">Pausado</MenuItem>
                                        <MenuItem value="completado">Completado</MenuItem>
                                        <MenuItem value="cancelado">Cancelado</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Mes</InputLabel>
                                    <Select
                                        value={filtroMes}
                                        onChange={(e) => setFiltroMes(e.target.value)}
                                        label="Mes"
                                    >
                                        <MenuItem value="">Todos los meses</MenuItem>
                                        {obtenerMeses().map((mes) => (
                                            <MenuItem key={mes.value} value={mes.value}>
                                                {mes.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Box>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Fecha</TableCell>
                                    <TableCell>Vehículo</TableCell>
                                    <TableCell>Tipo</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell>Honorarios</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {mecanicoDetalle?.servicios
                                    ?.filter(servicio => {
                                        const matchesSearch = filtros.search 
                                            ? servicio.tipo_servicio.toLowerCase().includes(filtros.search.toLowerCase()) ||
                                              servicio.descripcion.toLowerCase().includes(filtros.search.toLowerCase())
                                            : true;
                                        
                                        const matchesEstado = filtros.estado
                                            ? servicio.estado === filtros.estado
                                            : true;

                                        const matchesMes = filtroMes
                                            ? new Date(servicio.fecha_inicio).toISOString().slice(0, 7) === filtroMes
                                            : true;

                                        return matchesSearch && matchesEstado && matchesMes;
                                    })
                                    .map((servicio) => (
                                        <TableRow key={servicio.id}>
                                            <TableCell>
                                                {new Date(servicio.fecha_inicio).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {servicio.vehiculo ? 
                                                    `${servicio.vehiculo.marca} ${servicio.vehiculo.modelo} (${servicio.vehiculo.placa})` : 
                                                    'N/A'}
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
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <TextField
                                                        type="text"
                                                        size="small"
                                                        value={honorariosEditando[servicio.id] !== undefined ? 
                                                            honorariosEditando[servicio.id] : 
                                                            formatearNumero(servicio.honorarios)}
                                                        onChange={(e) => handleHonorariosChange(servicio.id, e.target.value)}
                                                        InputProps={{
                                                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                                            style: { textAlign: 'right' }
                                                        }}
                                                        sx={{ width: '150px' }}
                                                    />
                                                    <IconButton 
                                                        size="small" 
                                                        color="primary"
                                                        onClick={() => handleGuardarHonorarios(servicio.id)}
                                                        sx={{ 
                                                            bgcolor: 'primary.light',
                                                            '&:hover': { bgcolor: 'primary.main' },
                                                            color: 'white'
                                                        }}
                                                    >
                                                        <SaveIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Pagination
                            count={Math.ceil((mecanicoDetalle?.servicios?.length || 0) / 10)}
                            page={pagination.page}
                            onChange={handlePageChange}
                            color="primary"
                            showFirstButton
                            showLastButton
                        />
                    </Box>
                </Paper>
              </Grid>
          </Grid>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => setDialogoMecanicoAbierto(false)} 
            color="inherit"
          >
            Cerrar
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => handleOpenDialog(mecanicoDetalle)}
              startIcon={<EditIcon />}
              disabled={loading}
            >
              Editar
            </Button>
            <Button 
              variant="contained" 
              color="error"
              onClick={() => handleDelete(mecanicoDetalle.id)}
              startIcon={<DeleteIcon />}
              disabled={loading}
            >
              Eliminar
            </Button>
          </Box>
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
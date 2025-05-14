import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  MenuItem,
  Alert,
  Snackbar,
  Autocomplete,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const tiposServicio = [
  { id: 1, nombre: 'Mantenimiento', color: '#4CAF50', duracion: 60 },
  { id: 2, nombre: 'Reparación', color: '#F44336', duracion: 120 },
  { id: 3, nombre: 'Diagnóstico', color: '#2196F3', duracion: 30 },
  { id: 4, nombre: 'Limpieza', color: '#FF9800', duracion: 45 },
  { id: 5, nombre: 'Inspección', color: '#9C27B0', duracion: 45 },
];

function Calendario() {
  const { user } = useAuth();
  const calendarRef = useRef(null);
  const [eventos, setEventos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState({
    start: new Date(),
    end: new Date(),
    tipo: tiposServicio[0].id,
    cliente: '',
    vehiculo: '',
    descripcion: '',
    recordatorio: true,
    mecanico: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(true);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
  });
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragTimeoutRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      // Verificar que el servidor esté respondiendo
      const serverCheck = await fetch('http://localhost:5000/api/health', {
        method: 'GET',
        headers,
        credentials: 'include'
      }).catch(() => null);

      if (!serverCheck) {
        throw new Error('No se puede conectar con el servidor. Por favor, verifica que el servidor backend esté corriendo.');
      }

      const [eventosRes, clientesRes, mecanicosRes] = await Promise.all([
        fetch('http://localhost:5000/api/eventos', { 
          method: 'GET',
          headers,
          credentials: 'include'
        }),
        fetch('http://localhost:5000/api/clientes', { 
          method: 'GET',
          headers,
          credentials: 'include'
        }),
        fetch('http://localhost:5000/api/mecanicos', { 
          method: 'GET',
          headers,
          credentials: 'include'
        })
      ]);

      if (!eventosRes.ok) {
        const errorData = await eventosRes.json().catch(() => ({ error: 'Error al cargar eventos' }));
        throw new Error(errorData.error || 'Error al cargar eventos');
      }

      if (!clientesRes.ok) {
        const errorData = await clientesRes.json().catch(() => ({ error: 'Error al cargar clientes' }));
        throw new Error(errorData.error || 'Error al cargar clientes');
      }

      if (!mecanicosRes.ok) {
        const errorData = await mecanicosRes.json().catch(() => ({ error: 'Error al cargar mecánicos' }));
        throw new Error(errorData.error || 'Error al cargar mecánicos');
      }

      const eventos = await eventosRes.json();
      const clientes = await clientesRes.json();
      const mecanicos = await mecanicosRes.json();

      console.log('Eventos cargados:', eventos);
      console.log('Clientes cargados:', clientes);
      console.log('Mecánicos cargados:', mecanicos);

      const eventosFormateados = (eventos.eventos || [])
        .map(evento => {
          try {
            const cliente = clientes.find(c => c.id === evento.cliente);
            const mecanico = mecanicos.find(m => m.id === evento.mecanico);
            
            return {
              id: evento.id,
              title: `${evento.tipo} - ${cliente ? `${cliente.nombre} ${cliente.apellido}` : 'N/A'}${mecanico ? ` (${mecanico.nombre} ${mecanico.apellido})` : ''}`,
              start: new Date(evento.start),
              end: new Date(evento.end),
              descripcion: evento.descripcion,
              cliente: evento.cliente,
              vehiculo: evento.vehiculo,
              tipo: evento.tipo,
              recordatorio: evento.recordatorio,
              mecanico: evento.mecanico
            };
          } catch (error) {
            console.error('Error al formatear evento:', error);
            return null;
          }
        })
        .filter(evento => evento !== null);

      console.log('Eventos formateados:', eventosFormateados);
      setEventos(eventosFormateados);
      setClientes(clientes);
      setMecanicos(mecanicos);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      if (error.message.includes('e3q8')) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setSnackbar({
          open: true,
          message: error.message,
          severity: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const verificarDisponibilidad = (start, end, eventoId = null) => {
    // Convertir las fechas a timestamps para comparación más precisa
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();

    // Verificar que la fecha de inicio sea anterior a la fecha de fin
    if (startTime >= endTime) {
      return false;
    }

    // Verificar que el horario esté dentro del rango permitido (8:00 - 20:00)
    const horaInicio = new Date(start).getHours();
    const horaFin = new Date(end).getHours();
    if (horaInicio < 8 || horaFin > 20) {
      return false;
    }

    // Verificar que no haya eventos superpuestos
    return !eventos.some(evento => {
      // Ignorar el evento actual si estamos editando
      if (eventoId && evento.id === eventoId) return false;

      const eventoStart = new Date(evento.start).getTime();
      const eventoEnd = new Date(evento.end).getTime();

      // Verificar si hay solapamiento
      return (
        (startTime < eventoEnd && endTime > eventoStart) || // Solapamiento parcial
        (startTime === eventoStart && endTime === eventoEnd) // Mismo horario exacto
      );
    });
  };

  const handleSlotSelect = (selectInfo) => {
    const start = selectInfo.start;
    const end = selectInfo.end;
    
    // Verificar disponibilidad antes de permitir la selección
    if (!verificarDisponibilidad(start, end)) {
      mostrarNotificacion('No se puede crear un evento en este horario. Verifique que no haya conflictos y que esté dentro del horario laboral (8:00 - 20:00)', 'error');
      return;
    }
    
    // Asegurarse de que las fechas se manejen en la zona horaria local
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    setSelectedEvent({
      id: null,
      tipo: tiposServicio[0].id,
      cliente: '',
      vehiculo: '',
      descripcion: '',
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      recordatorio: false,
      mecanico: '',
    });
    setShowNuevoCliente(false);
    setOpenDialog(true);
  };

  const handleEventSelect = (selectInfo) => {
    const evento = selectInfo.event;
    const tipoServicio = tiposServicio.find(t => t.nombre === evento.extendedProps.tipo) || tiposServicio[0];
    
    setSelectedEvent({
      id: evento.id,
      tipo: tipoServicio.id,
      cliente: evento.extendedProps.cliente,
      vehiculo: evento.extendedProps.vehiculo,
      descripcion: evento.extendedProps.descripcion || '',
      start: evento.start.toISOString(),
      end: evento.end.toISOString(),
      recordatorio: evento.extendedProps.recordatorio || false,
      mecanico: evento.extendedProps.mecanico || '',
    });
    setShowNuevoCliente(false);
    setOpenDialog(true);
  };

  // Función debounce para el manejo de eventos
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const handleEventDrop = useCallback(debounce(async (dropInfo) => {
    if (!dropInfo || !dropInfo.event) return;

    const evento = dropInfo.event;
    const startDate = new Date(evento.start);
    const endDate = new Date(evento.end);

    // Verificar disponibilidad usando la nueva función
    if (!verificarDisponibilidad(startDate, endDate, evento.id)) {
      mostrarNotificacion('No se puede mover el evento a este horario. Verifique que no haya conflictos y que esté dentro del horario laboral (8:00 - 20:00)', 'error');
      dropInfo.revert();
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/calendario/eventos/${evento.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: evento.extendedProps.tipo,
          cliente: evento.extendedProps.cliente,
          vehiculo: evento.extendedProps.vehiculo,
          descripcion: evento.extendedProps.descripcion,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          recordatorio: evento.extendedProps.recordatorio,
          mecanico: evento.extendedProps.mecanico
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el evento');
      }

      // Actualizar el estado local
      const eventoActualizado = await response.json();
      setEventos(prevEventos => 
        prevEventos.map(e => 
          e.id === evento.id 
            ? {
                ...e,
                start: new Date(eventoActualizado.start),
                end: new Date(eventoActualizado.end),
                extendedProps: {
                  ...e.extendedProps,
                  start: eventoActualizado.start,
                  end: eventoActualizado.end,
                  mecanico: eventoActualizado.mecanico
                }
              }
            : e
        )
      );

      mostrarNotificacion('Evento actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar evento:', error);
      mostrarNotificacion(error.message, 'error');
      dropInfo.revert();
    }
  }, 300), []);

  const handleEventResize = useCallback(debounce(async (resizeInfo) => {
    if (!resizeInfo || !resizeInfo.event) return;

    const evento = resizeInfo.event;
    const startDate = new Date(evento.start);
    const endDate = new Date(evento.end);

    // Verificar disponibilidad usando la nueva función
    if (!verificarDisponibilidad(startDate, endDate, evento.id)) {
      mostrarNotificacion('No se puede redimensionar el evento a este horario. Verifique que no haya conflictos y que esté dentro del horario laboral (8:00 - 20:00)', 'error');
      resizeInfo.revert();
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/calendario/eventos/${evento.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: evento.extendedProps.tipo,
          cliente: evento.extendedProps.cliente,
          vehiculo: evento.extendedProps.vehiculo,
          descripcion: evento.extendedProps.descripcion,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          recordatorio: evento.extendedProps.recordatorio,
          mecanico: evento.extendedProps.mecanico
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el evento');
      }

      // Actualizar el estado local
      const eventoActualizado = await response.json();
      setEventos(prevEventos => 
        prevEventos.map(e => 
          e.id === evento.id 
            ? {
                ...e,
                start: new Date(eventoActualizado.start),
                end: new Date(eventoActualizado.end),
                extendedProps: {
                  ...e.extendedProps,
                  start: eventoActualizado.start,
                  end: eventoActualizado.end,
                  mecanico: eventoActualizado.mecanico
                }
              }
            : e
        )
      );

      mostrarNotificacion('Evento actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar evento:', error);
      mostrarNotificacion(error.message, 'error');
      resizeInfo.revert();
    }
  }, 300), []);

  const handleSaveEvent = async () => {
    if (!selectedEvent.cliente || !selectedEvent.vehiculo) {
      mostrarNotificacion('Debe seleccionar un cliente y un vehículo', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const tipoServicio = tiposServicio.find(t => t.id === selectedEvent.tipo);
      
      // Convertir las fechas a objetos Date
      const startDate = new Date(selectedEvent.start);
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + tipoServicio.duracion);

      // Verificar disponibilidad antes de guardar
      if (!verificarDisponibilidad(startDate, endDate, selectedEvent.id)) {
        mostrarNotificacion('Hay un conflicto con otro evento en ese horario', 'error');
        return;
      }

      const eventoData = {
        ...selectedEvent,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        tipo: tipoServicio.nombre,
        mecanico: selectedEvent.mecanico
      };

      const url = selectedEvent.id 
        ? `http://localhost:5000/api/calendario/eventos/${selectedEvent.id}`
        : 'http://localhost:5000/api/calendario/eventos';
      
      const method = selectedEvent.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar el evento');
      }

      await cargarDatos();
      setOpenDialog(false);
      mostrarNotificacion(
        selectedEvent.id ? 'Evento actualizado correctamente' : 'Evento creado correctamente'
      );

      if (selectedEvent.recordatorio) {
        await enviarNotificacion(eventoData);
      }
    } catch (error) {
      console.error('Error al guardar evento:', error);
      mostrarNotificacion(error.message, 'error');
    }
  };

  const enviarNotificacion = async (evento) => {
    try {
      const response = await fetch('http://localhost:5000/api/notificaciones/enviar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventoId: evento.id,
          clienteId: evento.cliente,
          tipo: 'recordatorio',
          fecha: evento.start,
        }),
      });

      if (!response.ok) throw new Error('Error al enviar la notificación');
      console.log('Notificación enviada correctamente');
    } catch (error) {
      console.error('Error al enviar notificación:', error);
      // No mostramos el error al usuario para no interrumpir el flujo
    }
  };

  const handleCrearCliente = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch('http://localhost:5000/api/clientes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nuevoCliente),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el cliente');
      }
      
      const clienteCreado = await response.json();
      setClientes([...clientes, clienteCreado]);
      setSelectedEvent({ ...selectedEvent, cliente: clienteCreado.id });
      setShowNuevoCliente(false);
      mostrarNotificacion('Cliente creado correctamente');
    } catch (error) {
      console.error('Error al crear cliente:', error);
      mostrarNotificacion(
        error.message === 'Failed to fetch' 
          ? 'Error de conexión con el servidor. Por favor, verifica que el servidor esté corriendo.' 
          : error.message, 
        'error'
      );
    }
  };

  const handleExportarPDF = async () => {
    if (!calendarRef.current) return;

    const calendarEl = calendarRef.current.getEl();
    const canvas = await html2canvas(calendarEl);
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth * ratio, imgHeight * ratio);
    pdf.save('calendario.pdf');
  };

  const mostrarNotificacion = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress />
        <Typography>Cargando calendario...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {eventos.length === 0 ? (
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No hay eventos programados
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenDialog(true)}
            sx={{ mt: 2 }}
          >
            Crear Primer Evento
          </Button>
        </Paper>
      ) : (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4">
              Calendario de Servicios
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Exportar PDF">
                <IconButton onClick={handleExportarPDF} color="primary">
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Imprimir">
                <IconButton onClick={() => window.print()} color="primary">
                  <PrintIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setOpenDialog(true)}
              >
                Nuevo Evento
              </Button>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Tipos de Servicio:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {tiposServicio.map((tipo) => (
                <Chip
                  key={tipo.id}
                  label={`${tipo.nombre} (${tipo.duracion} min)`}
                  sx={{
                    backgroundColor: tipo.color,
                    color: 'white',
                  }}
                />
              ))}
            </Box>
          </Box>

          <Box sx={{ height: 'calc(100vh - 300px)' }}>
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              locale={esLocale}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              events={eventos}
              select={handleSlotSelect}
              eventClick={handleEventSelect}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              editable={true}
              droppable={true}
              slotDuration="00:30:00"
              allDaySlot={false}
              slotMinTime="08:00:00"
              slotMaxTime="20:00:00"
              timeZone="local"
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false,
                hour12: false
              }}
              eventOverlap={false}
              eventConstraint={{
                startTime: '08:00',
                endTime: '20:00',
                dows: [0, 1, 2, 3, 4, 5, 6]
              }}
              eventDragStart={() => setIsDragging(true)}
              eventDragStop={() => setIsDragging(false)}
              eventResizeStart={() => setIsDragging(true)}
              eventResizeStop={() => setIsDragging(false)}
              eventContent={(eventInfo) => (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    {eventInfo.event.title}
                  </Typography>
                  <Typography variant="caption">
                    {eventInfo.event.extendedProps.descripcion}
                  </Typography>
                </Box>
              )}
            />
          </Box>
        </Paper>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedEvent?.id ? 'Editar Evento' : 'Nuevo Evento'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Servicio</InputLabel>
              <Select
                value={selectedEvent?.tipo || tiposServicio[0].id}
                onChange={(e) => {
                  const tipo = tiposServicio.find(t => t.id === e.target.value);
                  const end = new Date(selectedEvent.start);
                  end.setMinutes(end.getMinutes() + tipo.duracion);
                  setSelectedEvent({ 
                    ...selectedEvent, 
                    tipo: e.target.value,
                    end
                  });
                }}
              >
                {tiposServicio.map((tipo) => (
                  <MenuItem key={tipo.id} value={tipo.id}>
                    {tipo.nombre} ({tipo.duracion} min)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {!showNuevoCliente ? (
              <Autocomplete
                options={clientes}
                getOptionLabel={(option) => `${option.nombre} ${option.apellido}`}
                value={clientes.find(c => c.id === selectedEvent?.cliente) || null}
                onChange={(_, newValue) => {
                  if (newValue) {
                    setSelectedEvent({ ...selectedEvent, cliente: newValue.id });
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cliente"
                    fullWidth
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography>{`${option.nombre} ${option.apellido}`}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.email}
                      </Typography>
                    </Box>
                  </li>
                )}
              />
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Nombre"
                  value={nuevoCliente?.nombre || ''}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Apellido"
                  value={nuevoCliente?.apellido || ''}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, apellido: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Email"
                  type="email"
                  value={nuevoCliente?.email || ''}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Teléfono"
                  value={nuevoCliente?.telefono || ''}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                  fullWidth
                />
              </Box>
            )}

            <Button
              variant="text"
              onClick={() => setShowNuevoCliente(!showNuevoCliente)}
            >
              {showNuevoCliente ? 'Seleccionar Cliente Existente' : 'Crear Nuevo Cliente'}
            </Button>

            <TextField
              label="Vehículo"
              value={selectedEvent?.vehiculo || ''}
              onChange={(e) => setSelectedEvent({ ...selectedEvent, vehiculo: e.target.value })}
              fullWidth
            />
            <TextField
              label="Descripción"
              value={selectedEvent?.descripcion || ''}
              onChange={(e) => setSelectedEvent({ ...selectedEvent, descripcion: e.target.value })}
              multiline
              rows={4}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Recordatorio</InputLabel>
              <Select
                value={selectedEvent?.recordatorio ? 'si' : 'no'}
                onChange={(e) => setSelectedEvent({ 
                  ...selectedEvent, 
                  recordatorio: e.target.value === 'si' 
                })}
              >
                <MenuItem value="si">Sí, enviar recordatorio</MenuItem>
                <MenuItem value="no">No enviar recordatorio</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Mecánico</InputLabel>
              <Select
                value={selectedEvent?.mecanico || ''}
                onChange={(e) => setSelectedEvent({ ...selectedEvent, mecanico: e.target.value })}
              >
                <MenuItem value="">
                  <em>Sin asignar</em>
                </MenuItem>
                {mecanicos
                  .filter(m => m.estado === 'activo')
                  .map((mecanico) => (
                    <MenuItem key={mecanico.id} value={mecanico.id}>
                      {`${mecanico.nombre} ${mecanico.apellido} - ${mecanico.especialidad}`}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          {showNuevoCliente ? (
            <Button onClick={handleCrearCliente} variant="contained" color="primary">
              Crear Cliente
            </Button>
          ) : (
            <Button onClick={handleSaveEvent} variant="contained" color="primary">
              Guardar
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Calendario; 
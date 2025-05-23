import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../services/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/Calendario.css';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import '@fullcalendar/common/main.css';

function toDatetimeLocal(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const pad = n => n < 10 ? '0' + n : n;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
/// Nota: el calendario se adapta a la resolucion de la pantalla
const neonBlue = '#00eaff';
const glassBg = 'linear-gradient(135deg, rgba(30,34,45,0.95) 60%, rgba(0,234,255,0.15) 100%)';
const modalBg = 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)';

const Calendario = () => {
    const [eventos, setEventos] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [mecanicos, setMecanicos] = useState([]);
    const [servicios, setServicios] = useState([]);
    const { token } = useAuth();

    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_fin: '',
        mecanico_id: '',
        servicio_id: '',
        tipo: 'servicio'
    });

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // 'success', 'error', 'info', 'warning'

    useEffect(() => {
        fetchMecanicos();
        fetchServicios();
        fetchEvents();
    }, []);

    const fetchMecanicos = async () => {
        try {
            const response = await axios.get(`${API_URL}/mecanicos`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMecanicos(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error al cargar mecánicos:', error);
            setMecanicos([]);
        }
    };

    const fetchServicios = async () => {
        try {
            const response = await axios.get(`${API_URL}/servicios`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setServicios(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error al cargar servicios:', error);
            setServicios([]);
        }
    };

    const fetchEvents = async () => {
        try {
            const response = await axios.get(`${API_URL}/eventos`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const eventosData = Array.isArray(response.data) ? response.data : [];
            const eventosFormateados = eventosData.map(evento => ({
                id: evento.id,
                title: evento.titulo,
                start: evento.fecha_inicio,
                end: evento.fecha_fin,
                backgroundColor: evento.mecanico?.color || '#3788d8',
                borderColor: evento.mecanico?.color || '#3788d8',
                extendedProps: {
                    descripcion: evento.descripcion,
                    mecanico: evento.mecanico,
                    servicio: evento.servicio,
                    tipo: evento.tipo,
                    estado: evento.estado
                }
            }));
            setEventos(eventosFormateados);
        } catch (error) {
            console.error('Error al cargar eventos:', error);
            setEventos([]);
        }
    };

    const handleDateSelect = (selectInfo) => {
        setSelectedEvent(null);
        setFormData({
            titulo: '',
            descripcion: '',
            fecha_inicio: selectInfo.startStr,
            fecha_fin: selectInfo.endStr,
            mecanico_id: '',
            servicio_id: '',
            tipo: 'servicio'
        });
        setShowModal(true);
    };

    const handleEventClick = (clickInfo) => {
        const evento = clickInfo.event;
        setSelectedEvent(evento);
        setFormData({
            titulo: evento.title,
            descripcion: evento.extendedProps.descripcion,
            fecha_inicio: evento.startStr,
            fecha_fin: evento.endStr,
            mecanico_id: evento.extendedProps.mecanico?.id,
            servicio_id: evento.extendedProps.servicio?.id,
            tipo: evento.extendedProps.tipo
        });
        setShowModal(true);
    };

    const handleSnackbar = (message, severity = 'success') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    const validateForm = () => {
        if (!formData.titulo.trim()) {
            handleSnackbar('El título es obligatorio', 'error');
            return false;
        }
        if (!formData.fecha_inicio) {
            handleSnackbar('La fecha de inicio es obligatoria', 'error');
            return false;
        }
        if (!formData.fecha_fin) {
            handleSnackbar('La fecha de fin es obligatoria', 'error');
            return false;
        }
        const inicio = new Date(formData.fecha_inicio);
        const fin = new Date(formData.fecha_fin);
        if (fin <= inicio) {
            handleSnackbar('La fecha de fin debe ser posterior a la fecha de inicio', 'error');
            return false;
        }
        if (!formData.mecanico_id) {
            handleSnackbar('Debe seleccionar un mecánico', 'error');
            return false;
        }
        if (!formData.servicio_id) {
            handleSnackbar('Debe seleccionar un servicio', 'error');
            return false;
        }
        return true;
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        try {
            await axios.post(`${API_URL}/eventos`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            handleSnackbar('Evento creado exitosamente', 'success');
            handleClose();
            fetchEvents();
        } catch (error) {
            handleSnackbar('Error al crear evento', 'error');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        try {
            await axios.put(`${API_URL}/eventos/${selectedEvent.id}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            handleSnackbar('Evento actualizado exitosamente', 'info');
            handleClose();
            fetchEvents();
        } catch (error) {
            handleSnackbar('Error al actualizar evento', 'error');
        }
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`${API_URL}/eventos/${selectedEvent.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            handleSnackbar('Evento eliminado exitosamente', 'warning');
            handleClose();
            fetchEvents();
        } catch (error) {
            handleSnackbar('Error al eliminar evento', 'error');
        }
    };

    const handleClose = () => {
        setShowModal(false);
    };

    // Adaptar eventos para incluir color por mecánico
    const eventosAdaptados = eventos.map(ev => ({
        ...ev,
        backgroundColor: ev.extendedProps?.mecanico?.color || ev.backgroundColor || '#0070F3',
        borderColor: ev.extendedProps?.mecanico?.color || ev.borderColor || '#0070F3',
    }));

    return (
        <div className="container-fluid p-4">
            <div className="card">
                <div className="card-body">
                    <div className="mecanicos-leyenda">
                        {Array.isArray(mecanicos) && mecanicos.map(mecanico => (
                            <div key={mecanico.id} className="mecanico-item">
                                <div 
                                    className="mecanico-color" 
                                    style={{ backgroundColor: mecanico.color }}
                                />
                                <span className="mecanico-nombre">
                                    {mecanico.nombre} {mecanico.apellido}
                                </span>
                            </div>
                        ))}
                    </div>

                    <FullCalendar
                        plugins={[
                            dayGridPlugin,
                            timeGridPlugin,
                            interactionPlugin
                        ]}
                        initialView="timeGridDay"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay'
                        }}
                        events={eventosAdaptados}
                        slotMinTime="05:00:00"
                        slotMaxTime="20:59:00"
                        allDaySlot={false}
                        slotDuration="00:15:00"
                        slotLabelInterval="01:00"
                        nowIndicator={true}
                        eventTimeFormat={{
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        }}
                        selectable={true}
                        selectMirror={true}
                        dayMaxEvents={true}
                        weekends={true}
                        select={handleDateSelect}
                        eventClick={handleEventClick}
                    />
                </div>
            </div>

            <Dialog
                open={showModal}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        minHeight: '60vh',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 4,
                        boxShadow: '0 12px 28px rgba(0, 0, 0, 0.15)',
                        background: modalBg,
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        border: '1px solid #e0e0e0'
                    }
                }}
            >
                <DialogTitle sx={{
                    fontWeight: 600,
                    fontSize: '1.5rem',
                    color: '#2c3e50',
                    borderBottom: '1px solid #e9ecef',
                    padding: '20px 24px',
                    background: '#fff'
                }}>{selectedEvent ? 'Editar Evento' : 'Nuevo Evento'}</DialogTitle>
                <DialogContent>
                    <form onSubmit={selectedEvent ? handleUpdate : handleCreate}>
                        <TextField
                            fullWidth
                            label="Título"
                            value={formData.titulo}
                            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                            required
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            label="Descripción"
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            multiline
                            rows={3}
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            label="Fecha Inicio"
                            type="datetime-local"
                            value={toDatetimeLocal(formData.fecha_inicio)}
                            onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                            required
                            margin="normal"
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: '#2196f3',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#1976d2',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#2196f3',
                                    },
                                    background: '#e3f2fd',
                                },
                                '& .MuiInputLabel-root': {
                                    color: '#2196f3',
                                },
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Fecha Fin"
                            type="datetime-local"
                            value={toDatetimeLocal(formData.fecha_fin)}
                            onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                            required
                            margin="normal"
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: '#2196f3',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#1976d2',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#2196f3',
                                    },
                                    background: '#e3f2fd',
                                },
                                '& .MuiInputLabel-root': {
                                    color: '#2196f3',
                                },
                            }}
                        />
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Mecánico</InputLabel>
                            <Select
                                value={formData.mecanico_id}
                                onChange={(e) => setFormData({ ...formData, mecanico_id: e.target.value })}
                                label="Mecánico"
                            >
                                <MenuItem value=""><em>Sin asignar</em></MenuItem>
                                {mecanicos && mecanicos.length > 0 && mecanicos.map((m) => (
                                    <MenuItem key={m.id} value={m.id}>{m.nombre} {m.apellido}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Servicio</InputLabel>
                            <Select
                                value={formData.servicio_id}
                                onChange={(e) => setFormData({ ...formData, servicio_id: e.target.value })}
                                label="Servicio"
                            >
                                <MenuItem value=""><em>Sin asignar</em></MenuItem>
                                {servicios && servicios.length > 0 && servicios.map((s) => (
                                    <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <DialogActions sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 2,
                            mt: 3,
                            padding: '16px 24px'
                        }}>
                            <Button 
                                onClick={handleClose} 
                                sx={{
                                    borderRadius: 1,
                                    px: 3,
                                    py: 1,
                                    fontWeight: 500,
                                    color: '#6c757d',
                                    '&:hover': {
                                        background: '#f8f9fa'
                                    }
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="submit" 
                                variant="contained" 
                                sx={{
                                    borderRadius: 1,
                                    px: 3,
                                    py: 1,
                                    fontWeight: 500,
                                    background: '#2196f3',
                                    boxShadow: '0 2px 4px rgba(33, 150, 243, 0.3)',
                                    '&:hover': {
                                        background: '#1976d2',
                                        boxShadow: '0 4px 8px rgba(33, 150, 243, 0.4)'
                                    }
                                }}
                            >
                                {selectedEvent ? 'Actualizar' : 'Crear'}
                            </Button>
                            {selectedEvent && (
                                <Button 
                                    onClick={handleDelete} 
                                    sx={{
                                        borderRadius: 1,
                                        px: 3,
                                        py: 1,
                                        fontWeight: 500,
                                        color: '#fff',
                                        background: '#dc3545',
                                        boxShadow: '0 2px 4px rgba(220, 53, 69, 0.3)',
                                        '&:hover': {
                                            background: '#c82333',
                                            boxShadow: '0 4px 8px rgba(220, 53, 69, 0.4)'
                                        }
                                    }}
                                >
                                    Eliminar
                                </Button>
                            )}
                        </DialogActions>
                    </form>
                </DialogContent>
            </Dialog>
            <Snackbar
                open={openSnackbar}
                autoHideDuration={3000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <MuiAlert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </MuiAlert>
            </Snackbar>
        </div>
    );
};

export default Calendario; 
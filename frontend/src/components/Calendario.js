import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { Modal, Button, Form } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/Calendario.css';

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

    useEffect(() => {
        cargarEventos();
        cargarMecanicos();
        cargarServicios();
    }, []);

    const cargarEventos = async () => {
        try {
            const response = await axios.get('/api/eventos', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const eventosFormateados = response.data.map(evento => ({
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
        }
    };

    const cargarMecanicos = async () => {
        try {
            const response = await axios.get('/api/mecanicos', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMecanicos(response.data);
        } catch (error) {
            console.error('Error al cargar mecánicos:', error);
        }
    };

    const cargarServicios = async () => {
        try {
            const response = await axios.get('/api/servicios', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setServicios(response.data);
        } catch (error) {
            console.error('Error al cargar servicios:', error);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedEvent) {
                await axios.put(`/api/eventos/${selectedEvent.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/eventos', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setShowModal(false);
            cargarEventos();
        } catch (error) {
            console.error('Error al guardar evento:', error);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este evento?')) {
            try {
                await axios.delete(`/api/eventos/${selectedEvent.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setShowModal(false);
                cargarEventos();
            } catch (error) {
                console.error('Error al eliminar evento:', error);
            }
        }
    };

    return (
        <div className="container-fluid p-4">
            <div className="card">
                <div className="card-body">
                    <div className="mecanicos-leyenda">
                        {mecanicos.map(mecanico => (
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
                        select={handleDateSelect}
                        eventClick={handleEventClick}
                        height="auto"
                        slotMinTime="08:00:00"
                        slotMaxTime="18:00:00"
                        allDaySlot={false}
                        slotDuration="00:30:00"
                        eventContent={(eventInfo) => {
                            return (
                                <div className="fc-event-main-content">
                                    <div className="fc-event-title">
                                        {eventInfo.event.title}
                                    </div>
                                    {eventInfo.event.extendedProps.mecanico && (
                                        <div className="fc-event-mecanico">
                                            {eventInfo.event.extendedProps.mecanico.nombre}
                                        </div>
                                    )}
                                </div>
                            );
                        }}
                    />
                </div>
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {selectedEvent ? 'Editar Evento' : 'Nuevo Evento'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Título</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.titulo}
                                onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Descripción</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={formData.descripcion}
                                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Mecánico</Form.Label>
                            <Form.Select
                                value={formData.mecanico_id}
                                onChange={(e) => setFormData({...formData, mecanico_id: e.target.value})}
                                required
                            >
                                <option value="">Seleccionar mecánico</option>
                                {mecanicos.map(mecanico => (
                                    <option key={mecanico.id} value={mecanico.id}>
                                        {mecanico.nombre} {mecanico.apellido}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Servicio</Form.Label>
                            <Form.Select
                                value={formData.servicio_id}
                                onChange={(e) => setFormData({...formData, servicio_id: e.target.value})}
                            >
                                <option value="">Seleccionar servicio</option>
                                {servicios.map(servicio => (
                                    <option key={servicio.id} value={servicio.id}>
                                        {servicio.descripcion}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Fecha Inicio</Form.Label>
                            <Form.Control
                                type="datetime-local"
                                value={formData.fecha_inicio}
                                onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Fecha Fin</Form.Label>
                            <Form.Control
                                type="datetime-local"
                                value={formData.fecha_fin}
                                onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
                                required
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-between">
                            <Button variant="primary" type="submit">
                                {selectedEvent ? 'Actualizar' : 'Crear'}
                            </Button>
                            {selectedEvent && (
                                <Button variant="danger" onClick={handleDelete}>
                                    Eliminar
                                </Button>
                            )}
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Calendario; 
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Modal, Button, Form } from 'react-bootstrap';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth, isSameDay } from 'date-fns';
import axios from 'axios';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '../styles/CalendarioModern.css';

const eventos = [
  {
    id: 1,
    title: 'UX meeting',
    start: '2023-10-18T09:00:00',
    end: '2023-10-18T10:00:00',
    backgroundColor: '#B0E0E6',
    borderColor: '#B0E0E6'
  },
  // ...más eventos de ejemplo
];

export default function CalendarioMain() {
  // Estado para el modal y el evento actual
  const [showModal, setShowModal] = useState(false);
  const [eventos, setEventos] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventoActual, setEventoActual] = useState({
    cliente_id: '',
    vehiculo_id: '',
    title: '',
    descripcion: '',
    start: '',
    end: ''
  });

  // Datos mock
  const clientes = [
    { id: 1, nombre: 'Juan Pérez' },
    { id: 2, nombre: 'Ana García' }
  ];
  const vehiculos = [
    { id: 1, cliente_id: 1, descripcion: 'Toyota Corolla 2018' },
    { id: 2, cliente_id: 1, descripcion: 'Honda Civic 2020' },
    { id: 3, cliente_id: 2, descripcion: 'Ford Fiesta 2017' }
  ];

  // Cargar datos del backend
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar eventos
        const eventosRes = await axios.get('/api/eventos');
        setEventos(eventosRes.data.eventos || []);

        // Cargar mecánicos
        const mecanicosRes = await axios.get('/api/mecanicos');
        setMecanicos(mecanicosRes.data.mecanicos || []);

        // Cargar servicios
        const serviciosRes = await axios.get('/api/servicios');
        setServicios(serviciosRes.data.servicios || []);

      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Abrir modal para nuevo evento
  const handleDateSelect = (selectInfo) => {
    setEventoActual({
      cliente_id: '',
      vehiculo_id: '',
      title: '',
      descripcion: '',
      start: selectInfo.startStr,
      end: selectInfo.endStr
    });
    setShowModal(true);
  };

  // Modificar handleSave para guardar en el backend
  const handleSave = async (evento) => {
    try {
      if (evento.id) {
        // Actualizar evento existente
        await axios.put(`/api/eventos/${evento.id}`, evento);
      } else {
        // Crear nuevo evento
        await axios.post('/api/eventos', evento);
      }
      // Recargar eventos
      const eventosRes = await axios.get('/api/eventos');
      setEventos(eventosRes.data.eventos || []);
      setShowModal(false);
    } catch (err) {
      console.error('Error al guardar evento:', err);
      setError('Error al guardar el evento. Por favor, intente nuevamente.');
    }
  };

  // Modificar handleDelete para eliminar en el backend
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/eventos/${id}`);
      // Recargar eventos
      const eventosRes = await axios.get('/api/eventos');
      setEventos(eventosRes.data.eventos || []);
      setShowModal(false);
    } catch (err) {
      console.error('Error al eliminar evento:', err);
      setError('Error al eliminar el evento. Por favor, intente nuevamente.');
    }
  };

  useEffect(() => {
    if (window.bootstrap) {
      document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
        new window.bootstrap.Tooltip(el);
      });
    }
  }, []);

  return (
    <main className="calendar-main flex-grow-1 p-4">
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <div className="calendar-header d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="fw-bold mb-0">Octubre 2023</h2>
            <span className="badge bg-light text-dark">Hoy</span>
          </div>
          <div>
            <button
              className="btn btn-outline-secondary me-2"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Ver calendario mensual"
            >
              Mes
            </button>
            <button
              className="btn btn-primary"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Ver calendario semanal"
            >
              Semana
            </button>
            <button
              className="btn btn-outline-secondary ms-2"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Ver calendario diario"
            >
              Día
            </button>
          </div>
        </div>
      )}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        events={eventos}
        height="auto"
        headerToolbar={false}
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        slotDuration="00:10:00"
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }}
        allDaySlot={false}
        dayMaxEvents={true}
        views={{
          timeGridDay: {
            slotMinTime: '00:00:00',
            slotMaxTime: '24:00:00',
            slotDuration: '00:10:00',
            slotLabelFormat: {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }
          },
          timeGridWeek: {
            slotMinTime: '00:00:00',
            slotMaxTime: '24:00:00',
            slotDuration: '00:10:00',
            slotLabelFormat: {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }
          }
        }}
        selectable={true}
        select={handleDateSelect}
        eventDidMount={info => {
          if (window.bootstrap) {
            new window.bootstrap.Tooltip(info.el, {
              title: `${info.event.title} - ${info.event.extendedProps.descripcion || ''}`,
              placement: 'top',
              trigger: 'hover',
              container: 'body'
            });
          }
        }}
        eventContent={eventInfo => (
          <div>
            <div className="fc-event-title">{eventInfo.event.title}</div>
            {eventInfo.event.extendedProps.estado && (
              <span className={`badge-estado badge-${eventInfo.event.extendedProps.estado}`}>
                {eventInfo.event.extendedProps.estado.charAt(0).toUpperCase() + eventInfo.event.extendedProps.estado.slice(1)}
              </span>
            )}
          </div>
        )}
      />
      <EventoModal
        show={showModal}
        onHide={() => setShowModal(false)}
        evento={eventoActual}
        onSave={handleSave}
        onDelete={handleDelete}
        onChange={setEventoActual}
        clientes={clientes}
        vehiculos={vehiculos}
      />
    </main>
  );
}

export function EventoModal({
  show, onHide, evento, onSave, onDelete, onChange,
  clientes = [], vehiculos = []
}) {
  // Filtrar vehículos del cliente seleccionado
  const vehiculosCliente = vehiculos.filter(
    v => v.cliente_id === evento.cliente_id
  );

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{evento.id ? 'Editar Evento' : 'Nuevo Evento'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {/* Cliente */}
          <Form.Group className="mb-3">
            <Form.Label>Cliente</Form.Label>
            <Form.Select
              value={evento.cliente_id || ''}
              onChange={e => onChange({ ...evento, cliente_id: Number(e.target.value), vehiculo_id: '' })}
              required
            >
              <option value="">Seleccionar cliente</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </Form.Select>
          </Form.Group>
          {/* Vehículo */}
          <Form.Group className="mb-3">
            <Form.Label>Vehículo</Form.Label>
            <Form.Select
              value={evento.vehiculo_id || ''}
              onChange={e => onChange({ ...evento, vehiculo_id: Number(e.target.value) })}
              required
              disabled={!evento.cliente_id}
            >
              <option value="">Seleccionar vehículo</option>
              {vehiculosCliente.map(v => (
                <option key={v.id} value={v.id}>{v.descripcion}</option>
              ))}
            </Form.Select>
          </Form.Group>
          {/* Título */}
          <Form.Group className="mb-3">
            <Form.Label>Título</Form.Label>
            <Form.Control
              type="text"
              value={evento.title || ''}
              onChange={e => onChange({ ...evento, title: e.target.value })}
              required
            />
          </Form.Group>
          {/* Descripción */}
          <Form.Group className="mb-3">
            <Form.Label>Descripción</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={evento.descripcion || ''}
              onChange={e => onChange({ ...evento, descripcion: e.target.value })}
            />
          </Form.Group>
          {/* Fechas */}
          <Form.Group className="mb-3">
            <Form.Label>Fecha inicio</Form.Label>
            <Form.Control
              type="datetime-local"
              value={toDatetimeLocal(evento.start)}
              onChange={e => onChange({ ...evento, start: e.target.value })}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Fecha fin</Form.Label>
            <Form.Control
              type="datetime-local"
              value={toDatetimeLocal(evento.end)}
              onChange={e => onChange({ ...evento, end: e.target.value })}
              required
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        {evento.id && (
          <Button variant="danger" onClick={() => onDelete(evento.id)}>
            Eliminar
          </Button>
        )}
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={() => onSave(evento)}>
          Guardar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export function MiniCalendar({ selectedDate, onDateSelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const renderHeader = () => (
    <div className="d-flex justify-content-between align-items-center mb-2">
      <button className="btn btn-sm btn-light" onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>&lt;</button>
      <span className="fw-bold">{format(currentMonth, 'MMMM yyyy')}</span>
      <button className="btn btn-sm btn-light" onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>&gt;</button>
    </div>
  );

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const endDate = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return (
      <div className="mini-calendar-grid">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => (
          <div key={d} className="mini-calendar-dayname">{d}</div>
        ))}
        {days.map(d => (
          <button
            key={d}
            className={`mini-calendar-day btn btn-sm ${isSameMonth(d, currentMonth) ? '' : 'text-muted'} ${isSameDay(d, selectedDate) ? 'btn-primary text-white' : 'btn-light'}`}
            onClick={() => onDateSelect && onDateSelect(d)}
          >
            {format(d, 'd')}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="mini-calendar mb-4">
      {renderHeader()}
      {renderDays()}
    </div>
  );
}

function toDatetimeLocal(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().slice(0, 16);
}
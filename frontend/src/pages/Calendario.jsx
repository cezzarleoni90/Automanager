import React from 'react';
import '@fullcalendar/core/index.css';
import '@fullcalendar/daygrid/index.css';
import '@fullcalendar/timegrid/index.css';
import { Box, Paper, IconButton, Typography, List, ListItem, ListItemText, Avatar, Divider, Stack } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

// Colores y datos de ejemplo para los mecánicos
const mecanicos = [
  { id: 1, nombre: 'Juan Pérez', color: '#FF6B6B' },
  { id: 2, nombre: 'María González', color: '#4ECDC4' },
  { id: 3, nombre: 'Carlos Rodríguez', color: '#45B7D1' },
  { id: 4, nombre: 'Ana Martínez', color: '#96CEB4' },
  { id: 5, nombre: 'Luis Sánchez', color: '#FFEEAD' },
];

function renderEventContent(eventInfo) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Avatar
        sx={{
          bgcolor: eventInfo.event.backgroundColor,
          width: 20,
          height: 20,
          fontSize: 12,
          fontWeight: 'bold'
        }}
      >
        {eventInfo.event.title.split(' ')[1]?.[0]}
      </Avatar>
      <Typography variant="body2" sx={{ color: '#23232a', fontWeight: 600 }}>
        {eventInfo.event.title}
      </Typography>
    </Box>
  );
}

function handleEventDrop(info) {
  // Actualiza el evento en tu backend aquí
  // info.event contiene el evento actualizado
}

function handleContextMenu(eventInfo) {
  // Abre menú contextual en la posición del mouse
}

function handleEventClick(info) {
  // Si es doble click, muestra input para editar el título
}

const Calendario = () => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#18181b', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
      {/* Sidebar */}
      <Paper
        elevation={4}
        sx={{
          width: 320,
          minWidth: 280,
          maxWidth: 340,
          bgcolor: '#18181b',
          borderRadius: 5,
          m: 2,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 4px 32px rgba(0,0,0,0.25)'
        }}
      >
        {/* Botón de menú */}
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
          <IconButton sx={{ bgcolor: '#28282b', color: 'white', borderRadius: 2 }}>
            <MenuIcon />
          </IconButton>
        </Box>
        {/* Calendario mensual real */}
        <Box sx={{ width: '100%', mb: 3 }}>
          <Paper sx={{ bgcolor: '#23232a', borderRadius: 3, p: 2 }}>
            <Calendar
              locale="es-ES"
              calendarType="ISO 8601"
              next2Label={null}
              prev2Label={null}
              tileClassName={({ date, view }) => 'custom-calendar-tile'}
              className="custom-calendar"
            />
          </Paper>
        </Box>
        {/* Lista de mecánicos */}
        <Box sx={{ width: '100%', mb: 3 }}>
          <Typography color="#bdbdbd" variant="body2" sx={{ mb: 1, ml: 1 }}>
            Mecánicos
          </Typography>
          <List>
            {mecanicos.map((m) => (
              <ListItem
                key={m.id}
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  px: 1.5,
                  py: 0.5,
                  transition: 'background 0.2s',
                  '&:hover': { bgcolor: '#23232a', transform: 'scale(1.03)' }
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: m.color,
                    width: 32,
                    height: 32,
                    fontWeight: 'bold',
                    mr: 2,
                    border: '2px solid #fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                >
                  {m.nombre.split(' ').map(n => n[0]).join('')}
                </Avatar>
                <ListItemText
                  primary={<Typography color="white" fontWeight="medium">{m.nombre}</Typography>}
                />
              </ListItem>
            ))}
          </List>
        </Box>
        <Divider sx={{ bgcolor: '#333', width: '90%', my: 2 }} />
        {/* Secciones adicionales */}
        <Box sx={{ width: '100%', mb: 2 }}>
          <Typography color="#bdbdbd" variant="body2" sx={{ mb: 1, ml: 1 }}>Mis Calendarios</Typography>
          <Typography
            color="white"
            variant="body2"
            sx={{
              ml: 3,
              borderRadius: 2,
              px: 1,
              py: 0.5,
              transition: 'background 0.2s',
              cursor: 'pointer',
              '&:hover': { bgcolor: '#23232a' }
            }}
          >
            Tareas diarias
          </Typography>
          <Typography color="white" variant="body2" sx={{ ml: 3 }}>Cumpleaños</Typography>
          <Typography color="white" variant="body2" sx={{ ml: 3 }}>Tareas</Typography>
        </Box>
        <Box sx={{ width: '100%', mb: 2 }}>
          <Typography color="#bdbdbd" variant="body2" sx={{ mb: 1, ml: 1 }}>Categorías</Typography>
          <Typography color="white" variant="body2" sx={{ ml: 3 }}>Trabajo</Typography>
          <Typography color="white" variant="body2" sx={{ ml: 3 }}>Personal</Typography>
          <Typography color="white" variant="body2" sx={{ ml: 3 }}>Educación</Typography>
        </Box>
        {/* Footer con avatares */}
        <Box sx={{ width: '100%', mt: 'auto', display: 'flex', justifyContent: 'center', gap: 1 }}>
          <Stack direction="row" spacing={-1}>
            {mecanicos.slice(0, 3).map((m) => (
              <Avatar key={m.id} sx={{ bgcolor: m.color, width: 28, height: 28, border: '2px solid #18181b', fontWeight: 'bold' }}>
                {m.nombre.split(' ').map(n => n[0]).join('')}
              </Avatar>
            ))}
          </Stack>
        </Box>
      </Paper>

      {/* Panel principal */}
      <Box
        sx={{
          flexGrow: 1,
          m: 2,
          borderRadius: 5,
          overflow: 'hidden',
          minHeight: '96vh',
          background: 'linear-gradient(120deg, #fdf497 0%, #a1c4fd 100%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.10)'
        }}
      >
        <Box sx={{ p: 4 }}>
          <Typography
            variant="h4"
            fontWeight="bold"
            color="#23232a"
            mb={2}
            sx={{ textShadow: '0 2px 8px rgba(255,255,255,0.2)' }}
          >
            Calendario de Servicios
          </Typography>
          <Typography color="#23232a" mb={4}>
            Agenda semanal de los servicios asignados a cada mecánico.
          </Typography>
          <FullCalendar
            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale={esLocale}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            height="auto"
            slotMinTime="07:00:00"
            slotMaxTime="20:00:00"
            allDaySlot={false}
            events={[
              {
                id: 1,
                title: 'Servicio Juan',
                start: '2023-10-19T09:00:00',
                end: '2023-10-19T11:00:00',
                backgroundColor: '#FF6B6B',
                borderColor: '#FF6B6B'
              },
              {
                id: 2,
                title: 'Servicio María',
                start: '2023-10-19T12:00:00',
                end: '2023-10-19T14:00:00',
                backgroundColor: '#4ECDC4',
                borderColor: '#4ECDC4'
              },
              {
                id: 3,
                title: 'Servicio Carlos',
                start: '2023-10-20T10:00:00',
                end: '2023-10-20T12:00:00',
                backgroundColor: '#45B7D1',
                borderColor: '#45B7D1'
              },
              {
                id: 4,
                title: 'Servicio Ana',
                start: '2023-10-21T08:00:00',
                end: '2023-10-21T10:00:00',
                backgroundColor: '#96CEB4',
                borderColor: '#96CEB4'
              },
              {
                id: 5,
                title: 'Servicio Luis',
                start: '2023-10-21T13:00:00',
                end: '2023-10-21T15:00:00',
                backgroundColor: '#FFEEAD',
                borderColor: '#FFEEAD'
              }
            ]}
            eventDisplay="block"
            eventContent={renderEventContent}
            editable={true}
            eventDrop={handleEventDrop}
            eventDidMount={info => {
              info.el.addEventListener('contextmenu', e => {
                e.preventDefault();
                handleContextMenu(info);
              });
            }}
            eventClick={handleEventClick}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Calendario;
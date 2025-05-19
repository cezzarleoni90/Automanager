import React from 'react';
import { Box, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const StyledCalendarContainer = styled(Box)(({ theme }) => ({
  backgroundColor: '#f5f3ff !important',
  boxShadow: `${theme.shadows[3]} !important`,
  border: `1px solid ${theme.palette.divider} !important`,
  borderRadius: '12px !important',
  padding: `${theme.spacing(3)} !important`,
  marginY: `${theme.spacing(2)} !important`,
  marginX: 'auto',
  maxWidth: 1400,
  width: '100%',
  minHeight: 400,
  transition: 'box-shadow 0.3s, border-color 0.3s',
  display: 'flex',
  flexDirection: 'column',
  
  // Estilos específicos para FullCalendar
  '& .fc': {
    fontFamily: `${theme.typography.fontFamily} !important`,
    fontSize: `${theme.typography.body2.fontSize} !important`,
    backgroundColor: '#f5f3ff !important',
  },
  
  '& .fc.fc': { backgroundColor: '#f5f3ff !important' },
  
  // Header del calendario
  '& .fc-toolbar': {
    backgroundColor: 'transparent !important',
    marginBottom: `${theme.spacing(2)} !important`,
  },
  
  '& .fc-toolbar-title': {
    fontSize: `${theme.typography.h5.fontSize} !important`,
    fontWeight: `${theme.typography.h5.fontWeight} !important`,
    color: `${theme.palette.primary.main} !important`,
  },
  
  // Botones de navegación
  '& .fc-button': {
    backgroundColor: `${theme.palette.primary.main} !important`,
    borderColor: `${theme.palette.primary.main} !important`,
    color: `${theme.palette.primary.contrastText} !important`,
    borderRadius: '8px !important',
    fontWeight: '500 !important',
    '&:hover': {
      backgroundColor: `${theme.palette.primary.dark} !important`,
      borderColor: `${theme.palette.primary.dark} !important`,
    },
    '&:focus': {
      boxShadow: `0 0 0 2px ${theme.palette.primary.main}40 !important`,
    }
  },
  
  // Grid del calendario
  '& .fc-scrollgrid': {
    border: 'none !important',
    borderRadius: '8px !important',
    overflow: 'hidden !important',
  },
  
  '& .fc-scrollgrid-sync-table': {
    backgroundColor: 'white !important',
  },
  
  // Headers de días
  '& .fc-col-header-cell': {
    backgroundColor: `${theme.palette.grey[100]} !important`,
    borderColor: `${theme.palette.divider} !important`,
    fontWeight: '600 !important',
    color: `${theme.palette.text.primary} !important`,
  },
  
  // Celdas de días
  '& .fc-daygrid-day': {
    backgroundColor: 'white !important',
    borderColor: `${theme.palette.divider} !important`,
    '&:hover': {
      backgroundColor: `${theme.palette.action.hover} !important`,
    }
  },
  
  // Números de días
  '& .fc-daygrid-day-number': {
    color: `${theme.palette.text.primary} !important`,
    fontWeight: '500 !important',
    padding: `${theme.spacing(0.5)} !important`,
  },
  
  // Días de otros meses
  '& .fc-day-other .fc-daygrid-day-number': {
    color: `${theme.palette.text.disabled} !important`,
  },
  
  // Día actual
  '& .fc-day-today': {
    backgroundColor: `${theme.palette.primary.main}15 !important`,
    '& .fc-daygrid-day-number': {
      color: `${theme.palette.primary.main} !important`,
      fontWeight: '700 !important',
    }
  },
  
  // Eventos
  '& .fc-event': {
    backgroundColor: `${theme.palette.secondary.main} !important`,
    borderColor: `${theme.palette.secondary.main} !important`,
    borderRadius: '6px !important',
    padding: `${theme.spacing(0.25, 0.5)} !important`,
    marginBottom: '2px !important',
    fontSize: `${theme.typography.caption.fontSize} !important`,
    '&:hover': {
      backgroundColor: `${theme.palette.secondary.dark} !important`,
      cursor: 'pointer !important',
    }
  },
  
  // Texto de eventos
  '& .fc-event-title': {
    fontWeight: '500 !important',
    color: `${theme.palette.secondary.contrastText} !important`,
  },
  
  // Vista de semana/día
  '& .fc-timegrid-slot': {
    borderColor: `${theme.palette.divider} !important`,
  },
  
  '& .fc-timegrid-axis': {
    borderColor: `${theme.palette.divider} !important`,
  },
  
  // Línea del tiempo actual
  '& .fc-timegrid-now-indicator-line': {
    borderColor: `${theme.palette.error.main} !important`,
    borderWidth: '2px !important',
  },
  
  '& .fc-timegrid-now-indicator-arrow': {
    borderColor: `${theme.palette.error.main} !important`,
  },
  
  // Responsive
  [theme.breakpoints.down('sm')]: {
    padding: `${theme.spacing(1)} !important`,
    '& .fc-toolbar': {
      flexDirection: 'column !important',
      gap: `${theme.spacing(1)} !important`,
    },
    '& .fc-toolbar-title': {
      fontSize: `${theme.typography.h6.fontSize} !important`,
    }
  },
  
  border: '5px solid red !important',
}));

const CalendarioWrapper = ({ children }) => {
  const fetchMecanicos = async () => {
    try {
      const response = await axios.get(`${API_URL}/mecanicos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('MECANICOS:', response.data);
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
      console.log('SERVICIOS:', response.data);
      setServicios(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      setServicios([]);
    }
  };

  return (
    <StyledCalendarContainer>
      {children}
    </StyledCalendarContainer>
  );
};

export default CalendarioWrapper;
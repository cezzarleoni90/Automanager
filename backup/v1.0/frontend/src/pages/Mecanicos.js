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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

function Mecanicos() {
  const { user } = useAuth();
  const [mecanicos, setMecanicos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMecanico, setSelectedMecanico] = useState({
    nombre: '',
    apellido: '',
    especialidad: '',
    estado: 'activo',
    horasTrabajo: {
      lunes: { inicio: '08:00', fin: '17:00' },
      martes: { inicio: '08:00', fin: '17:00' },
      miercoles: { inicio: '08:00', fin: '17:00' },
      jueves: { inicio: '08:00', fin: '17:00' },
      viernes: { inicio: '08:00', fin: '17:00' },
      sabado: { inicio: '08:00', fin: '13:00' },
      domingo: { inicio: '', fin: '' },
    },
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(true);
  const [showHorarios, setShowHorarios] = useState(false);

  const especialidades = [
    'Mecánica General',
    'Electricidad Automotriz',
    'Suspensión y Dirección',
    'Transmisión',
    'Motor',
    'Aire Acondicionado',
    'Diagnóstico Electrónico',
  ];

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

      const [mecanicosRes, eventosRes] = await Promise.all([
        fetch('http://localhost:5000/api/mecanicos', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('http://localhost:5000/api/calendario/eventos', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (!mecanicosRes.ok || !eventosRes.ok) {
        throw new Error('Error al cargar datos');
      }

      const [mecanicosData, eventosData] = await Promise.all([
        mecanicosRes.json(),
        eventosRes.json()
      ]);

      setMecanicos(mecanicosData.mecanicos || []);
      setEventos(eventosData.eventos || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      mostrarNotificacion(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMecanico = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = selectedMecanico.id 
        ? `http://localhost:5000/api/mecanicos/${selectedMecanico.id}`
        : 'http://localhost:5000/api/mecanicos';
      
      const method = selectedMecanico.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedMecanico),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar el mecánico');
      }

      await cargarDatos();
      setOpenDialog(false);
      mostrarNotificacion(
        selectedMecanico.id ? 'Mecánico actualizado correctamente' : 'Mecánico creado correctamente'
      );
    } catch (error) {
      console.error('Error al guardar mecánico:', error);
      mostrarNotificacion(error.message, 'error');
    }
  };

  const handleDeleteMecanico = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este mecánico?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/mecanicos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar el mecánico');
      }

      await cargarDatos();
      mostrarNotificacion('Mecánico eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar mecánico:', error);
      mostrarNotificacion(error.message, 'error');
    }
  };

  const handleEditMecanico = (mecanico) => {
    setSelectedMecanico(mecanico);
    setOpenDialog(true);
  };

  const handleNuevoMecanico = () => {
    setSelectedMecanico({
      nombre: '',
      apellido: '',
      especialidad: '',
      estado: 'activo',
      horasTrabajo: {
        lunes: { inicio: '08:00', fin: '17:00' },
        martes: { inicio: '08:00', fin: '17:00' },
        miercoles: { inicio: '08:00', fin: '17:00' },
        jueves: { inicio: '08:00', fin: '17:00' },
        viernes: { inicio: '08:00', fin: '17:00' },
        sabado: { inicio: '08:00', fin: '13:00' },
        domingo: { inicio: '', fin: '' },
      },
    });
    setOpenDialog(true);
  };

  const mostrarNotificacion = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getEventosMecanico = (mecanicoId) => {
    return eventos.filter(evento => evento.mecanico === mecanicoId);
  };

  const getHorasTrabajadas = (mecanicoId) => {
    const eventosMecanico = getEventosMecanico(mecanicoId);
    return eventosMecanico.reduce((total, evento) => {
      const inicio = new Date(evento.start);
      const fin = new Date(evento.end);
      const duracion = (fin - inicio) / (1000 * 60 * 60); // Convertir a horas
      return total + duracion;
    }, 0);
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
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Gestión de Mecánicos
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleNuevoMecanico}
          >
            Nuevo Mecánico
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Especialidad</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Horas Trabajadas</TableCell>
                <TableCell>Eventos Asignados</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mecanicos.map((mecanico) => (
                <TableRow key={mecanico.id}>
                  <TableCell>{`${mecanico.nombre} ${mecanico.apellido}`}</TableCell>
                  <TableCell>{mecanico.especialidad}</TableCell>
                  <TableCell>
                    <Chip
                      label={mecanico.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      color={mecanico.estado === 'activo' ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell>{getHorasTrabajadas(mecanico.id).toFixed(1)} horas</TableCell>
                  <TableCell>{getEventosMecanico(mecanico.id).length}</TableCell>
                  <TableCell>
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleEditMecanico(mecanico)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton onClick={() => handleDeleteMecanico(mecanico.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Ver Horarios">
                      <IconButton onClick={() => {
                        setSelectedMecanico(mecanico);
                        setShowHorarios(true);
                      }}>
                        <ScheduleIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedMecanico.id ? 'Editar Mecánico' : 'Nuevo Mecánico'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre"
                value={selectedMecanico.nombre}
                onChange={(e) => setSelectedMecanico({ ...selectedMecanico, nombre: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Apellido"
                value={selectedMecanico.apellido}
                onChange={(e) => setSelectedMecanico({ ...selectedMecanico, apellido: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Especialidad</InputLabel>
                <Select
                  value={selectedMecanico.especialidad}
                  onChange={(e) => setSelectedMecanico({ ...selectedMecanico, especialidad: e.target.value })}
                >
                  {especialidades.map((especialidad) => (
                    <MenuItem key={especialidad} value={especialidad}>
                      {especialidad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={selectedMecanico.estado}
                  onChange={(e) => setSelectedMecanico({ ...selectedMecanico, estado: e.target.value })}
                >
                  <MenuItem value="activo">Activo</MenuItem>
                  <MenuItem value="inactivo">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveMecanico} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showHorarios} onClose={() => setShowHorarios(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Horarios de Trabajo - {selectedMecanico.nombre} {selectedMecanico.apellido}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {Object.entries(selectedMecanico.horasTrabajo).map(([dia, horario]) => (
              <Grid item xs={12} sm={6} key={dia}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, textTransform: 'capitalize' }}>
                    {dia}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="Inicio"
                        type="time"
                        value={horario.inicio}
                        onChange={(e) => {
                          const newHorarios = { ...selectedMecanico.horasTrabajo };
                          newHorarios[dia].inicio = e.target.value;
                          setSelectedMecanico({ ...selectedMecanico, horasTrabajo: newHorarios });
                        }}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Fin"
                        type="time"
                        value={horario.fin}
                        onChange={(e) => {
                          const newHorarios = { ...selectedMecanico.horasTrabajo };
                          newHorarios[dia].fin = e.target.value;
                          setSelectedMecanico({ ...selectedMecanico, horasTrabajo: newHorarios });
                        }}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHorarios(false)}>Cerrar</Button>
          <Button onClick={handleSaveMecanico} variant="contained" color="primary">
            Guardar Horarios
          </Button>
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

export default Mecanicos; 
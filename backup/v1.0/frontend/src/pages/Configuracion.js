import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

function Configuracion() {
  const { user } = useAuth();
  const [config, setConfig] = useState({
    empresa: {
      nombre: '',
      direccion: '',
      telefono: '',
      email: '',
      ruc: '',
      horario: {
        inicio: '08:00',
        fin: '17:00',
      },
    },
    notificaciones: {
      email: true,
      sms: false,
      recordatorios: true,
      alertas: true,
    },
    seguridad: {
      sesionTimeout: 30,
      requerirCambioPassword: false,
      intentosMaximos: 3,
    },
    backup: {
      automatico: true,
      frecuencia: 'diario',
      retencion: 30,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/configuracion', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar la configuración');
      }

      const data = await response.json();
      setConfig(data.configuracion || config);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (seccion, campo, valor) => {
    setConfig(prev => ({
      ...prev,
      [seccion]: {
        ...prev[seccion],
        [campo]: valor,
      },
    }));
  };

  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/configuracion', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Error al guardar la configuración');
      }

      setSuccess('Configuración guardada exitosamente');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/configuracion/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al realizar el backup');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('Backup realizado exitosamente');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('backup', file);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/configuracion/restore', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al restaurar el backup');
      }

      await cargarConfiguracion();
      setSuccess('Backup restaurado exitosamente');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Configuración del Sistema</Typography>
        <Box>
          <Tooltip title="Realizar Backup">
            <IconButton onClick={handleBackup} color="primary">
              <BackupIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Restaurar Backup">
            <IconButton component="label" color="primary">
              <RestoreIcon />
              <input
                type="file"
                hidden
                accept=".zip"
                onChange={handleRestore}
              />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveConfig}
            disabled={loading}
          >
            Guardar Cambios
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Configuración de Empresa */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<BusinessIcon />}
              title="Información de la Empresa"
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nombre de la Empresa"
                    value={config.empresa.nombre}
                    onChange={(e) => handleInputChange('empresa', 'nombre', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Dirección"
                    value={config.empresa.direccion}
                    onChange={(e) => handleInputChange('empresa', 'direccion', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Teléfono"
                    value={config.empresa.telefono}
                    onChange={(e) => handleInputChange('empresa', 'telefono', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={config.empresa.email}
                    onChange={(e) => handleInputChange('empresa', 'email', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="RUC"
                    value={config.empresa.ruc}
                    onChange={(e) => handleInputChange('empresa', 'ruc', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Configuración de Notificaciones */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<NotificationsIcon />}
              title="Notificaciones"
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.notificaciones.email}
                        onChange={(e) => handleInputChange('notificaciones', 'email', e.target.checked)}
                      />
                    }
                    label="Notificaciones por Email"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.notificaciones.sms}
                        onChange={(e) => handleInputChange('notificaciones', 'sms', e.target.checked)}
                      />
                    }
                    label="Notificaciones por SMS"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.notificaciones.recordatorios}
                        onChange={(e) => handleInputChange('notificaciones', 'recordatorios', e.target.checked)}
                      />
                    }
                    label="Recordatorios Automáticos"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Configuración de Seguridad */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<SecurityIcon />}
              title="Seguridad"
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Tiempo de Sesión (minutos)"
                    value={config.seguridad.sesionTimeout}
                    onChange={(e) => handleInputChange('seguridad', 'sesionTimeout', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.seguridad.requerirCambioPassword}
                        onChange={(e) => handleInputChange('seguridad', 'requerirCambioPassword', e.target.checked)}
                      />
                    }
                    label="Requerir cambio de contraseña periódico"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Intentos máximos de inicio de sesión"
                    value={config.seguridad.intentosMaximos}
                    onChange={(e) => handleInputChange('seguridad', 'intentosMaximos', parseInt(e.target.value))}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Configuración de Backup */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<BackupIcon />}
              title="Backup Automático"
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.backup.automatico}
                        onChange={(e) => handleInputChange('backup', 'automatico', e.target.checked)}
                      />
                    }
                    label="Backup Automático"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Frecuencia de Backup"
                    value={config.backup.frecuencia}
                    onChange={(e) => handleInputChange('backup', 'frecuencia', e.target.value)}
                    SelectProps={{
                      native: true,
                    }}
                  >
                    <option value="diario">Diario</option>
                    <option value="semanal">Semanal</option>
                    <option value="mensual">Mensual</option>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Días de retención"
                    value={config.backup.retencion}
                    onChange={(e) => handleInputChange('backup', 'retencion', parseInt(e.target.value))}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

export default Configuracion; 
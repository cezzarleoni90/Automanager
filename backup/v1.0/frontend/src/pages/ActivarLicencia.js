import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const steps = ['Ingresar Código', 'Verificar', 'Completado'];

function ActivarLicencia() {
  const [activeStep, setActiveStep] = useState(0);
  const [codigo, setCodigo] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [licenciaInfo, setLicenciaInfo] = useState(null);
  const navigate = useNavigate();

  const handleNext = async () => {
    setError('');
    setLoading(true);

    try {
      if (activeStep === 0) {
        // Verificar licencia
        const response = await fetch('http://localhost:5000/api/licencias/validar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ codigo }),
        });

        if (!response.ok) {
          throw new Error('Código de licencia inválido');
        }

        const data = await response.json();
        setLicenciaInfo(data);
        setActiveStep(1);
      } else if (activeStep === 1) {
        // Activar licencia
        const response = await fetch('http://localhost:5000/api/licencias/activar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ codigo, email }),
        });

        if (!response.ok) {
          throw new Error('Error al activar la licencia');
        }

        const data = await response.json();
        localStorage.setItem('clave_activacion', data.clave_activacion);
        setActiveStep(2);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleFinish = () => {
    navigate('/login');
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Código de Licencia"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              margin="normal"
              placeholder="XXXX-XXXX-XXXX-XXXX"
            />
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
            />
            {licenciaInfo && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Información de la Licencia:
                </Typography>
                <Typography>
                  Tipo: {licenciaInfo.tipo === 'trial' ? 'Prueba' : 'Completa'}
                </Typography>
                <Typography>
                  Fecha de Expiración: {new Date(licenciaInfo.fecha_fin).toLocaleDateString()}
                </Typography>
                <Typography>
                  Máximo de Usuarios: {licenciaInfo.max_usuarios}
                </Typography>
              </Box>
            )}
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              ¡Licencia Activada Exitosamente!
            </Typography>
            <Typography>
              Tu licencia ha sido activada y vinculada a tu cuenta.
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 600,
          width: '100%',
        }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          Activación de Licencia
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
          >
            Atrás
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleFinish}
            >
              Ir al Login
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading || (activeStep === 0 && !codigo) || (activeStep === 1 && !email)}
            >
              {loading ? <CircularProgress size={24} /> : 'Siguiente'}
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default ActivarLicencia; 
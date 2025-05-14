import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Snackbar,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

function Licencias() {
  const [licencias, setLicencias] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [licenciaActual, setLicenciaActual] = useState({
    tipo: 'trial',
    max_usuarios: 1,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [licenciaGenerada, setLicenciaGenerada] = useState(null);

  useEffect(() => {
    // Aquí se implementará la lógica para obtener las licencias del backend
    // Por ahora usamos datos de ejemplo
    setLicencias([
      {
        id: 1,
        codigo: 'XXXX-XXXX-XXXX-XXXX',
        tipo: 'trial',
        fecha_inicio: '2024-03-15',
        fecha_fin: '2024-04-15',
        max_usuarios: 1,
        usuarios_activos: 1,
        estado: 'activa',
      },
      {
        id: 2,
        codigo: 'YYYY-YYYY-YYYY-YYYY',
        tipo: 'full',
        fecha_inicio: '2024-03-15',
        fecha_fin: '2025-03-15',
        max_usuarios: 5,
        usuarios_activos: 3,
        estado: 'activa',
      },
    ]);
  }, []);

  const handleOpenDialog = () => {
    setLicenciaActual({
      tipo: 'trial',
      max_usuarios: 1,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLicenciaActual((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/licencias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(licenciaActual),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `licencia_${licenciaActual.tipo}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setSnackbar({
          open: true,
          message: 'Licencia generada exitosamente',
          severity: 'success',
        });
        handleCloseDialog();
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al generar la licencia',
        severity: 'error',
      });
    }
  };

  const getEstadoChip = (estado) => {
    const estados = {
      activa: { color: 'success', label: 'Activa' },
      expirada: { color: 'error', label: 'Expirada' },
      bloqueada: { color: 'warning', label: 'Bloqueada' },
    };

    const estadoInfo = estados[estado] || { color: 'default', label: estado };

    return (
      <Chip
        label={estadoInfo.label}
        color={estadoInfo.color}
        size="small"
      />
    );
  };

  const getTipoChip = (tipo) => {
    const tipos = {
      trial: { color: 'info', label: 'Prueba' },
      full: { color: 'primary', label: 'Completa' },
    };

    const tipoInfo = tipos[tipo] || { color: 'default', label: tipo };

    return (
      <Chip
        label={tipoInfo.label}
        color={tipoInfo.color}
        size="small"
      />
    );
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Gestión de Licencias</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Generar Licencia
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Resumen de Licencias */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Licencias Activas
              </Typography>
              <Typography variant="h3">
                {licencias.filter(l => l.estado === 'activa').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Licencias de Prueba
              </Typography>
              <Typography variant="h3">
                {licencias.filter(l => l.tipo === 'trial').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Licencias Completas
              </Typography>
              <Typography variant="h3">
                {licencias.filter(l => l.tipo === 'full').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Tabla de Licencias */}
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Fecha Inicio</TableCell>
                  <TableCell>Fecha Fin</TableCell>
                  <TableCell>Usuarios</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {licencias.map((licencia) => (
                  <TableRow key={licencia.id}>
                    <TableCell>{licencia.codigo}</TableCell>
                    <TableCell>{getTipoChip(licencia.tipo)}</TableCell>
                    <TableCell>{new Date(licencia.fecha_inicio).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(licencia.fecha_fin).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {licencia.usuarios_activos} / {licencia.max_usuarios}
                    </TableCell>
                    <TableCell>{getEstadoChip(licencia.estado)}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => {
                          navigator.clipboard.writeText(licencia.codigo);
                          setSnackbar({
                            open: true,
                            message: 'Código copiado al portapapeles',
                            severity: 'success',
                          });
                        }}
                      >
                        <CopyIcon />
                      </IconButton>
                      <IconButton
                        color="primary"
                        onClick={() => {
                          // Implementar descarga de archivo de licencia
                        }}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Diálogo para generar licencia */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Generar Nueva Licencia</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Tipo de Licencia</InputLabel>
            <Select
              name="tipo"
              value={licenciaActual.tipo}
              onChange={handleInputChange}
              label="Tipo de Licencia"
            >
              <MenuItem value="trial">Prueba (30 días)</MenuItem>
              <MenuItem value="full">Completa (365 días)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            name="max_usuarios"
            label="Máximo de Usuarios"
            type="number"
            fullWidth
            value={licenciaActual.max_usuarios}
            onChange={handleInputChange}
            disabled={licenciaActual.tipo === 'trial'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            Generar
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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Licencias; 
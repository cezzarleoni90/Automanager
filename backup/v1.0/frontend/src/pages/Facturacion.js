import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

function Facturacion() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h4" gutterBottom>
          Gestión de Facturación
        </Typography>
        <Typography variant="body1">
          Módulo en desarrollo. Próximamente disponible.
        </Typography>
      </Paper>
    </Container>
  );
}

export default Facturacion; 
import React from 'react';
import { Container, Typography, Grid, Paper, Box } from '@mui/material';

const Dashboard = () => {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Dashboard
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper
                        sx={{
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            height: 240,
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            Resumen de Actividad
                        </Typography>
                        {/* TODO: Agregar gráficos o estadísticas */}
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper
                        sx={{
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            height: 240,
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            Alertas
                        </Typography>
                        {/* TODO: Agregar alertas importantes */}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Dashboard; 
import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Collapse,
    Chip,
    Button,
    Alert
} from '@mui/material';
import {
    Warning as WarningIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { inventarioService } from '../services/inventarioService';
import { useAuth } from '../contexts/AuthContext';

const AlertasStock = ({ onNuevoMovimiento }) => {
    const [alertas, setAlertas] = useState([]);
    const [expanded, setExpanded] = useState(true);
    const [error, setError] = useState(null);
    const { isAuthenticated } = useAuth();

    const fetchAlertas = async () => {
        if (!isAuthenticated()) {
            setAlertas([]);
            return;
        }

        try {
            setError(null);
            const response = await inventarioService.getRepuestos({
                stockBajo: true
            });
            setAlertas(response.data);
        } catch (error) {
            console.error('Error al cargar alertas:', error);
            setError('No se pudieron cargar las alertas de stock');
            setAlertas([]);
        }
    };

    useEffect(() => {
        fetchAlertas();
        // Actualizar alertas cada 5 minutos
        const interval = setInterval(fetchAlertas, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const handleToggleExpand = () => {
        setExpanded(!expanded);
    };

    const handleNuevoMovimiento = (repuesto) => {
        if (onNuevoMovimiento) {
            onNuevoMovimiento(repuesto);
        }
    };

    if (!isAuthenticated() || (alertas.length === 0 && !error)) {
        return null;
    }

    return (
        <Paper
            sx={{
                position: 'fixed',
                bottom: 20,
                right: 20,
                width: 350,
                maxHeight: 400,
                overflow: 'hidden',
                zIndex: 1000,
                boxShadow: 3
            }}
        >
            <Box
                sx={{
                    p: 2,
                    bgcolor: error ? 'error.main' : 'warning.main',
                    color: 'error.contrastText',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <WarningIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">
                        {error ? 'Error' : 'Alertas de Stock'}
                    </Typography>
                </Box>
                <IconButton
                    size="small"
                    onClick={handleToggleExpand}
                    sx={{ color: 'inherit' }}
                >
                    {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
            </Box>

            <Collapse in={expanded}>
                {error ? (
                    <Box sx={{ p: 2 }}>
                        <Alert severity="error">{error}</Alert>
                    </Box>
                ) : (
                    <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {alertas.map((repuesto) => (
                            <ListItem
                                key={repuesto.id}
                                divider
                                secondaryAction={
                                    <Button
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={() => handleNuevoMovimiento(repuesto)}
                                    >
                                        Reponer
                                    </Button>
                                }
                            >
                                <ListItemIcon>
                                    <WarningIcon color="error" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={repuesto.nombre}
                                    secondary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" component="span">
                                                Stock actual:
                                            </Typography>
                                            <Chip
                                                label={repuesto.stock}
                                                size="small"
                                                color="error"
                                            />
                                            <Typography variant="body2" component="span">
                                                Mínimo:
                                            </Typography>
                                            <Chip
                                                label={repuesto.stock_minimo}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Collapse>
        </Paper>
    );
};

export default AlertasStock; 
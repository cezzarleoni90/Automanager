import React from 'react';
import { Chip, Grid, Typography } from '@mui/material';
import EntityManager from './EntityManager';
import { 
    ESTADOS_SERVICIO,
    COLORES_ESTADO,
    ETIQUETAS_ESTADO,
    TIPOS_SERVICIO,
    API_CONFIG,
    MENSAJES_ERROR
} from '../../utils/constants';
import { formatearNumero } from '../../utils/tableUtils';

const ServicioManager = () => {
    const columnas = [
        { id: 'id', label: 'ID' },
        { id: 'tipo', label: 'Tipo' },
        { id: 'descripcion', label: 'Descripción' },
        { id: 'estado', label: 'Estado' },
        { id: 'fecha_inicio', label: 'Fecha Inicio' },
        { id: 'honorarios', label: 'Honorarios' },
        { id: 'acciones', label: 'Acciones' }
    ];

    const renderRow = (servicio) => (
        <TableRow key={servicio.id}>
            <TableCell>{servicio.id}</TableCell>
            <TableCell>{servicio.tipo}</TableCell>
            <TableCell>{servicio.descripcion}</TableCell>
            <TableCell>
                <Chip
                    label={ETIQUETAS_ESTADO[servicio.estado]}
                    style={{ backgroundColor: COLORES_ESTADO[servicio.estado] }}
                    className={classes.statusChip}
                />
            </TableCell>
            <TableCell>
                {new Date(servicio.fecha_inicio).toLocaleDateString('es-ES')}
            </TableCell>
            <TableCell>{formatearNumero(servicio.honorarios)}</TableCell>
            <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Ver detalles">
                        <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(servicio)}
                        >
                            <VisibilityIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                        <IconButton
                            size="small"
                            onClick={() => handleEdit(servicio)}
                        >
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                        <IconButton
                            size="small"
                            onClick={() => handleDelete(servicio)}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </TableCell>
        </TableRow>
    );

    const renderDetailContent = (servicio) => (
        <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Tipo:</Typography>
                <Typography>{servicio.tipo}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Estado:</Typography>
                <Chip
                    label={ETIQUETAS_ESTADO[servicio.estado]}
                    style={{ backgroundColor: COLORES_ESTADO[servicio.estado] }}
                    className={classes.statusChip}
                />
            </Grid>
            <Grid item xs={12}>
                <Typography variant="subtitle1">Descripción:</Typography>
                <Typography>{servicio.descripcion}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Fecha Inicio:</Typography>
                <Typography>
                    {new Date(servicio.fecha_inicio).toLocaleDateString('es-ES')}
                </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Honorarios:</Typography>
                <Typography>{formatearNumero(servicio.honorarios)}</Typography>
            </Grid>
        </Grid>
    );

    const customFilters = [
        {
            name: 'estado',
            label: 'Estado',
            options: Object.entries(ETIQUETAS_ESTADO).map(([value, label]) => ({
                value,
                label
            }))
        },
        {
            name: 'tipo',
            label: 'Tipo',
            options: Object.entries(TIPOS_SERVICIO).map(([value, label]) => ({
                value,
                label
            }))
        }
    ];

    return (
        <EntityManager
            title="Gestión de Servicios"
            columns={columnas}
            fetchData={() => {}}
            onDelete={() => {}}
            renderRow={renderRow}
            customFilters={customFilters}
            searchFields={['descripcion', 'tipo']}
            renderDetailContent={renderDetailContent}
            API_CONFIG={API_CONFIG}
            MENSAJES_ERROR={MENSAJES_ERROR}
        />
    );
};

export default ServicioManager; 
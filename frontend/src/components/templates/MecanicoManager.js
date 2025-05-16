import React from 'react';
import { Chip, Grid, Typography } from '@mui/material';
import EntityManager from './EntityManager';
import { 
    ESTADOS_MECANICO,
    COLORES_ESTADO,
    ETIQUETAS_ESTADO,
    API_CONFIG,
    MENSAJES_ERROR
} from '../../utils/constants';

const MecanicoManager = () => {
    const columnas = [
        { id: 'id', label: 'ID' },
        { id: 'nombre', label: 'Nombre' },
        { id: 'especialidad', label: 'Especialidad' },
        { id: 'estado', label: 'Estado' },
        { id: 'fecha_contratacion', label: 'Fecha Contratación' },
        { id: 'acciones', label: 'Acciones' }
    ];

    const renderRow = (mecanico) => (
        <TableRow key={mecanico.id}>
            <TableCell>{mecanico.id}</TableCell>
            <TableCell>{mecanico.nombre}</TableCell>
            <TableCell>{mecanico.especialidad}</TableCell>
            <TableCell>
                <Chip
                    label={ETIQUETAS_ESTADO[mecanico.estado]}
                    style={{ backgroundColor: COLORES_ESTADO[mecanico.estado] }}
                    className={classes.statusChip}
                />
            </TableCell>
            <TableCell>
                {new Date(mecanico.fecha_contratacion).toLocaleDateString('es-ES')}
            </TableCell>
            <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Ver detalles">
                        <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(mecanico)}
                        >
                            <VisibilityIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                        <IconButton
                            size="small"
                            onClick={() => handleEdit(mecanico)}
                        >
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                        <IconButton
                            size="small"
                            onClick={() => handleDelete(mecanico)}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </TableCell>
        </TableRow>
    );

    const renderDetailContent = (mecanico) => (
        <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Nombre:</Typography>
                <Typography>{mecanico.nombre}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Estado:</Typography>
                <Chip
                    label={ETIQUETAS_ESTADO[mecanico.estado]}
                    style={{ backgroundColor: COLORES_ESTADO[mecanico.estado] }}
                    className={classes.statusChip}
                />
            </Grid>
            <Grid item xs={12}>
                <Typography variant="subtitle1">Especialidad:</Typography>
                <Typography>{mecanico.especialidad}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Fecha Contratación:</Typography>
                <Typography>
                    {new Date(mecanico.fecha_contratacion).toLocaleDateString('es-ES')}
                </Typography>
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
        }
    ];

    return (
        <EntityManager
            title="Gestión de Mecánicos"
            columns={columnas}
            fetchData={() => {}}
            onDelete={() => {}}
            renderRow={renderRow}
            customFilters={customFilters}
            searchFields={['nombre', 'especialidad']}
            renderDetailContent={renderDetailContent}
            API_CONFIG={API_CONFIG}
            MENSAJES_ERROR={MENSAJES_ERROR}
        />
    );
};

export default MecanicoManager; 
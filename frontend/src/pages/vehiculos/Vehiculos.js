import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Box, Chip, Alert, Snackbar, Tooltip } from '@mui/material';
import BaseModuleTemplate from '../../components/BaseModuleTemplate';
import { vehiculoService } from '../../services/vehiculo';
import config from '../../config';

const Vehiculos = () => {
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    const queryClient = useQueryClient();

    // Obtener vehículos con react-query
    const { data: vehiculos, isLoading, error } = useQuery(
        'vehiculos',
        () => vehiculoService.getAll(),
        {
            staleTime: config.CACHE_TIME.SHORT,
            cacheTime: config.CACHE_TIME.MEDIUM,
            retry: 3,
            onError: (error) => {
                setNotification({
                    open: true,
                    message: 'Error al cargar los vehículos: ' + error.message,
                    severity: 'error'
                });
            }
        }
    );

    // Obtener historial de cambios
    const { data: historial } = useQuery(
        ['historial', selectedItem?.id],
        () => vehiculoService.getHistorial(selectedItem?.id),
        {
            enabled: !!selectedItem,
            staleTime: config.CACHE_TIME.SHORT,
            cacheTime: config.CACHE_TIME.MEDIUM,
            onError: (error) => {
                setNotification({
                    open: true,
                    message: 'Error al cargar el historial: ' + error.message,
                    severity: 'error'
                });
            }
        }
    );

    // Columnas de la tabla principal
    const columns = [
        { 
            field: 'placa', 
            headerName: 'Placa', 
            width: 130,
            renderCell: (params) => (
                <Box sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{params.value}</Box>
            )
        },
        { 
            field: 'marca', 
            headerName: 'Marca', 
            width: 150,
            renderCell: (params) => (
                <Box sx={{ fontWeight: 'medium' }}>{params.value}</Box>
            )
        },
        { 
            field: 'modelo', 
            headerName: 'Modelo', 
            width: 150,
            renderCell: (params) => (
                <Box sx={{ fontWeight: 'medium' }}>{params.value}</Box>
            )
        },
        { 
            field: 'anio', 
            headerName: 'Año', 
            width: 100,
            renderCell: (params) => (
                <Box sx={{ fontFamily: 'monospace' }}>{params.value}</Box>
            )
        },
        { 
            field: 'color', 
            headerName: 'Color', 
            width: 120,
            renderCell: (params) => (
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: 1
                }}>
                    <Box sx={{ 
                        width: 16, 
                        height: 16, 
                        borderRadius: '50%', 
                        backgroundColor: params.value,
                        border: '1px solid #ccc'
                    }} />
                    {params.value}
                </Box>
            )
        },
        { 
            field: 'estado', 
            headerName: 'Estado', 
            width: 130,
            renderCell: (params) => (
                <Chip 
                    label={params.value} 
                    color={
                        params.value === config.VEHICULO_ESTADOS.ACTIVO ? 'success' :
                        params.value === config.VEHICULO_ESTADOS.EN_SERVICIO ? 'warning' :
                        params.value === config.VEHICULO_ESTADOS.INACTIVO ? 'error' :
                        'default'
                    }
                    size="small"
                />
            )
        },
        { 
            field: 'ultimo_servicio', 
            headerName: 'Último Servicio', 
            width: 180,
            valueFormatter: (params) => {
                return params.value ? new Date(params.value).toLocaleDateString() : 'N/A';
            }
        },
        { 
            field: 'proximo_servicio', 
            headerName: 'Próximo Servicio', 
            width: 180,
            valueFormatter: (params) => {
                return params.value ? new Date(params.value).toLocaleDateString() : 'N/A';
            }
        }
    ];

    // Campos del formulario
    const formFields = [
        { 
            name: 'placa', 
            label: 'Placa', 
            type: 'text', 
            required: true,
            validation: {
                pattern: '^[A-Z0-9-]+$',
                message: 'Solo letras mayúsculas, números y guiones'
            }
        },
        { 
            name: 'marca', 
            label: 'Marca', 
            type: 'text', 
            required: true,
            validation: {
                pattern: '^[a-zA-Z\\s-]+$',
                message: 'Solo letras, espacios y guiones'
            }
        },
        { 
            name: 'modelo', 
            label: 'Modelo', 
            type: 'text', 
            required: true
        },
        { 
            name: 'anio', 
            label: 'Año', 
            type: 'number', 
            required: true,
            validation: {
                min: 1900,
                max: new Date().getFullYear() + 1,
                message: `Año entre 1900 y ${new Date().getFullYear() + 1}`
            }
        },
        { 
            name: 'color', 
            label: 'Color', 
            type: 'text', 
            required: true
        },
        { 
            name: 'vin', 
            label: 'VIN', 
            type: 'text',
            validation: {
                pattern: '^[A-HJ-NPR-Z0-9]{17}$',
                message: 'VIN inválido (17 caracteres alfanuméricos)'
            }
        },
        { 
            name: 'estado', 
            label: 'Estado', 
            type: 'select',
            options: Object.entries(config.VEHICULO_ESTADOS).map(([key, value]) => ({
                value,
                label: key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')
            })),
            required: true
        },
        { 
            name: 'tipo_combustible', 
            label: 'Tipo de Combustible', 
            type: 'select',
            options: config.TIPOS_COMBUSTIBLE.map(tipo => ({
                value: tipo,
                label: tipo.charAt(0).toUpperCase() + tipo.slice(1)
            })),
            required: true
        },
        { 
            name: 'kilometraje', 
            label: 'Kilometraje', 
            type: 'number',
            validation: {
                min: 0,
                message: 'El kilometraje debe ser mayor o igual a 0'
            }
        },
        { 
            name: 'ultimo_servicio', 
            label: 'Último Servicio', 
            type: 'date'
        },
        { 
            name: 'proximo_servicio', 
            label: 'Próximo Servicio', 
            type: 'date'
        }
    ];

    // Funciones CRUD
    const handleAdd = async (data) => {
        try {
            await vehiculoService.create(data);
            queryClient.invalidateQueries('vehiculos');
            setNotification({
                open: true,
                message: 'Vehículo agregado exitosamente',
                severity: 'success'
            });
        } catch (error) {
            setNotification({
                open: true,
                message: 'Error al agregar el vehículo: ' + error.message,
                severity: 'error'
            });
        }
    };

    const handleEdit = async (data) => {
        try {
            await vehiculoService.update(selectedItem.id, data);
            queryClient.invalidateQueries('vehiculos');
            setNotification({
                open: true,
                message: 'Vehículo actualizado exitosamente',
                severity: 'success'
            });
        } catch (error) {
            setNotification({
                open: true,
                message: 'Error al actualizar el vehículo: ' + error.message,
                severity: 'error'
            });
        }
    };

    const handleDelete = async (id) => {
        try {
            await vehiculoService.delete(id);
            queryClient.invalidateQueries('vehiculos');
            setNotification({
                open: true,
                message: 'Vehículo eliminado exitosamente',
                severity: 'success'
            });
        } catch (error) {
            setNotification({
                open: true,
                message: 'Error al eliminar el vehículo: ' + error.message,
                severity: 'error'
            });
        }
    };

    // Funciones de diálogo
    const handleOpenDialog = (item = null) => {
        setSelectedItem(item);
        setFormData(item || {});
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedItem(null);
        setFormData({});
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <BaseModuleTemplate
            title="Gestión de Vehículos"
            description="Administra los vehículos registrados en el sistema"
            columns={columns}
            data={vehiculos || []}
            isLoading={isLoading}
            error={error}
            formFields={formFields}
            formData={formData}
            openDialog={openDialog}
            selectedItem={selectedItem}
            historial={historial}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onOpenDialog={handleOpenDialog}
            onCloseDialog={handleCloseDialog}
            onInputChange={handleInputChange}
        />
    );
};

export default Vehiculos; 
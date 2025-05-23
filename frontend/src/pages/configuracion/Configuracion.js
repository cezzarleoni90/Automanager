import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Box, Chip, Alert, Snackbar, Tooltip } from '@mui/material';
import BaseModuleTemplate from '../../components/BaseModuleTemplate';
import { configuracionService } from '../../services/configuracion';

const Configuracion = () => {
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    const queryClient = useQueryClient();

    // Obtener configuraciones con react-query
    const { data: configuraciones, isLoading } = useQuery(
        'configuraciones',
        () => configuracionService.getAll(),
        {
            staleTime: 5 * 60 * 1000, // 5 minutos
            cacheTime: 30 * 60 * 1000, // 30 minutos
            retry: 3,
            onError: (error) => {
                setNotification({
                    open: true,
                    message: 'Error al cargar las configuraciones',
                    severity: 'error'
                });
            }
        }
    );

    // Obtener historial de cambios
    const { data: historial } = useQuery(
        ['historial', selectedItem?.id],
        () => configuracionService.getHistorial(selectedItem?.id),
        {
            enabled: !!selectedItem,
            staleTime: 1 * 60 * 1000, // 1 minuto
            cacheTime: 5 * 60 * 1000 // 5 minutos
        }
    );

    // Columnas de la tabla principal
    const columns = [
        { 
            field: 'codigo', 
            headerName: 'Código', 
            width: 130,
            renderCell: (params) => (
                <Box sx={{ fontFamily: 'monospace' }}>{params.value}</Box>
            )
        },
        { 
            field: 'nombre', 
            headerName: 'Nombre', 
            width: 200,
            renderCell: (params) => (
                <Box sx={{ fontWeight: 'medium' }}>{params.value}</Box>
            )
        },
        { 
            field: 'valor', 
            headerName: 'Valor', 
            width: 200,
            renderCell: (params) => {
                try {
                    const value = JSON.parse(params.value);
                    return typeof value === 'object' ? JSON.stringify(value) : params.value;
                } catch {
                    return params.value;
                }
            }
        },
        { 
            field: 'descripcion', 
            headerName: 'Descripción', 
            width: 250,
            renderCell: (params) => (
                <Box sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {params.value}
                </Box>
            )
        },
        { 
            field: 'tipo', 
            headerName: 'Tipo', 
            width: 130,
            renderCell: (params) => (
                <Chip 
                    label={params.value} 
                    color={
                        params.value === 'sistema' ? 'error' :
                        params.value === 'negocio' ? 'primary' :
                        'success'
                    }
                    size="small"
                />
            )
        },
        { 
            field: 'categoria', 
            headerName: 'Categoría', 
            width: 150,
            renderCell: (params) => (
                <Chip 
                    label={params.value} 
                    color="info"
                    size="small"
                />
            )
        },
        { 
            field: 'estado', 
            headerName: 'Estado', 
            width: 130,
            renderCell: (params) => (
                <Chip 
                    label={params.value} 
                    color={params.value === 'activo' ? 'success' : 'error'}
                    size="small"
                />
            )
        }
    ];

    // Campos del formulario
    const formFields = [
        { 
            name: 'nombre', 
            label: 'Nombre', 
            type: 'text', 
            required: true,
            validation: {
                pattern: '^[a-zA-Z0-9_\\s-]+$',
                message: 'Solo letras, números, guiones y espacios'
            }
        },
        { 
            name: 'valor', 
            label: 'Valor', 
            type: 'text', 
            required: true,
            tooltip: 'Valor de la configuración'
        },
        { 
            name: 'descripcion', 
            label: 'Descripción', 
            type: 'textarea',
            validation: {
                maxLength: 500,
                message: 'Máximo 500 caracteres'
            }
        },
        { 
            name: 'tipo', 
            label: 'Tipo', 
            type: 'select',
            options: [
                { value: 'sistema', label: 'Sistema' },
                { value: 'negocio', label: 'Negocio' },
                { value: 'usuario', label: 'Usuario' }
            ],
            required: true,
            tooltip: 'Tipo de configuración'
        },
        { 
            name: 'categoria', 
            label: 'Categoría', 
            type: 'text',
            required: true,
            tooltip: 'Categoría de la configuración'
        },
        { 
            name: 'estado', 
            label: 'Estado', 
            type: 'select',
            options: [
                { value: 'activo', label: 'Activo' },
                { value: 'inactivo', label: 'Inactivo' }
            ],
            required: true
        },
        { 
            name: 'es_editable', 
            label: 'Editable', 
            type: 'checkbox',
            tooltip: 'Indica si el valor puede ser modificado'
        },
        { 
            name: 'es_visible', 
            label: 'Visible', 
            type: 'checkbox',
            tooltip: 'Indica si la configuración es visible en la interfaz'
        },
        { 
            name: 'valor_default', 
            label: 'Valor por Defecto', 
            type: 'text',
            tooltip: 'Valor predeterminado de la configuración'
        },
        { 
            name: 'opciones', 
            label: 'Opciones', 
            type: 'json',
            defaultValue: {},
            tooltip: 'Opciones adicionales en formato JSON'
        },
        { 
            name: 'validacion', 
            label: 'Validación', 
            type: 'json',
            defaultValue: {},
            tooltip: 'Reglas de validación en formato JSON'
        },
        { 
            name: 'notas', 
            label: 'Notas', 
            type: 'textarea',
            tooltip: 'Información adicional sobre la configuración'
        }
    ];

    // Columnas del historial
    const historialColumns = [
        { 
            field: 'fecha', 
            headerName: 'Fecha', 
            width: 180,
            valueFormatter: (params) => {
                return new Date(params.value).toLocaleString();
            }
        },
        { 
            field: 'tipo_cambio', 
            headerName: 'Tipo de Cambio', 
            width: 150,
            renderCell: (params) => (
                <Chip 
                    label={params.value} 
                    color={
                        params.value === 'creacion' ? 'success' :
                        params.value === 'actualizacion' ? 'primary' :
                        params.value === 'eliminacion' ? 'error' :
                        'default'
                    }
                    size="small"
                />
            )
        },
        { 
            field: 'descripcion', 
            headerName: 'Descripción', 
            width: 300,
            renderCell: (params) => (
                <Box sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {params.value}
                </Box>
            )
        },
        { 
            field: 'valor_anterior', 
            headerName: 'Valor Anterior', 
            width: 200,
            renderCell: (params) => {
                try {
                    const value = JSON.parse(params.value);
                    return typeof value === 'object' ? JSON.stringify(value) : params.value;
                } catch {
                    return params.value;
                }
            }
        },
        { 
            field: 'valor_nuevo', 
            headerName: 'Valor Nuevo', 
            width: 200,
            renderCell: (params) => {
                try {
                    const value = JSON.parse(params.value);
                    return typeof value === 'object' ? JSON.stringify(value) : params.value;
                } catch {
                    return params.value;
                }
            }
        },
        { 
            field: 'usuario', 
            headerName: 'Usuario', 
            width: 150,
            renderCell: (params) => (
                <Box sx={{ fontFamily: 'monospace' }}>{params.value}</Box>
            )
        }
    ];

    // Funciones CRUD
    const handleAdd = async (data) => {
        try {
            await configuracionService.create(data);
            queryClient.invalidateQueries('configuraciones');
            setNotification({
                open: true,
                message: 'Configuración creada exitosamente',
                severity: 'success'
            });
        } catch (error) {
            setNotification({
                open: true,
                message: 'Error al crear la configuración',
                severity: 'error'
            });
        }
    };

    const handleEdit = async (data) => {
        try {
            await configuracionService.update(selectedItem.id, data);
            queryClient.invalidateQueries('configuraciones');
            setNotification({
                open: true,
                message: 'Configuración actualizada exitosamente',
                severity: 'success'
            });
        } catch (error) {
            setNotification({
                open: true,
                message: 'Error al actualizar la configuración',
                severity: 'error'
            });
        }
    };

    const handleDelete = async (id) => {
        try {
            await configuracionService.delete(id);
            queryClient.invalidateQueries('configuraciones');
            setNotification({
                open: true,
                message: 'Configuración eliminada exitosamente',
                severity: 'success'
            });
        } catch (error) {
            setNotification({
                open: true,
                message: 'Error al eliminar la configuración',
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
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    return (
        <>
            <BaseModuleTemplate
                title="Configuración"
                description="Gestión de configuraciones del sistema"
                columns={columns}
                data={configuraciones || []}
                loading={isLoading}
                formFields={formFields}
                formData={formData}
                openDialog={openDialog}
                selectedItem={selectedItem}
                historialColumns={historialColumns}
                historialData={historial || []}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onOpenDialog={handleOpenDialog}
                onCloseDialog={handleCloseDialog}
                onInputChange={handleInputChange}
            />
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={() => setNotification(prev => ({ ...prev, open: false }))}
            >
                <Alert 
                    onClose={() => setNotification(prev => ({ ...prev, open: false }))} 
                    severity={notification.severity}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default Configuracion; 
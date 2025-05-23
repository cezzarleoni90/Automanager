import React, { useState } from 'react';
import { Box, Chip } from '@mui/material';
import { useQuery, useQueryClient } from 'react-query';
import BaseModuleTemplate from '../../templates/BaseModuleTemplate';

const Mecanicos = () => {
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({});
    const queryClient = useQueryClient();

    // Cargar datos de mecánicos
    const { data: mecanicos = [], isLoading } = useQuery('mecanicos', async () => {
        const response = await fetch('/api/mecanicos');
        const data = await response.json();
        return data;
    });

    // Cargar historial de mecánicos
    const { data: historial = [] } = useQuery(
        ['historial-mecanico', selectedItem?.id],
        async () => {
            if (!selectedItem?.id) return [];
            const response = await fetch(`/api/mecanicos/${selectedItem.id}/historial`);
            const data = await response.json();
            return data;
        },
        {
            enabled: !!selectedItem?.id
        }
    );

    // Configuración de columnas para la tabla
    const columns = [
        { field: 'codigo', label: 'Código' },
        { field: 'nombre', label: 'Nombre' },
        { field: 'apellido', label: 'Apellido' },
        { field: 'especialidad', label: 'Especialidad' },
        { 
            field: 'estado', 
            label: 'Estado',
            render: (item) => (
                <Chip
                    label={item.estado}
                    color={item.estado === 'activo' ? 'success' : 'error'}
                    size="small"
                />
            )
        },
        { 
            field: 'servicios_activos', 
            label: 'Servicios Activos',
            render: (item) => (
                <Chip
                    label={item.servicios_activos || 0}
                    color={item.servicios_activos > 0 ? 'warning' : 'default'}
                    size="small"
                />
            )
        }
    ];

    // Configuración de campos del formulario
    const formFields = [
        {
            name: 'nombre',
            label: 'Nombre',
            required: true
        },
        {
            name: 'apellido',
            label: 'Apellido',
            required: true
        },
        {
            name: 'especialidad',
            label: 'Especialidad',
            required: true
        },
        {
            name: 'email',
            label: 'Email',
            type: 'email',
            required: true
        },
        {
            name: 'telefono',
            label: 'Teléfono',
            required: true
        },
        {
            name: 'estado',
            label: 'Estado',
            type: 'select',
            required: true,
            options: [
                { value: 'activo', label: 'Activo' },
                { value: 'inactivo', label: 'Inactivo' }
            ]
        },
        {
            name: 'horario',
            label: 'Horario',
            required: true
        },
        {
            name: 'observaciones',
            label: 'Observaciones',
            multiline: true,
            rows: 3
        }
    ];

    // Configuración de columnas para el historial
    const historyColumns = [
        { field: 'fecha', label: 'Fecha' },
        { field: 'tipo', label: 'Tipo' },
        { field: 'descripcion', label: 'Descripción' },
        { field: 'servicio_id', label: 'ID Servicio' }
    ];

    // Función para manejar la creación de mecánicos
    const handleAdd = async (data) => {
        try {
            const response = await fetch('/api/mecanicos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            const newItem = await response.json();
            queryClient.invalidateQueries('mecanicos');
            return newItem;
        } catch (error) {
            console.error('Error al crear mecánico:', error);
            throw error;
        }
    };

    // Función para manejar la edición de mecánicos
    const handleEdit = async (id, data) => {
        try {
            const response = await fetch(`/api/mecanicos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            const updatedItem = await response.json();
            queryClient.invalidateQueries('mecanicos');
            return updatedItem;
        } catch (error) {
            console.error('Error al editar mecánico:', error);
            throw error;
        }
    };

    // Función para manejar la eliminación de mecánicos
    const handleDelete = async (id) => {
        try {
            await fetch(`/api/mecanicos/${id}`, {
                method: 'DELETE',
            });
            queryClient.invalidateQueries('mecanicos');
        } catch (error) {
            console.error('Error al eliminar mecánico:', error);
            throw error;
        }
    };

    // Función para abrir el diálogo
    const handleOpenDialog = (item = null) => {
        if (item) {
            setSelectedItem(item);
            setFormData(item);
        } else {
            setSelectedItem(null);
            setFormData({});
        }
        setOpenDialog(true);
    };

    // Función para cerrar el diálogo
    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedItem(null);
        setFormData({});
    };

    // Función para manejar cambios en los campos del formulario
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <Box>
            <BaseModuleTemplate
                title="Gestión de Mecánicos"
                columns={columns}
                formFields={formFields}
                data={mecanicos}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewHistory={true}
                historyColumns={historyColumns}
                historyData={historial}
                openDialog={openDialog}
                handleOpenDialog={handleOpenDialog}
                handleCloseDialog={handleCloseDialog}
                handleInputChange={handleInputChange}
                selectedItem={selectedItem}
                setSelectedItem={setSelectedItem}
                formData={formData}
            />
        </Box>
    );
};

export default Mecanicos; 
import React, { useState } from 'react';
import { Box, Chip } from '@mui/material';
import { useQuery, useQueryClient } from 'react-query';
import BaseModuleTemplate from '../../templates/BaseModuleTemplate';

const Clientes = () => {
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({});
    const queryClient = useQueryClient();

    // Cargar datos de clientes
    const { data: clientes = [], isLoading } = useQuery('clientes', async () => {
        const response = await fetch('/api/clientes');
        const data = await response.json();
        return data;
    });

    // Cargar historial de clientes
    const { data: historial = [] } = useQuery(
        ['historial', selectedItem?.id],
        async () => {
            if (!selectedItem?.id) return [];
            const response = await fetch(`/api/clientes/${selectedItem.id}/historial`);
            const data = await response.json();
            return data;
        },
        {
            enabled: !!selectedItem?.id
        }
    );

    // Configuración de columnas para la tabla
    const columns = [
        { field: 'nombre', label: 'Nombre' },
        { field: 'apellido', label: 'Apellido' },
        { field: 'email', label: 'Email' },
        { field: 'telefono', label: 'Teléfono' },
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
            name: 'direccion',
            label: 'Dirección',
            multiline: true,
            rows: 2
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
        }
    ];

    // Configuración de columnas para el historial
    const historyColumns = [
        { field: 'fecha', label: 'Fecha' },
        { field: 'tipo', label: 'Tipo' },
        { field: 'descripcion', label: 'Descripción' }
    ];

    // Función para manejar la creación de clientes
    const handleAdd = async (data) => {
        try {
            const response = await fetch('/api/clientes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            const newItem = await response.json();
            queryClient.invalidateQueries('clientes');
            return newItem;
        } catch (error) {
            console.error('Error al crear cliente:', error);
            throw error;
        }
    };

    // Función para manejar la edición de clientes
    const handleEdit = async (id, data) => {
        try {
            const response = await fetch(`/api/clientes/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            const updatedItem = await response.json();
            queryClient.invalidateQueries('clientes');
            return updatedItem;
        } catch (error) {
            console.error('Error al editar cliente:', error);
            throw error;
        }
    };

    // Función para manejar la eliminación de clientes
    const handleDelete = async (id) => {
        try {
            await fetch(`/api/clientes/${id}`, {
                method: 'DELETE',
            });
            queryClient.invalidateQueries('clientes');
        } catch (error) {
            console.error('Error al eliminar cliente:', error);
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
                title="Gestión de Clientes"
                columns={columns}
                formFields={formFields}
                data={clientes}
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

export default Clientes; 
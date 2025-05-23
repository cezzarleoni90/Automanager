import React, { useState } from 'react';
import { Box, Chip } from '@mui/material';
import { useQuery, useQueryClient } from 'react-query';
import BaseModuleTemplate from '../../templates/BaseModuleTemplate';

const Calendario = () => {
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({});
    const queryClient = useQueryClient();

    // Cargar datos de eventos
    const { data: eventos = [], isLoading } = useQuery('eventos', async () => {
        const response = await fetch('/api/eventos');
        const data = await response.json();
        return data;
    });

    // Cargar datos de mecánicos para el selector
    const { data: mecanicos = [] } = useQuery('mecanicos', async () => {
        const response = await fetch('/api/mecanicos');
        const data = await response.json();
        return data;
    });

    // Cargar historial de eventos
    const { data: historial = [] } = useQuery(
        ['historial-evento', selectedItem?.id],
        async () => {
            if (!selectedItem?.id) return [];
            const response = await fetch(`/api/eventos/${selectedItem.id}/historial`);
            const data = await response.json();
            return data;
        },
        {
            enabled: !!selectedItem?.id
        }
    );

    // Configuración de columnas para la tabla
    const columns = [
        { field: 'titulo', label: 'Título' },
        { field: 'fecha_inicio', label: 'Fecha Inicio' },
        { field: 'fecha_fin', label: 'Fecha Fin' },
        { 
            field: 'mecanico', 
            label: 'Mecánico',
            render: (item) => `${item.mecanico?.nombre} ${item.mecanico?.apellido}`
        },
        { 
            field: 'tipo', 
            label: 'Tipo',
            render: (item) => (
                <Chip
                    label={item.tipo}
                    color={
                        item.tipo === 'servicio' ? 'primary' :
                        item.tipo === 'mantenimiento' ? 'warning' :
                        item.tipo === 'reunion' ? 'info' : 'default'
                    }
                    size="small"
                />
            )
        },
        { 
            field: 'estado', 
            label: 'Estado',
            render: (item) => (
                <Chip
                    label={item.estado}
                    color={
                        item.estado === 'completado' ? 'success' :
                        item.estado === 'en_proceso' ? 'warning' :
                        item.estado === 'cancelado' ? 'error' : 'default'
                    }
                    size="small"
                />
            )
        }
    ];

    // Configuración de campos del formulario
    const formFields = [
        {
            name: 'titulo',
            label: 'Título',
            required: true
        },
        {
            name: 'tipo',
            label: 'Tipo',
            type: 'select',
            required: true,
            options: [
                { value: 'servicio', label: 'Servicio' },
                { value: 'mantenimiento', label: 'Mantenimiento' },
                { value: 'reunion', label: 'Reunión' }
            ]
        },
        {
            name: 'mecanico_id',
            label: 'Mecánico',
            type: 'select',
            required: true,
            options: mecanicos.map(mecanico => ({
                value: mecanico.id,
                label: `${mecanico.nombre} ${mecanico.apellido}`
            }))
        },
        {
            name: 'fecha_inicio',
            label: 'Fecha Inicio',
            type: 'datetime-local',
            required: true
        },
        {
            name: 'fecha_fin',
            label: 'Fecha Fin',
            type: 'datetime-local',
            required: true
        },
        {
            name: 'estado',
            label: 'Estado',
            type: 'select',
            required: true,
            options: [
                { value: 'pendiente', label: 'Pendiente' },
                { value: 'en_proceso', label: 'En Proceso' },
                { value: 'completado', label: 'Completado' },
                { value: 'cancelado', label: 'Cancelado' }
            ]
        },
        {
            name: 'descripcion',
            label: 'Descripción',
            multiline: true,
            rows: 3,
            required: true
        },
        {
            name: 'ubicacion',
            label: 'Ubicación'
        },
        {
            name: 'notas',
            label: 'Notas',
            multiline: true,
            rows: 3
        }
    ];

    // Configuración de columnas para el historial
    const historyColumns = [
        { field: 'fecha', label: 'Fecha' },
        { field: 'tipo', label: 'Tipo' },
        { field: 'descripcion', label: 'Descripción' },
        { field: 'usuario', label: 'Usuario' }
    ];

    // Función para manejar la creación de eventos
    const handleAdd = async (data) => {
        try {
            const response = await fetch('/api/eventos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            const newItem = await response.json();
            queryClient.invalidateQueries('eventos');
            return newItem;
        } catch (error) {
            console.error('Error al crear evento:', error);
            throw error;
        }
    };

    // Función para manejar la edición de eventos
    const handleEdit = async (id, data) => {
        try {
            const response = await fetch(`/api/eventos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            const updatedItem = await response.json();
            queryClient.invalidateQueries('eventos');
            return updatedItem;
        } catch (error) {
            console.error('Error al editar evento:', error);
            throw error;
        }
    };

    // Función para manejar la eliminación de eventos
    const handleDelete = async (id) => {
        try {
            await fetch(`/api/eventos/${id}`, {
                method: 'DELETE',
            });
            queryClient.invalidateQueries('eventos');
        } catch (error) {
            console.error('Error al eliminar evento:', error);
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
                title="Gestión de Calendario"
                columns={columns}
                formFields={formFields}
                data={eventos}
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

export default Calendario; 
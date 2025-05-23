import React, { useState } from 'react';
import { Box, Chip } from '@mui/material';
import { useQuery, useQueryClient } from 'react-query';
import BaseModuleTemplate from '../../templates/BaseModuleTemplate';

const Servicios = () => {
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({});
    const queryClient = useQueryClient();

    // Cargar datos de servicios
    const { data: servicios = [], isLoading } = useQuery('servicios', async () => {
        const response = await fetch('/api/servicios');
        const data = await response.json();
        return data;
    });

    // Cargar datos de vehículos para el selector
    const { data: vehiculos = [] } = useQuery('vehiculos', async () => {
        const response = await fetch('/api/vehiculos');
        const data = await response.json();
        return data;
    });

    // Cargar datos de mecánicos para el selector
    const { data: mecanicos = [] } = useQuery('mecanicos', async () => {
        const response = await fetch('/api/mecanicos');
        const data = await response.json();
        return data;
    });

    // Cargar historial de servicios
    const { data: historial = [] } = useQuery(
        ['historial-servicio', selectedItem?.id],
        async () => {
            if (!selectedItem?.id) return [];
            const response = await fetch(`/api/servicios/${selectedItem.id}/historial`);
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
        { 
            field: 'vehiculo', 
            label: 'Vehículo',
            render: (item) => `${item.vehiculo?.marca} ${item.vehiculo?.modelo} (${item.vehiculo?.placa})`
        },
        { 
            field: 'mecanico', 
            label: 'Mecánico',
            render: (item) => `${item.mecanico?.nombre} ${item.mecanico?.apellido}`
        },
        { field: 'descripcion', label: 'Descripción' },
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
        },
        { field: 'fecha_inicio', label: 'Fecha Inicio' },
        { field: 'fecha_estimada', label: 'Fecha Estimada' },
        { 
            field: 'costo_estimado', 
            label: 'Costo Estimado',
            render: (item) => `$${item.costo_estimado}`
        }
    ];

    // Configuración de campos del formulario
    const formFields = [
        {
            name: 'vehiculo_id',
            label: 'Vehículo',
            type: 'select',
            required: true,
            options: vehiculos.map(vehiculo => ({
                value: vehiculo.id,
                label: `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placa})`
            }))
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
            name: 'descripcion',
            label: 'Descripción',
            multiline: true,
            rows: 3,
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
            name: 'fecha_inicio',
            label: 'Fecha Inicio',
            type: 'date',
            required: true
        },
        {
            name: 'fecha_estimada',
            label: 'Fecha Estimada',
            type: 'date',
            required: true
        },
        {
            name: 'costo_estimado',
            label: 'Costo Estimado',
            type: 'number',
            required: true
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

    // Función para manejar la creación de servicios
    const handleAdd = async (data) => {
        try {
            const response = await fetch('/api/servicios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            const newItem = await response.json();
            queryClient.invalidateQueries('servicios');
            return newItem;
        } catch (error) {
            console.error('Error al crear servicio:', error);
            throw error;
        }
    };

    // Función para manejar la edición de servicios
    const handleEdit = async (id, data) => {
        try {
            const response = await fetch(`/api/servicios/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            const updatedItem = await response.json();
            queryClient.invalidateQueries('servicios');
            return updatedItem;
        } catch (error) {
            console.error('Error al editar servicio:', error);
            throw error;
        }
    };

    // Función para manejar la eliminación de servicios
    const handleDelete = async (id) => {
        try {
            await fetch(`/api/servicios/${id}`, {
                method: 'DELETE',
            });
            queryClient.invalidateQueries('servicios');
        } catch (error) {
            console.error('Error al eliminar servicio:', error);
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
                title="Gestión de Servicios"
                columns={columns}
                formFields={formFields}
                data={servicios}
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

export default Servicios; 
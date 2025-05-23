import React, { useState } from 'react';
import { Box, Chip } from '@mui/material';
import { useQuery, useQueryClient } from 'react-query';
import BaseModuleTemplate from '../../templates/BaseModuleTemplate';

const Facturacion = () => {
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({});
    const queryClient = useQueryClient();

    // Cargar datos de facturas
    const { data: facturas = [], isLoading } = useQuery('facturas', async () => {
        const response = await fetch('/api/facturas');
        const data = await response.json();
        return data;
    });

    // Cargar datos de clientes para el selector
    const { data: clientes = [] } = useQuery('clientes', async () => {
        const response = await fetch('/api/clientes');
        const data = await response.json();
        return data;
    });

    // Cargar historial de facturas
    const { data: historial = [] } = useQuery(
        ['historial-factura', selectedItem?.id],
        async () => {
            if (!selectedItem?.id) return [];
            const response = await fetch(`/api/facturas/${selectedItem.id}/historial`);
            const data = await response.json();
            return data;
        },
        {
            enabled: !!selectedItem?.id
        }
    );

    // Configuración de columnas para la tabla
    const columns = [
        { field: 'numero', label: 'Número' },
        { field: 'fecha', label: 'Fecha' },
        { 
            field: 'cliente', 
            label: 'Cliente',
            render: (item) => `${item.cliente?.nombre} ${item.cliente?.apellido}`
        },
        { 
            field: 'total', 
            label: 'Total',
            render: (item) => `$${item.total}`
        },
        { 
            field: 'estado', 
            label: 'Estado',
            render: (item) => (
                <Chip
                    label={item.estado}
                    color={
                        item.estado === 'pagada' ? 'success' :
                        item.estado === 'pendiente' ? 'warning' :
                        item.estado === 'vencida' ? 'error' : 'default'
                    }
                    size="small"
                />
            )
        },
        { 
            field: 'metodo_pago', 
            label: 'Método de Pago',
            render: (item) => (
                <Chip
                    label={item.metodo_pago}
                    color={
                        item.metodo_pago === 'efectivo' ? 'success' :
                        item.metodo_pago === 'tarjeta' ? 'primary' :
                        item.metodo_pago === 'transferencia' ? 'info' : 'default'
                    }
                    size="small"
                />
            )
        }
    ];

    // Configuración de campos del formulario
    const formFields = [
        {
            name: 'cliente_id',
            label: 'Cliente',
            type: 'select',
            required: true,
            options: clientes.map(cliente => ({
                value: cliente.id,
                label: `${cliente.nombre} ${cliente.apellido}`
            }))
        },
        {
            name: 'fecha',
            label: 'Fecha',
            type: 'date',
            required: true
        },
        {
            name: 'fecha_vencimiento',
            label: 'Fecha de Vencimiento',
            type: 'date',
            required: true
        },
        {
            name: 'estado',
            label: 'Estado',
            type: 'select',
            required: true,
            options: [
                { value: 'pendiente', label: 'Pendiente' },
                { value: 'pagada', label: 'Pagada' },
                { value: 'vencida', label: 'Vencida' }
            ]
        },
        {
            name: 'metodo_pago',
            label: 'Método de Pago',
            type: 'select',
            required: true,
            options: [
                { value: 'efectivo', label: 'Efectivo' },
                { value: 'tarjeta', label: 'Tarjeta' },
                { value: 'transferencia', label: 'Transferencia' }
            ]
        },
        {
            name: 'subtotal',
            label: 'Subtotal',
            type: 'number',
            required: true
        },
        {
            name: 'impuestos',
            label: 'Impuestos',
            type: 'number',
            required: true
        },
        {
            name: 'total',
            label: 'Total',
            type: 'number',
            required: true
        },
        {
            name: 'concepto',
            label: 'Concepto',
            multiline: true,
            rows: 3,
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
        { field: 'monto', label: 'Monto' },
        { field: 'usuario', label: 'Usuario' }
    ];

    // Función para manejar la creación de facturas
    const handleAdd = async (data) => {
        try {
            const response = await fetch('/api/facturas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            const newItem = await response.json();
            queryClient.invalidateQueries('facturas');
            return newItem;
        } catch (error) {
            console.error('Error al crear factura:', error);
            throw error;
        }
    };

    // Función para manejar la edición de facturas
    const handleEdit = async (id, data) => {
        try {
            const response = await fetch(`/api/facturas/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            const updatedItem = await response.json();
            queryClient.invalidateQueries('facturas');
            return updatedItem;
        } catch (error) {
            console.error('Error al editar factura:', error);
            throw error;
        }
    };

    // Función para manejar la eliminación de facturas
    const handleDelete = async (id) => {
        try {
            await fetch(`/api/facturas/${id}`, {
                method: 'DELETE',
            });
            queryClient.invalidateQueries('facturas');
        } catch (error) {
            console.error('Error al eliminar factura:', error);
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
                title="Gestión de Facturación"
                columns={columns}
                formFields={formFields}
                data={facturas}
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

export default Facturacion; 
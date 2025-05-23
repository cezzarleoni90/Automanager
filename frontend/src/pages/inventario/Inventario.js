import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    IconButton,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    MenuItem,
    Chip,
    Tooltip,
    Switch,
    FormControlLabel,
    Alert,
    Snackbar,
    CircularProgress
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Build as BuildIcon,
    History as HistoryIcon,
    Close as CloseIcon,
    QrCodeScanner as ScannerIcon,
    QrCode as QrCodeIcon,
    Analytics as AnalyticsIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { BarcodeScanner } from '@zxing/library';
import BaseModuleTemplate from '../../templates/BaseModuleTemplate';
import { useInfiniteQuery, useQueryClient } from 'react-query';
import { debounce } from 'lodash';

const Inventario = () => {
    const [openScanner, setOpenScanner] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [autoGenerateCode, setAutoGenerateCode] = useState(false);
    const [stockAlert, setStockAlert] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({});
    const queryClient = useQueryClient();

    // Configuración de React Query para cargar datos
    const { data: items = [], isLoading } = useInfiniteQuery(
        'inventario',
        async ({ pageParam = 1 }) => {
            // TODO: Reemplazar con llamada real a la API
            const response = await fetch(`/api/inventario?page=${pageParam}`);
            const data = await response.json();
            return data;
        },
        {
            getNextPageParam: (lastPage) => lastPage.nextPage,
            keepPreviousData: true,
        }
    );

    // Configuración del escáner de códigos de barras
    const [scanner, setScanner] = useState(null);

    useEffect(() => {
        if (openScanner) {
            const codeReader = new BarcodeScanner();
            setScanner(codeReader);
        }
        return () => {
            if (scanner) {
                scanner.reset();
            }
        };
    }, [openScanner]);

    // Configuración de columnas para la tabla
    const columns = [
        { field: 'codigo', label: 'Código' },
        { field: 'nombre', label: 'Nombre' },
        { field: 'categoria', label: 'Categoría' },
        { 
            field: 'stock', 
            label: 'Stock',
            render: (item) => (
                <Chip
                    label={item.stock}
                    color={item.stock <= item.stock_minimo ? 'error' : 'success'}
                    size="small"
                />
            )
        },
        { field: 'precio', label: 'Precio' },
        { 
            field: 'estado', 
            label: 'Estado',
            render: (item) => (
                <Chip
                    label={item.stock > 0 ? 'Disponible' : 'Agotado'}
                    color={item.stock > 0 ? 'success' : 'error'}
                    size="small"
                />
            )
        }
    ];

    // Configuración de campos del formulario
    const formFields = [
        {
            name: 'codigo',
            label: 'Código',
            required: true,
            inputProps: {
                endAdornment: (
                    <IconButton onClick={() => setOpenScanner(true)}>
                        <ScannerIcon />
                    </IconButton>
                )
            }
        },
        {
            name: 'nombre',
            label: 'Nombre',
            required: true
        },
        {
            name: 'categoria',
            label: 'Categoría',
            type: 'select',
            required: true,
            options: [
                { value: 'repuestos', label: 'Repuestos' },
                { value: 'lubricantes', label: 'Lubricantes' },
                { value: 'herramientas', label: 'Herramientas' },
                { value: 'accesorios', label: 'Accesorios' }
            ]
        },
        {
            name: 'stock',
            label: 'Stock',
            type: 'number',
            required: true
        },
        {
            name: 'stock_minimo',
            label: 'Stock Mínimo',
            type: 'number',
            required: true
        },
        {
            name: 'precio',
            label: 'Precio',
            type: 'number',
            required: true
        },
        {
            name: 'descripcion',
            label: 'Descripción',
            multiline: true,
            rows: 3
        }
    ];

    // Configuración de acciones adicionales
    const additionalActions = [
        {
            label: 'Ver Análisis de Stock',
            icon: <AnalyticsIcon />,
            onClick: (item) => {
                // TODO: Implementar análisis de stock con IA
                console.log('Análisis de stock para:', item);
            }
        },
        {
            label: 'Generar Código QR',
            icon: <QrCodeIcon />,
            onClick: (item) => {
                // TODO: Implementar generación de QR
                console.log('Generar QR para:', item);
            }
        }
    ];

    // Configuración de columnas para el historial
    const historyColumns = [
        { field: 'fecha', label: 'Fecha' },
        { field: 'tipo', label: 'Tipo' },
        { field: 'cantidad', label: 'Cantidad' },
        { field: 'usuario', label: 'Usuario' },
        { field: 'notas', label: 'Notas' }
    ];

    // Función para abrir el diálogo de edición/creación
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

    // Función para manejar el escaneo de códigos de barras
    const handleScan = useCallback(async (result) => {
        if (result) {
            try {
                const response = await fetch(`/api/inventario/buscar/${result}`);
                const data = await response.json();
                if (data) {
                    handleOpenDialog(data);
                } else {
                    // Si no existe, crear nuevo item
                    handleOpenDialog({
                        codigo: result,
                        nombre: '',
                        categoria: '',
                        stock: 0,
                        stock_minimo: 0,
                        precio: 0,
                        descripcion: ''
                    });
                }
                setOpenScanner(false);
            } catch (error) {
                console.error('Error al procesar el código:', error);
            }
        }
    }, []);

    // Función para generar código automático
    const generateCode = useCallback(() => {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `ART-${timestamp}-${random}`.toUpperCase();
    }, []);

    // Función para predecir demanda con IA
    const predictDemand = useCallback(async (item) => {
        try {
            const response = await fetch('/api/inventario/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    itemId: item.id,
                    historial: item.historial
                }),
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error en predicción:', error);
            return null;
        }
    }, []);

    // Función para manejar alertas de stock
    const checkStockAlerts = useCallback(async () => {
        try {
            const response = await fetch('/api/inventario/alertas');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al verificar stock:', error);
            return [];
        }
    }, []);

    // Efecto para verificar alertas de stock periódicamente
    useEffect(() => {
        const checkAlerts = async () => {
            const alerts = await checkStockAlerts();
            if (alerts.length > 0) {
                setStockAlert(alerts[0]);
            }
        };

        const interval = setInterval(checkAlerts, 300000); // Cada 5 minutos
        return () => clearInterval(interval);
    }, [checkStockAlerts]);

    // Función para manejar la creación de items
    const handleAdd = async (data) => {
        try {
            const response = await fetch('/api/inventario', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            const newItem = await response.json();
            queryClient.invalidateQueries('inventario');
            return newItem;
        } catch (error) {
            console.error('Error al crear item:', error);
            throw error;
        }
    };

    // Función para manejar la edición de items
    const handleEdit = async (id, data) => {
        try {
            const response = await fetch(`/api/inventario/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            const updatedItem = await response.json();
            queryClient.invalidateQueries('inventario');
            return updatedItem;
        } catch (error) {
            console.error('Error al editar item:', error);
            throw error;
        }
    };

    // Función para manejar la eliminación de items
    const handleDelete = async (id) => {
        try {
            await fetch(`/api/inventario/${id}`, {
                method: 'DELETE',
            });
            queryClient.invalidateQueries('inventario');
        } catch (error) {
            console.error('Error al eliminar item:', error);
            throw error;
        }
    };

    return (
        <Box>
            <BaseModuleTemplate
                title="Gestión de Inventario"
                columns={columns}
                formFields={formFields}
                data={items.pages?.flat() || []}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewHistory={true}
                additionalActions={additionalActions}
                historyColumns={historyColumns}
                historyData={[]}
                openDialog={openDialog}
                handleOpenDialog={handleOpenDialog}
                handleCloseDialog={handleCloseDialog}
                handleInputChange={handleInputChange}
                selectedItem={selectedItem}
                setSelectedItem={setSelectedItem}
                formData={formData}
            />

            {/* Modal de Escáner */}
            <Dialog
                open={openScanner}
                onClose={() => setOpenScanner(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Escanear Código de Barras</Typography>
                        <IconButton onClick={() => setOpenScanner(false)} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ position: 'relative', height: 300 }}>
                        {scanning ? (
                            <CircularProgress />
                        ) : (
                            <Box
                                component="video"
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                                ref={(video) => {
                                    if (video && scanner) {
                                        scanner.decodeFromVideoDevice(null, video, (result) => {
                                            if (result) {
                                                handleScan(result.text);
                                            }
                                        });
                                    }
                                }}
                            />
                        )}
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Alerta de Stock Bajo */}
            <Snackbar
                open={!!stockAlert}
                autoHideDuration={6000}
                onClose={() => setStockAlert(null)}
            >
                <Alert
                    severity="warning"
                    icon={<WarningIcon />}
                    onClose={() => setStockAlert(null)}
                >
                    Stock bajo para {stockAlert?.item}. Actual: {stockAlert?.stock}, Mínimo: {stockAlert?.minimo}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Inventario; 
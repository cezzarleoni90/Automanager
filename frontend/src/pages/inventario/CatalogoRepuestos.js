import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    IconButton,
    TextField,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Snackbar
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import { inventarioService } from '../../services/inventarioService';
import FormularioRepuesto from './FormularioRepuesto';

const CatalogoRepuestos = () => {
    const [repuestos, setRepuestos] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedRepuesto, setSelectedRepuesto] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoria, setCategoria] = useState('');
    const [stockBajo, setStockBajo] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchRepuestos = async () => {
        try {
            const response = await inventarioService.getRepuestos({
                page: page + 1,
                perPage: rowsPerPage,
                categoria,
                stockBajo,
                busqueda: searchTerm
            });
            setRepuestos(response.data);
            setTotalItems(response.total);
        } catch (error) {
            showSnackbar('Error al cargar los repuestos', 'error');
        }
    };

    useEffect(() => {
        fetchRepuestos();
    }, [page, rowsPerPage, categoria, stockBajo, searchTerm]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleOpenDialog = (repuesto = null) => {
        setSelectedRepuesto(repuesto);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setSelectedRepuesto(null);
        setOpenDialog(false);
    };

    const handleSaveRepuesto = async (repuesto) => {
        try {
            if (selectedRepuesto) {
                await inventarioService.updateRepuesto(selectedRepuesto.id, repuesto);
                showSnackbar('Repuesto actualizado exitosamente');
            } else {
                await inventarioService.createRepuesto(repuesto);
                showSnackbar('Repuesto creado exitosamente');
            }
            handleCloseDialog();
            fetchRepuestos();
        } catch (error) {
            showSnackbar(error.message || 'Error al guardar el repuesto', 'error');
        }
    };

    const handleDeleteRepuesto = async (id) => {
        if (window.confirm('¿Está seguro de eliminar este repuesto?')) {
            try {
                await inventarioService.deleteRepuesto(id);
                showSnackbar('Repuesto eliminado exitosamente');
                fetchRepuestos();
            } catch (error) {
                showSnackbar(error.message || 'Error al eliminar el repuesto', 'error');
            }
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Catálogo de Repuestos
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Nuevo Repuesto
                </Button>
            </Box>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                        label="Buscar"
                        variant="outlined"
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                    />
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Categoría</InputLabel>
                        <Select
                            value={categoria}
                            label="Categoría"
                            onChange={(e) => setCategoria(e.target.value)}
                        >
                            <MenuItem value="">Todas</MenuItem>
                            <MenuItem value="motor">Motor</MenuItem>
                            <MenuItem value="frenos">Frenos</MenuItem>
                            <MenuItem value="suspension">Suspensión</MenuItem>
                            <MenuItem value="electrico">Eléctrico</MenuItem>
                            <MenuItem value="otros">Otros</MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        variant={stockBajo ? "contained" : "outlined"}
                        onClick={() => setStockBajo(!stockBajo)}
                    >
                        Stock Bajo
                    </Button>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Código</TableCell>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Categoría</TableCell>
                                <TableCell>Stock</TableCell>
                                <TableCell>Precio</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {repuestos.map((repuesto) => (
                                <TableRow key={repuesto.id}>
                                    <TableCell>{repuesto.codigo}</TableCell>
                                    <TableCell>{repuesto.nombre}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={repuesto.categoria}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={repuesto.stock}
                                            size="small"
                                            color={repuesto.stock <= repuesto.stock_minimo ? "error" : "success"}
                                        />
                                    </TableCell>
                                    <TableCell>${repuesto.precio}</TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleOpenDialog(repuesto)}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDeleteRepuesto(repuesto.id)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    component="div"
                    count={totalItems}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25]}
                />
            </Paper>

            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {selectedRepuesto ? 'Editar Repuesto' : 'Nuevo Repuesto'}
                </DialogTitle>
                <DialogContent>
                    <FormularioRepuesto
                        repuesto={selectedRepuesto}
                        onSave={handleSaveRepuesto}
                        onCancel={handleCloseDialog}
                    />
                </DialogContent>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default CatalogoRepuestos; 
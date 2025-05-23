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
    Snackbar,
    Grid
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    FilterList as FilterIcon
} from '@mui/icons-material';
import { inventarioService } from '../../services/inventarioService';
import FormularioMovimiento from './FormularioMovimiento';

const MovimientosInventario = () => {
    const [movimientos, setMovimientos] = useState([]);
    const [repuestos, setRepuestos] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [tipo, setTipo] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchMovimientos = async () => {
        try {
            const response = await inventarioService.getMovimientos({
                page: page + 1,
                perPage: rowsPerPage,
                tipo,
                fechaInicio,
                fechaFin,
                busqueda: searchTerm
            });
            setMovimientos(response.data);
            setTotalItems(response.total);
        } catch (error) {
            showSnackbar('Error al cargar los movimientos', 'error');
        }
    };

    const fetchRepuestos = async () => {
        try {
            const response = await inventarioService.getRepuestos();
            setRepuestos(response.data);
        } catch (error) {
            showSnackbar('Error al cargar los repuestos', 'error');
        }
    };

    useEffect(() => {
        fetchMovimientos();
        fetchRepuestos();
    }, [page, rowsPerPage, tipo, fechaInicio, fechaFin, searchTerm]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleOpenDialog = () => {
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleSaveMovimiento = async (movimiento) => {
        try {
            await inventarioService.createMovimiento(movimiento);
            showSnackbar('Movimiento registrado exitosamente');
            handleCloseDialog();
            fetchMovimientos();
            fetchRepuestos(); // Actualizar stock
        } catch (error) {
            showSnackbar(error.message || 'Error al registrar el movimiento', 'error');
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const getTipoColor = (tipo) => {
        switch (tipo) {
            case 'entrada':
                return 'success';
            case 'salida':
                return 'error';
            default:
                return 'default';
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Movimientos de Inventario
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenDialog}
                >
                    Nuevo Movimiento
                </Button>
            </Box>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth
                            label="Buscar"
                            variant="outlined"
                            size="small"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Tipo</InputLabel>
                            <Select
                                value={tipo}
                                label="Tipo"
                                onChange={(e) => setTipo(e.target.value)}
                            >
                                <MenuItem value="">Todos</MenuItem>
                                <MenuItem value="entrada">Entrada</MenuItem>
                                <MenuItem value="salida">Salida</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth
                            label="Fecha Inicio"
                            type="date"
                            size="small"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth
                            label="Fecha Fin"
                            type="date"
                            size="small"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                </Grid>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Repuesto</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Cantidad</TableCell>
                                <TableCell>Motivo</TableCell>
                                <TableCell>Usuario</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {movimientos.map((movimiento) => (
                                <TableRow key={movimiento.id}>
                                    <TableCell>
                                        {new Date(movimiento.fecha).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>{movimiento.repuesto_nombre}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={movimiento.tipo}
                                            size="small"
                                            color={getTipoColor(movimiento.tipo)}
                                        />
                                    </TableCell>
                                    <TableCell>{movimiento.cantidad}</TableCell>
                                    <TableCell>{movimiento.motivo}</TableCell>
                                    <TableCell>{movimiento.usuario_nombre}</TableCell>
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
                <DialogTitle>Nuevo Movimiento</DialogTitle>
                <DialogContent>
                    <FormularioMovimiento
                        repuestos={repuestos}
                        onSave={handleSaveMovimiento}
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

export default MovimientosInventario; 
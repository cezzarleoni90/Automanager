import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
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
    Divider
} from '@mui/material';
import { 
    Add as AddIcon, 
    Edit as EditIcon, 
    Delete as DeleteIcon,
    Build as BuildIcon,
    History as HistoryIcon,
    Close as CloseIcon
} from '@mui/icons-material';

const BaseModuleTemplate = ({
    title,
    columns,
    formFields,
    data,
    onAdd,
    onEdit,
    onDelete,
    onViewHistory,
    getStatusColor,
    getStatusLabel,
    additionalActions = [],
    historyColumns = [],
    historyData = [],
    openDialog,
    handleOpenDialog,
    handleCloseDialog,
    handleInputChange,
    selectedItem,
    setSelectedItem,
    formData
}) => {
    const [openAccionesDialog, setOpenAccionesDialog] = useState(false);
    const [openHistorialDialog, setOpenHistorialDialog] = useState(false);

    const handleOpenAccionesDialog = (item) => {
        setSelectedItem(item);
        setOpenAccionesDialog(true);
    };

    const handleCloseAccionesDialog = () => {
        setOpenAccionesDialog(false);
        setSelectedItem(null);
    };

    const handleOpenHistorialDialog = (item) => {
        setSelectedItem(item);
        setOpenHistorialDialog(true);
    };

    const handleCloseHistorialDialog = () => {
        setOpenHistorialDialog(false);
        setSelectedItem(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedItem) {
            await onEdit(selectedItem.id, formData);
        } else {
            await onAdd(formData);
        }
        handleCloseDialog();
    };

    const handleDelete = async (id) => {
        await onDelete(id);
        handleCloseAccionesDialog();
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">
                    {title}
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Nuevo Registro
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            {columns.map((column, index) => (
                                <TableCell key={index}>{column.label}</TableCell>
                            ))}
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.map((item) => (
                            <TableRow key={item.id}>
                                {columns.map((column, index) => (
                                    <TableCell key={index}>
                                        {column.render ? column.render(item) : item[column.field]}
                                    </TableCell>
                                ))}
                                <TableCell>
                                    <Tooltip title="Acciones">
                                        <IconButton
                                            color="primary"
                                            onClick={() => handleOpenAccionesDialog(item)}
                                        >
                                            <BuildIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Modal de Acciones */}
            <Dialog 
                open={openAccionesDialog} 
                onClose={handleCloseAccionesDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Acciones - {selectedItem?.nombre || selectedItem?.descripcion}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<EditIcon />}
                                onClick={() => {
                                    handleCloseAccionesDialog();
                                    handleOpenDialog(selectedItem);
                                }}
                            >
                                Editar
                            </Button>
                        </Grid>
                        {onViewHistory && (
                            <Grid item xs={12}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<HistoryIcon />}
                                    onClick={() => {
                                        handleCloseAccionesDialog();
                                        handleOpenHistorialDialog(selectedItem);
                                    }}
                                >
                                    Ver Historial
                                </Button>
                            </Grid>
                        )}
                        {additionalActions.map((action, index) => (
                            <Grid item xs={12} key={index}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={action.icon}
                                    onClick={() => {
                                        handleCloseAccionesDialog();
                                        action.onClick(selectedItem);
                                    }}
                                >
                                    {action.label}
                                </Button>
                            </Grid>
                        ))}
                        <Grid item xs={12}>
                            <Button
                                fullWidth
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => handleDelete(selectedItem?.id)}
                            >
                                Eliminar
                            </Button>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAccionesDialog}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            {/* Modal de Edición/Creación */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedItem ? 'Editar Registro' : 'Nuevo Registro'}
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <Grid container spacing={2}>
                            {formFields.map((field, index) => (
                                <Grid item xs={12} sm={field.gridSize || 6} key={index}>
                                    {field.type === 'select' ? (
                                        <TextField
                                            fullWidth
                                            select
                                            label={field.label}
                                            name={field.name}
                                            value={formData[field.name] || ''}
                                            onChange={handleInputChange}
                                            required={field.required}
                                        >
                                            {field.options.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    ) : (
                                        <TextField
                                            fullWidth
                                            label={field.label}
                                            name={field.name}
                                            type={field.type || 'text'}
                                            value={formData[field.name] || ''}
                                            onChange={handleInputChange}
                                            required={field.required}
                                            multiline={field.multiline}
                                            rows={field.rows}
                                            InputProps={field.inputProps}
                                        />
                                    )}
                                </Grid>
                            ))}
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancelar</Button>
                        <Button type="submit" variant="contained" color="primary">
                            {selectedItem ? 'Actualizar' : 'Crear'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Modal de Historial */}
            {onViewHistory && (
                <Dialog
                    open={openHistorialDialog}
                    onClose={handleCloseHistorialDialog}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6">
                                Historial - {selectedItem?.nombre || selectedItem?.descripcion}
                            </Typography>
                            <IconButton onClick={handleCloseHistorialDialog} size="small">
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <TableContainer component={Paper} sx={{ mt: 2 }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        {historyColumns.map((column, index) => (
                                            <TableCell key={index}>{column.label}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {historyData.map((item) => (
                                        <TableRow key={item.id}>
                                            {historyColumns.map((column, index) => (
                                                <TableCell key={index}>
                                                    {column.render ? column.render(item) : item[column.field]}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseHistorialDialog}>Cerrar</Button>
                    </DialogActions>
                </Dialog>
            )}
        </Box>
    );
};

export default BaseModuleTemplate; 
import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Grid,
    Typography
} from '@mui/material';

const FormularioMovimiento = ({ repuestos, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        repuesto_id: '',
        tipo: '',
        cantidad: '',
        motivo: '',
        observaciones: ''
    });

    const [errors, setErrors] = useState({});
    const [selectedRepuesto, setSelectedRepuesto] = useState(null);

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.repuesto_id) {
            newErrors.repuesto_id = 'El repuesto es requerido';
        }
        
        if (!formData.tipo) {
            newErrors.tipo = 'El tipo de movimiento es requerido';
        }
        
        if (!formData.cantidad || formData.cantidad <= 0) {
            newErrors.cantidad = 'La cantidad debe ser mayor a 0';
        } else if (formData.tipo === 'salida' && selectedRepuesto && formData.cantidad > selectedRepuesto.stock) {
            newErrors.cantidad = 'No hay suficiente stock disponible';
        }
        
        if (!formData.motivo.trim()) {
            newErrors.motivo = 'El motivo es requerido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (name === 'repuesto_id') {
            const repuesto = repuestos.find(r => r.id === value);
            setSelectedRepuesto(repuesto);
        }
        
        // Limpiar error cuando el campo se modifica
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSave(formData);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required error={!!errors.repuesto_id}>
                        <InputLabel>Repuesto</InputLabel>
                        <Select
                            name="repuesto_id"
                            value={formData.repuesto_id}
                            onChange={handleChange}
                            label="Repuesto"
                        >
                            {repuestos.map((repuesto) => (
                                <MenuItem key={repuesto.id} value={repuesto.id}>
                                    {repuesto.nombre} - Stock: {repuesto.stock}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required error={!!errors.tipo}>
                        <InputLabel>Tipo de Movimiento</InputLabel>
                        <Select
                            name="tipo"
                            value={formData.tipo}
                            onChange={handleChange}
                            label="Tipo de Movimiento"
                        >
                            <MenuItem value="entrada">Entrada</MenuItem>
                            <MenuItem value="salida">Salida</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Cantidad"
                        name="cantidad"
                        type="number"
                        value={formData.cantidad}
                        onChange={handleChange}
                        error={!!errors.cantidad}
                        helperText={errors.cantidad}
                        required
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Motivo"
                        name="motivo"
                        value={formData.motivo}
                        onChange={handleChange}
                        error={!!errors.motivo}
                        helperText={errors.motivo}
                        required
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Observaciones"
                        name="observaciones"
                        value={formData.observaciones}
                        onChange={handleChange}
                        multiline
                        rows={3}
                    />
                </Grid>
                {selectedRepuesto && (
                    <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                            Stock actual: {selectedRepuesto.stock} unidades
                            {selectedRepuesto.stock <= selectedRepuesto.stock_minimo && (
                                <Typography component="span" color="error" sx={{ ml: 1 }}>
                                    (Stock bajo)
                                </Typography>
                            )}
                        </Typography>
                    </Grid>
                )}
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                    variant="outlined"
                    onClick={onCancel}
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                >
                    Registrar Movimiento
                </Button>
            </Box>
        </Box>
    );
};

export default FormularioMovimiento; 
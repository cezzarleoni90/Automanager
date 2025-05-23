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
    InputAdornment
} from '@mui/material';

const FormularioRepuesto = ({ repuesto, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        codigo: '',
        nombre: '',
        descripcion: '',
        categoria: '',
        precio: '',
        stock: '',
        stock_minimo: '',
        ubicacion: '',
        proveedor: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (repuesto) {
            setFormData({
                codigo: repuesto.codigo || '',
                nombre: repuesto.nombre || '',
                descripcion: repuesto.descripcion || '',
                categoria: repuesto.categoria || '',
                precio: repuesto.precio || '',
                stock: repuesto.stock || '',
                stock_minimo: repuesto.stock_minimo || '',
                ubicacion: repuesto.ubicacion || '',
                proveedor: repuesto.proveedor || ''
            });
        }
    }, [repuesto]);

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.codigo.trim()) {
            newErrors.codigo = 'El código es requerido';
        }
        
        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        }
        
        if (!formData.categoria) {
            newErrors.categoria = 'La categoría es requerida';
        }
        
        if (!formData.precio || formData.precio <= 0) {
            newErrors.precio = 'El precio debe ser mayor a 0';
        }
        
        if (!formData.stock || formData.stock < 0) {
            newErrors.stock = 'El stock no puede ser negativo';
        }
        
        if (!formData.stock_minimo || formData.stock_minimo < 0) {
            newErrors.stock_minimo = 'El stock mínimo no puede ser negativo';
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
                    <TextField
                        fullWidth
                        label="Código"
                        name="codigo"
                        value={formData.codigo}
                        onChange={handleChange}
                        error={!!errors.codigo}
                        helperText={errors.codigo}
                        required
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Nombre"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        error={!!errors.nombre}
                        helperText={errors.nombre}
                        required
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Descripción"
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        multiline
                        rows={3}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required error={!!errors.categoria}>
                        <InputLabel>Categoría</InputLabel>
                        <Select
                            name="categoria"
                            value={formData.categoria}
                            onChange={handleChange}
                            label="Categoría"
                        >
                            <MenuItem value="motor">Motor</MenuItem>
                            <MenuItem value="frenos">Frenos</MenuItem>
                            <MenuItem value="suspension">Suspensión</MenuItem>
                            <MenuItem value="electrico">Eléctrico</MenuItem>
                            <MenuItem value="otros">Otros</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Precio"
                        name="precio"
                        type="number"
                        value={formData.precio}
                        onChange={handleChange}
                        error={!!errors.precio}
                        helperText={errors.precio}
                        required
                        InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Stock"
                        name="stock"
                        type="number"
                        value={formData.stock}
                        onChange={handleChange}
                        error={!!errors.stock}
                        helperText={errors.stock}
                        required
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Stock Mínimo"
                        name="stock_minimo"
                        type="number"
                        value={formData.stock_minimo}
                        onChange={handleChange}
                        error={!!errors.stock_minimo}
                        helperText={errors.stock_minimo}
                        required
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Ubicación"
                        name="ubicacion"
                        value={formData.ubicacion}
                        onChange={handleChange}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Proveedor"
                        name="proveedor"
                        value={formData.proveedor}
                        onChange={handleChange}
                    />
                </Grid>
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
                    {repuesto ? 'Actualizar' : 'Crear'}
                </Button>
            </Box>
        </Box>
    );
};

export default FormularioRepuesto; 
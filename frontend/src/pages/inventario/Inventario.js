const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Limpiar y preparar datos
    const formDataToSend = {
        codigo: formData.codigo,
        nombre: formData.nombre,
        categoria: formData.categoria || 'General', // ← Valor por defecto si está vacío
        precio_compra: parseFloat(formData.precio_compra),
        precio_venta: parseFloat(formData.precio_venta),
        stock: parseInt(formData.stock) || 0,
        stock_minimo: parseInt(formData.stock_minimo) || 0,
        descripcion: formData.descripcion || ''
        // ← Eliminar campos innecesarios: marca, modelo, ubicacion
    };
    
    try {
        const response = await fetch('http://localhost:5000/api/inventario/repuestos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formDataToSend)
        });
        
        if (response.ok) {
            // ✅ Éxito
            const result = await response.json();
            console.log('Repuesto creado:', result);
            
            // 1. Recargar la lista de repuestos
            await cargarRepuestos(); // Asume que tienes esta función
            
            // 2. Limpiar el formulario
            setFormData({
                codigo: '',
                nombre: '',
                categoria: '',
                precio_compra: '',
                precio_venta: '',
                stock: '',
                stock_minimo: '',
                descripcion: ''
            });
            
            // 3. Mostrar mensaje de éxito
            setSuccessMessage('Repuesto creado exitosamente');
            
            // 4. Opcional: Cerrar modal si hay uno
            // setOpenModal(false);
            
        } else {
            // ❌ Error del servidor
            const error = await response.json();
            console.error('Error:', error);
            setError(error.error || 'Error al guardar el repuesto');
        }
    } catch (error) {
        console.error('Error de red:', error);
        setError('Error de conexión');
    } finally {
        setIsLoading(false);
    }
}; 
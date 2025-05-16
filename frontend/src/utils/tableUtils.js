// Función para formatear números con separadores de miles y decimales
export const formatearNumero = (numero) => {
    if (numero === undefined || numero === null) return '0,00';
    return numero.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true
    });
};

// Función para obtener los últimos N meses
export const obtenerMeses = (cantidadMeses = 12) => {
    const meses = [];
    const fechaActual = new Date();
    for (let i = 0; i < cantidadMeses; i++) {
        const fecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1);
        meses.push({
            value: fecha.toISOString().slice(0, 7), // Formato YYYY-MM
            label: fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
        });
    }
    return meses;
};

// Función para calcular ingresos del mes
export const calcularIngresosMes = (servicios) => {
    const fechaActual = new Date();
    const primerDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
    const ultimoDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);

    return servicios.reduce((total, servicio) => {
        const fechaServicio = new Date(servicio.fecha_inicio);
        if (fechaServicio >= primerDiaMes && fechaServicio <= ultimoDiaMes) {
            return total + (servicio.honorarios || 0);
        }
        return total;
    }, 0);
};

// Función para filtrar datos
export const filtrarDatos = (datos, filtros, camposBusqueda = []) => {
    return datos.filter(item => {
        // Filtro de búsqueda
        const matchesSearch = filtros.search 
            ? camposBusqueda.some(campo => 
                String(item[campo]).toLowerCase().includes(filtros.search.toLowerCase())
            )
            : true;

        // Filtros personalizados
        const matchesCustomFilters = Object.entries(filtros)
            .filter(([key]) => key !== 'search')
            .every(([key, value]) => !value || item[key] === value);

        return matchesSearch && matchesCustomFilters;
    });
};

// Función para paginar datos
export const paginarDatos = (datos, pagina, itemsPorPagina) => {
    const inicio = (pagina - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    return datos.slice(inicio, fin);
}; 
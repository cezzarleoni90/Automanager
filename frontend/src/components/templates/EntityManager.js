import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Tooltip,
    Grid,
    TableRow,
    TableCell
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon
} from '@mui/icons-material';
import DataTable from '../DataTable';
import DetailModal from '../DetailModal';
import { useCommonStyles } from '../../styles/commonStyles';

const EntityManager = ({
    title,
    columns,
    fetchData,
    onDelete,
    renderRow,
    customFilters = [],
    searchFields = [],
    renderDetailContent,
    API_CONFIG,
    MENSAJES_ERROR
}) => {
    const classes = useCommonStyles();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [filtros, setFiltros] = useState({
        search: '',
        ...customFilters.reduce((acc, filter) => ({ ...acc, [filter.name]: '' }), {})
    });
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_CONFIG.BASE_URL}/${title.toLowerCase()}`);
            if (!response.ok) throw new Error(MENSAJES_ERROR.ERROR_CONEXION);
            const data = await response.json();
            setData(data);
            setTotalPaginas(Math.ceil(data.length / 10));
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const handleOpenDialog = (item) => {
        setSelectedItem(item);
        setModalOpen(true);
    };

    const handleCloseDialog = () => {
        setModalOpen(false);
        setSelectedItem(null);
    };

    const handleEdit = (item) => {
        // Implementar lógica de edición
    };

    const handleDelete = async (item) => {
        if (window.confirm('¿Está seguro de eliminar este elemento?')) {
            try {
                const response = await fetch(`${API_CONFIG.BASE_URL}/${title.toLowerCase()}/${item.id}`, {
                    method: 'DELETE'
                });
                if (!response.ok) throw new Error(MENSAJES_ERROR.ERROR_GENERAL);
                await cargarDatos();
            } catch (error) {
                setError(error.message);
            }
        }
    };

    return (
        <Box className={classes.container}>
            <Typography variant="h4" className={classes.sectionTitle}>
                {title}
            </Typography>

            <DataTable
                title={`Lista de ${title}`}
                columns={columns}
                data={data}
                filters={filtros}
                onFilterChange={setFiltros}
                searchFields={searchFields}
                customFilters={customFilters}
                page={pagina}
                totalPages={totalPaginas}
                onPageChange={setPagina}
                renderRow={renderRow}
                searchPlaceholder={`Buscar ${title.toLowerCase()}...`}
            />

            <DetailModal
                open={modalOpen}
                onClose={handleCloseDialog}
                title={`Detalles de ${title} #${selectedItem?.id}`}
                data={selectedItem}
                onEdit={handleEdit}
                onDelete={handleDelete}
                loading={loading}
            >
                {selectedItem && renderDetailContent(selectedItem)}
            </DetailModal>
        </Box>
    );
};

export default EntityManager; 
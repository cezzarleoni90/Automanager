import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    InputAdornment,
    Box,
    Pagination,
    Grid
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

const DataTable = ({
    title,
    columns,
    data,
    filters,
    onFilterChange,
    searchFields = [],
    customFilters = [],
    page,
    totalPages,
    onPageChange,
    renderRow,
    searchPlaceholder = "Buscar...",
    itemsPerPage = 10
}) => {
    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ mb: 2 }}>
                <Grid container spacing={2}>
                    {/* Campo de búsqueda */}
                    {searchFields.length > 0 && (
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label={searchPlaceholder}
                                value={filters.search || ''}
                                onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                    )}

                    {/* Filtros personalizados */}
                    {customFilters.map((filter, index) => (
                        <Grid item xs={12} md={4} key={index}>
                            <FormControl fullWidth>
                                <InputLabel>{filter.label}</InputLabel>
                                <Select
                                    value={filters[filter.name] || ''}
                                    onChange={(e) => onFilterChange({ ...filters, [filter.name]: e.target.value })}
                                    label={filter.label}
                                >
                                    <MenuItem value="">Todos</MenuItem>
                                    {filter.options.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            {columns.map((column, index) => (
                                <TableCell key={index}>{column.label}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.length > 0 ? (
                            data.map((item, index) => renderRow(item, index))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} align="center">
                                    No hay datos disponibles
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(e, newPage) => onPageChange(newPage)}
                        color="primary"
                        showFirstButton
                        showLastButton
                    />
                </Box>
            )}
        </Paper>
    );
};

export default DataTable; 
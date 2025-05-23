import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

const BaseModuleTemplate = ({
  title,
  description,
  columns,
  data,
  isLoading,
  error,
  formFields,
  formData,
  openDialog,
  selectedItem,
  historial,
  onAdd,
  onEdit,
  onDelete,
  onOpenDialog,
  onCloseDialog,
  onInputChange
}) => {
  const [showHistorial, setShowHistorial] = React.useState(false);
  const [formErrors, setFormErrors] = React.useState({});

  const validateField = (field, value) => {
    if (field.required && !value) {
      return 'Este campo es requerido';
    }
    if (field.validation) {
      if (field.validation.pattern && !new RegExp(field.validation.pattern).test(value)) {
        return field.validation.message;
      }
      if (field.validation.min !== undefined && value < field.validation.min) {
        return field.validation.message;
      }
      if (field.validation.max !== undefined && value > field.validation.max) {
        return field.validation.message;
      }
      if (field.validation.maxLength && value.length > field.validation.maxLength) {
        return field.validation.message;
      }
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    let hasErrors = false;

    formFields.forEach(field => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        errors[field.name] = error;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setFormErrors(errors);
      return;
    }

    try {
      if (selectedItem) {
        await onEdit(formData);
      } else {
        await onAdd(formData);
      }
      onCloseDialog();
      setFormErrors({});
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  const renderFormField = (field) => {
    const error = formErrors[field.name];
    const commonProps = {
      key: field.name,
      name: field.name,
      label: field.label,
      value: formData[field.name] || '',
      onChange: onInputChange,
      required: field.required,
      error: !!error,
      helperText: error,
      fullWidth: true
    };

    switch (field.type) {
      case 'select':
        return (
          <FormControl fullWidth key={field.name} error={!!error}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              {...commonProps}
              label={field.label}
            >
              {field.options.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {error && <Typography color="error" variant="caption">{error}</Typography>}
          </FormControl>
        );
      case 'checkbox':
        return (
          <FormControlLabel
            key={field.name}
            control={
              <Checkbox
                name={field.name}
                checked={formData[field.name] || false}
                onChange={onInputChange}
              />
            }
            label={field.label}
          />
        );
      case 'textarea':
        return (
          <TextField
            {...commonProps}
            multiline
            rows={4}
          />
        );
      case 'json':
        return (
          <TextField
            {...commonProps}
            multiline
            rows={4}
            value={JSON.stringify(formData[field.name] || field.defaultValue || {}, null, 2)}
            onChange={(e) => {
              try {
                const value = JSON.parse(e.target.value);
                onInputChange({
                  target: {
                    name: field.name,
                    value
                  }
                });
              } catch (error) {
                onInputChange({
                  target: {
                    name: field.name,
                    value: e.target.value
                  }
                });
              }
            }}
            error={(() => {
              try {
                JSON.parse(formData[field.name] || '{}');
                return false;
              } catch {
                return true;
              }
            })()}
            helperText="Debe ser un JSON válido"
          />
        );
      default:
        return (
          <TextField
            {...commonProps}
            type={field.type || 'text'}
          />
        );
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {description}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => onOpenDialog()}
        >
          Agregar
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      <Paper sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={data}
          columns={[
            ...columns,
            {
              field: 'actions',
              headerName: 'Acciones',
              width: 150,
              sortable: false,
              renderCell: (params) => (
                <Box>
                  <Tooltip title="Editar">
                    <IconButton
                      size="small"
                      onClick={() => onOpenDialog(params.row)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton
                      size="small"
                      onClick={() => onDelete(params.row.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Historial">
                    <IconButton
                      size="small"
                      onClick={() => setShowHistorial(true)}
                    >
                      <HistoryIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              ),
            },
          ]}
          pageSize={5}
          rowsPerPageOptions={[5]}
          checkboxSelection
          disableSelectionOnClick
          loading={isLoading}
        />
      </Paper>

      <Dialog open={openDialog} onClose={onCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedItem ? 'Editar Vehículo' : 'Nuevo Vehículo'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {formFields.map((field) => (
                <Grid item xs={12} sm={6} key={field.name}>
                  {renderFormField(field)}
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedItem ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showHistorial} onClose={() => setShowHistorial(false)} maxWidth="md" fullWidth>
        <DialogTitle>Historial de Cambios</DialogTitle>
        <DialogContent>
          {historial && historial.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              {historial.map((cambio, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">
                    {new Date(cambio.fecha).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {cambio.descripcion}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography>No hay historial disponible</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistorial(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BaseModuleTemplate; 
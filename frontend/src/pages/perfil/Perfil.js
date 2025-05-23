import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Box, Chip, Alert, Snackbar, Tooltip } from '@mui/material';
import BaseModuleTemplate from '../../components/BaseModuleTemplate';
import { perfilService } from '../../services/perfil';

const Perfil = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const queryClient = useQueryClient();

  // Obtener perfiles con react-query
  const { data: perfiles, isLoading } = useQuery(
    'perfiles',
    () => perfilService.getAll(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 30 * 60 * 1000, // 30 minutos
      retry: 3,
      onError: (error) => {
        setNotification({
          open: true,
          message: 'Error al cargar los perfiles',
          severity: 'error'
        });
      }
    }
  );

  // Obtener historial de cambios
  const { data: historial } = useQuery(
    ['historial', selectedItem?.id],
    () => perfilService.getHistorial(selectedItem?.id),
    {
      enabled: !!selectedItem,
      staleTime: 1 * 60 * 1000, // 1 minuto
      cacheTime: 5 * 60 * 1000 // 5 minutos
    }
  );

  // Columnas de la tabla principal
  const columns = [
    { 
      field: 'codigo', 
      headerName: 'Código', 
      width: 130,
      renderCell: (params) => (
        <Box sx={{ fontFamily: 'monospace' }}>{params.value}</Box>
      )
    },
    { 
      field: 'nombre', 
      headerName: 'Nombre', 
      width: 200,
      renderCell: (params) => (
        <Box sx={{ fontWeight: 'medium' }}>{params.value}</Box>
      )
    },
    { 
      field: 'descripcion', 
      headerName: 'Descripción', 
      width: 250,
      renderCell: (params) => (
        <Box sx={{ 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {params.value}
        </Box>
      )
    },
    { 
      field: 'nivel_acceso', 
      headerName: 'Nivel de Acceso', 
      width: 150,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={
            params.value === 'administrador' ? 'error' :
            params.value === 'avanzado' ? 'warning' :
            params.value === 'intermedio' ? 'primary' :
            'success'
          }
          size="small"
        />
      )
    },
    { 
      field: 'estado', 
      headerName: 'Estado', 
      width: 130,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={params.value === 'activo' ? 'success' : 'error'}
          size="small"
        />
      )
    }
  ];

  // Campos del formulario
  const formFields = [
    { 
      name: 'nombre', 
      label: 'Nombre', 
      type: 'text', 
      required: true,
      validation: {
        pattern: '^[a-zA-Z0-9_\\s-]+$',
        message: 'Solo letras, números, guiones y espacios'
      }
    },
    { 
      name: 'descripcion', 
      label: 'Descripción', 
      type: 'textarea',
      validation: {
        maxLength: 500,
        message: 'Máximo 500 caracteres'
      }
    },
    { 
      name: 'nivel_acceso', 
      label: 'Nivel de Acceso', 
      type: 'select',
      options: [
        { value: 'basico', label: 'Básico' },
        { value: 'intermedio', label: 'Intermedio' },
        { value: 'avanzado', label: 'Avanzado' },
        { value: 'administrador', label: 'Administrador' }
      ],
      required: true,
      tooltip: 'Define el nivel de acceso y permisos del perfil'
    },
    { 
      name: 'estado', 
      label: 'Estado', 
      type: 'select',
      options: [
        { value: 'activo', label: 'Activo' },
        { value: 'inactivo', label: 'Inactivo' }
      ],
      required: true
    },
    { 
      name: 'es_sistema', 
      label: 'Es Perfil de Sistema', 
      type: 'checkbox',
      tooltip: 'Indica si es un perfil predefinido del sistema'
    },
    { 
      name: 'configuracion_ui', 
      label: 'Configuración de UI', 
      type: 'json',
      defaultValue: {
        tema: 'claro',
        menu_colapsado: false,
        notificaciones_activas: true,
        vista_por_defecto: 'dashboard',
        elementos_por_pagina: 10,
        mostrar_tutorial: true,
        idioma: 'es',
        zona_horaria: 'America/Mexico_City'
      },
      tooltip: 'Preferencias de interfaz para usuarios con este perfil'
    },
    { 
      name: 'restricciones', 
      label: 'Restricciones', 
      type: 'json',
      defaultValue: {
        horario_acceso: {
          inicio: '08:00',
          fin: '18:00'
        },
        dias_acceso: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
        ip_permitidas: [],
        max_sesiones: 1,
        tiempo_inactividad: 30,
        requiere_2fa: false,
        complejidad_password: 'media'
      },
      tooltip: 'Restricciones de seguridad y acceso'
    },
    { 
      name: 'notas', 
      label: 'Notas', 
      type: 'textarea',
      tooltip: 'Información adicional sobre el perfil'
    }
  ];

  // Columnas del historial
  const historialColumns = [
    { 
      field: 'fecha', 
      headerName: 'Fecha', 
      width: 180,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleString();
      }
    },
    { 
      field: 'tipo_cambio', 
      headerName: 'Tipo de Cambio', 
      width: 150,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={
            params.value === 'creacion' ? 'success' :
            params.value === 'actualizacion' ? 'primary' :
            params.value === 'eliminacion' ? 'error' :
            'default'
          }
          size="small"
        />
      )
    },
    { 
      field: 'descripcion', 
      headerName: 'Descripción', 
      width: 300,
      renderCell: (params) => (
        <Box sx={{ 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {params.value}
        </Box>
      )
    },
    { 
      field: 'permisos_anteriores', 
      headerName: 'Permisos Anteriores', 
      width: 200,
      renderCell: (params) => {
        try {
          const value = JSON.parse(params.value);
          return typeof value === 'object' ? JSON.stringify(value) : params.value;
        } catch {
          return params.value;
        }
      }
    },
    { 
      field: 'permisos_nuevos', 
      headerName: 'Permisos Nuevos', 
      width: 200,
      renderCell: (params) => {
        try {
          const value = JSON.parse(params.value);
          return typeof value === 'object' ? JSON.stringify(value) : params.value;
        } catch {
          return params.value;
        }
      }
    },
    { 
      field: 'usuario', 
      headerName: 'Usuario', 
      width: 150,
      renderCell: (params) => (
        <Box sx={{ fontFamily: 'monospace' }}>{params.value}</Box>
      )
    }
  ];

  // Funciones CRUD
  const handleAdd = async (data) => {
    try {
      await perfilService.create(data);
      queryClient.invalidateQueries('perfiles');
      setNotification({
        open: true,
        message: 'Perfil creado exitosamente',
        severity: 'success'
      });
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error al crear el perfil',
        severity: 'error'
      });
    }
  };

  const handleEdit = async (data) => {
    try {
      await perfilService.update(selectedItem.id, data);
      queryClient.invalidateQueries('perfiles');
      setNotification({
        open: true,
        message: 'Perfil actualizado exitosamente',
        severity: 'success'
      });
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error al actualizar el perfil',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await perfilService.delete(id);
      queryClient.invalidateQueries('perfiles');
      setNotification({
        open: true,
        message: 'Perfil eliminado exitosamente',
        severity: 'success'
      });
    } catch (error) {
      setNotification({
        open: true,
        message: 'Error al eliminar el perfil',
        severity: 'error'
      });
    }
  };

  // Funciones de diálogo
  const handleOpenDialog = (item = null) => {
    setSelectedItem(item);
    setFormData(item || {});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
    setFormData({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <>
      <BaseModuleTemplate
        title="Perfiles"
        description="Gestión de perfiles de usuario"
        columns={columns}
        data={perfiles || []}
        loading={isLoading}
        formFields={formFields}
        formData={formData}
        openDialog={openDialog}
        selectedItem={selectedItem}
        historialColumns={historialColumns}
        historialData={historial || []}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onOpenDialog={handleOpenDialog}
        onCloseDialog={handleCloseDialog}
        onInputChange={handleInputChange}
      />
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setNotification(prev => ({ ...prev, open: false }))} 
          severity={notification.severity}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Perfil; 
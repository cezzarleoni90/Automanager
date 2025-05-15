import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Avatar,
  IconButton,
  Divider,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  PhotoCamera as PhotoCameraIcon,
  Lock as LockIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

// Definir la URL base de la API
const API_URL = 'http://localhost:5000';

function Perfil() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [perfil, setPerfil] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    cargo: '',
    departamento: '',
    foto: '',
    preferencias: {
      tema: 'claro',
      notificaciones: {
        email: true,
        sistema: true,
        recordatorios: true,
      },
    },
  });

  // Estados para gestión de usuarios
  const [usuarios, setUsuarios] = useState([]);
  const [tiposUsuario, setTiposUsuario] = useState([]);
  const [openUsuarioDialog, setOpenUsuarioDialog] = useState(false);
  const [openTipoUsuarioDialog, setOpenTipoUsuarioDialog] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [tipoUsuarioSeleccionado, setTipoUsuarioSeleccionado] = useState(null);

  // Estados para configuración del sistema
  const [configSistema, setConfigSistema] = useState({
    titulo: 'AutoManager',
    subtitulo: 'Sistema de Gestión de Taller',
    logo: '',
    imagenFondo: '',
    colores: {
      primario: '#1976d2',
      secundario: '#dc004e',
      fondo: '#ffffff',
    },
    etiquetas: {
      clientes: 'Clientes',
      vehiculos: 'Vehículos',
      servicios: 'Servicios',
      inventario: 'Inventario',
      mecanicos: 'Mecánicos',
      calendario: 'Calendario',
      facturacion: 'Facturación',
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openCambioPassword, setOpenCambioPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    actual: '',
    nueva: '',
    confirmar: '',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Cargar perfil
      const perfilResponse = await fetch('http://localhost:5000/api/usuarios/perfil', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const perfilData = await perfilResponse.json();
      setPerfil(perfilData.perfil || perfil);

      // Cargar usuarios
      const usuariosResponse = await fetch('http://localhost:5000/api/usuarios', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const usuariosData = await usuariosResponse.json();
      setUsuarios(usuariosData.usuarios || []);

      // Cargar tipos de usuario
      const tiposResponse = await fetch('http://localhost:5000/api/usuarios/tipos', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const tiposData = await tiposResponse.json();
      setTiposUsuario(tiposData.tipos || []);

      // Cargar configuración del sistema
      const configResponse = await fetch('http://localhost:5000/api/configuracion/sistema', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const configData = await configResponse.json();
      setConfigSistema(configData.configuracion || configSistema);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Funciones para gestión de usuarios
  const handleCrearUsuario = async (usuario) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/usuarios', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(usuario),
      });

      if (!response.ok) throw new Error('Error al crear usuario');
      
      await cargarDatos();
      setSuccess('Usuario creado exitosamente');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleActualizarUsuario = async (id, usuario) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/usuarios/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(usuario),
      });

      if (!response.ok) throw new Error('Error al actualizar usuario');
      
      await cargarDatos();
      setSuccess('Usuario actualizado exitosamente');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleEliminarUsuario = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/usuarios/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Error al eliminar usuario');
      
      await cargarDatos();
      setSuccess('Usuario eliminado exitosamente');
    } catch (error) {
      setError(error.message);
    }
  };

  // Funciones para gestión de tipos de usuario
  const handleCrearTipoUsuario = async (tipo) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/usuarios/tipos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tipo),
      });

      if (!response.ok) throw new Error('Error al crear tipo de usuario');
      
      await cargarDatos();
      setSuccess('Tipo de usuario creado exitosamente');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleActualizarTipoUsuario = async (id, tipo) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/usuarios/tipos/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tipo)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el tipo de usuario');
      }

      // Recargar la lista de tipos de usuario
      cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    }
  };

  const handleEliminarTipoUsuario = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este tipo de usuario?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/usuarios/tipos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el tipo de usuario');
      }

      // Recargar la lista de tipos de usuario
      cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    }
  };

  // Funciones para configuración del sistema
  const handleGuardarConfigSistema = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/configuracion/sistema', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configSistema),
      });

      if (!response.ok) throw new Error('Error al guardar configuración');
      
      setSuccess('Configuración guardada exitosamente');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCambioImagen = async (tipo, file) => {
    try {
      const formData = new FormData();
      formData.append('imagen', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/configuracion/${tipo}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error(`Error al actualizar ${tipo}`);
      
      const data = await response.json();
      setConfigSistema(prev => ({
        ...prev,
        [tipo]: data.url,
      }));
      setSuccess(`${tipo} actualizado exitosamente`);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleFotoChange = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('foto', file);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/usuarios/foto', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error('Error al actualizar la foto');
      
      const data = await response.json();
      setPerfil(prev => ({
        ...prev,
        foto: data.url,
      }));
      setSuccess('Foto actualizada exitosamente');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleInputChange = (field, value) => {
    setPerfil(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePreferenciaChange = (tipo, value) => {
    setPerfil(prev => ({
      ...prev,
      preferencias: {
        ...prev.preferencias,
        notificaciones: {
          ...prev.preferencias.notificaciones,
          [tipo]: value,
        },
      },
    }));
  };

  const handleSavePerfil = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/usuarios/perfil', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(perfil),
      });

      if (!response.ok) throw new Error('Error al actualizar perfil');
      
      setSuccess('Perfil actualizado exitosamente');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
        <Tab icon={<PersonIcon />} label="Mi Perfil" />
        {user?.rol === 'admin' && (
          <>
            <Tab icon={<PeopleIcon />} label="Gestión de Usuarios" />
            <Tab icon={<AdminIcon />} label="Tipos de Usuario" />
            <Tab icon={<SettingsIcon />} label="Configuración del Sistema" />
          </>
        )}
      </Tabs>

      <Box sx={{ mt: 3 }}>
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {/* Información Personal */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <Avatar
                      src={perfil.foto}
                      sx={{ width: 150, height: 150, mb: 2 }}
                    />
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="foto-input"
                      type="file"
                      onChange={handleFotoChange}
                    />
                    <label htmlFor="foto-input">
                      <IconButton
                        component="span"
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          backgroundColor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                          },
                        }}
                      >
                        <PhotoCameraIcon />
                      </IconButton>
                    </label>
                  </Box>
                  <Typography variant="h5" gutterBottom>
                    {`${perfil.nombre} ${perfil.apellido}`}
                  </Typography>
                  <Typography variant="subtitle1" color="textSecondary">
                    {perfil.cargo}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {perfil.departamento}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Formulario de Perfil */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader
                  title="Información Personal"
                  action={
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSavePerfil}
                      disabled={loading}
                    >
                      Guardar Cambios
                    </Button>
                  }
                />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Nombre"
                        value={perfil.nombre}
                        onChange={(e) => handleInputChange('nombre', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Apellido"
                        value={perfil.apellido}
                        onChange={(e) => handleInputChange('apellido', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={perfil.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Teléfono"
                        value={perfil.telefono}
                        onChange={(e) => handleInputChange('telefono', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Cargo"
                        value={perfil.cargo}
                        onChange={(e) => handleInputChange('cargo', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Departamento"
                        value={perfil.departamento}
                        onChange={(e) => handleInputChange('departamento', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Preferencias */}
              <Card sx={{ mt: 3 }}>
                <CardHeader
                  avatar={<NotificationsIcon />}
                  title="Preferencias"
                />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={perfil.preferencias.notificaciones.email}
                            onChange={(e) => handlePreferenciaChange('email', e.target.checked)}
                          />
                        }
                        label="Notificaciones por Email"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={perfil.preferencias.notificaciones.sistema}
                            onChange={(e) => handlePreferenciaChange('sistema', e.target.checked)}
                          />
                        }
                        label="Notificaciones del Sistema"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={perfil.preferencias.notificaciones.recordatorios}
                            onChange={(e) => handlePreferenciaChange('recordatorios', e.target.checked)}
                          />
                        }
                        label="Recordatorios"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Seguridad */}
              <Card sx={{ mt: 3 }}>
                <CardHeader
                  avatar={<SecurityIcon />}
                  title="Seguridad"
                  action={
                    <Button
                      startIcon={<LockIcon />}
                      onClick={() => setOpenCambioPassword(true)}
                    >
                      Cambiar Contraseña
                    </Button>
                  }
                />
                <CardContent>
                  <Typography variant="body2" color="textSecondary">
                    Último inicio de sesión: {new Date(user?.ultimo_acceso).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 1 && user?.rol === 'admin' && (
          <Card>
            <CardHeader
              title="Gestión de Usuarios"
              action={
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenUsuarioDialog(true)}
                >
                  Nuevo Usuario
                </Button>
              }
            />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {usuarios.map((usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell>{`${usuario.nombre} ${usuario.apellido}`}</TableCell>
                        <TableCell>{usuario.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={usuario.tipo}
                            color={usuario.tipo === 'admin' ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={usuario.activo ? 'Activo' : 'Inactivo'}
                            color={usuario.activo ? 'success' : 'error'}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => {
                              setUsuarioSeleccionado(usuario);
                              setOpenUsuarioDialog(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => handleEliminarUsuario(usuario.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {activeTab === 2 && user?.rol === 'admin' && (
          <Card>
            <CardHeader
              title="Tipos de Usuario"
              action={
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenTipoUsuarioDialog(true)}
                >
                  Nuevo Tipo
                </Button>
              }
            />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Permisos</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tiposUsuario.map((tipo) => (
                      <TableRow key={tipo.id}>
                        <TableCell>{tipo.nombre}</TableCell>
                        <TableCell>
                          {tipo.permisos.map((permiso) => (
                            <Chip
                              key={permiso}
                              label={permiso}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                          ))}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => {
                              setTipoUsuarioSeleccionado(tipo);
                              setOpenTipoUsuarioDialog(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => handleEliminarTipoUsuario(tipo.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {activeTab === 3 && user?.rol === 'admin' && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Configuración General" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Título del Sistema"
                        value={configSistema.titulo}
                        onChange={(e) => setConfigSistema({
                          ...configSistema,
                          titulo: e.target.value,
                        })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Subtítulo"
                        value={configSistema.subtitulo}
                        onChange={(e) => setConfigSistema({
                          ...configSistema,
                          subtitulo: e.target.value,
                        })}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardHeader title="Personalización" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        Logo
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={configSistema.logo}
                          variant="rounded"
                          sx={{ width: 100, height: 100 }}
                        />
                        <Button
                          variant="outlined"
                          component="label"
                        >
                          Cambiar Logo
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => handleCambioImagen('logo', e.target.files[0])}
                          />
                        </Button>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        Imagen de Fondo
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          component="img"
                          src={configSistema.imagenFondo}
                          sx={{
                            width: 100,
                            height: 100,
                            objectFit: 'cover',
                            borderRadius: 1,
                          }}
                        />
                        <Button
                          variant="outlined"
                          component="label"
                        >
                          Cambiar Fondo
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => handleCambioImagen('imagenFondo', e.target.files[0])}
                          />
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardHeader title="Etiquetas del Sistema" />
                <CardContent>
                  <Grid container spacing={2}>
                    {Object.entries(configSistema.etiquetas).map(([key, value]) => (
                      <Grid item xs={12} sm={6} key={key}>
                        <TextField
                          fullWidth
                          label={`Etiqueta: ${key}`}
                          value={value}
                          onChange={(e) => setConfigSistema({
                            ...configSistema,
                            etiquetas: {
                              ...configSistema.etiquetas,
                              [key]: e.target.value,
                            },
                          })}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleGuardarConfigSistema}
                >
                  Guardar Configuración
                </Button>
              </Box>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Diálogos */}
      <Dialog
        open={openUsuarioDialog}
        onClose={() => {
          setOpenUsuarioDialog(false);
          setUsuarioSeleccionado(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {usuarioSeleccionado ? 'Editar Usuario' : 'Nuevo Usuario'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre"
                value={usuarioSeleccionado?.nombre || ''}
                onChange={(e) => setUsuarioSeleccionado({
                  ...usuarioSeleccionado,
                  nombre: e.target.value,
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Apellido"
                value={usuarioSeleccionado?.apellido || ''}
                onChange={(e) => setUsuarioSeleccionado({
                  ...usuarioSeleccionado,
                  apellido: e.target.value,
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={usuarioSeleccionado?.email || ''}
                onChange={(e) => setUsuarioSeleccionado({
                  ...usuarioSeleccionado,
                  email: e.target.value,
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Usuario</InputLabel>
                <Select
                  value={usuarioSeleccionado?.tipo || ''}
                  onChange={(e) => setUsuarioSeleccionado({
                    ...usuarioSeleccionado,
                    tipo: e.target.value,
                  })}
                >
                  {tiposUsuario.map((tipo) => (
                    <MenuItem key={tipo.id} value={tipo.nombre}>
                      {tipo.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenUsuarioDialog(false);
            setUsuarioSeleccionado(null);
          }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (usuarioSeleccionado?.id) {
                handleActualizarUsuario(usuarioSeleccionado.id, usuarioSeleccionado);
              } else {
                handleCrearUsuario(usuarioSeleccionado);
              }
              setOpenUsuarioDialog(false);
              setUsuarioSeleccionado(null);
            }}
          >
            {usuarioSeleccionado?.id ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openTipoUsuarioDialog}
        onClose={() => {
          setOpenTipoUsuarioDialog(false);
          setTipoUsuarioSeleccionado(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {tipoUsuarioSeleccionado ? 'Editar Tipo de Usuario' : 'Nuevo Tipo de Usuario'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre del Tipo"
                value={tipoUsuarioSeleccionado?.nombre || ''}
                onChange={(e) => setTipoUsuarioSeleccionado({
                  ...tipoUsuarioSeleccionado,
                  nombre: e.target.value,
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Permisos</InputLabel>
                <Select
                  multiple
                  value={tipoUsuarioSeleccionado?.permisos || []}
                  onChange={(e) => setTipoUsuarioSeleccionado({
                    ...tipoUsuarioSeleccionado,
                    permisos: e.target.value,
                  })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                >
                  {['admin', 'usuario', 'mecanico', 'recepcionista'].map((permiso) => (
                    <MenuItem key={permiso} value={permiso}>
                      {permiso}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenTipoUsuarioDialog(false);
            setTipoUsuarioSeleccionado(null);
          }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (tipoUsuarioSeleccionado?.id) {
                handleActualizarTipoUsuario(tipoUsuarioSeleccionado.id, tipoUsuarioSeleccionado);
              } else {
                handleCrearTipoUsuario(tipoUsuarioSeleccionado);
              }
              setOpenTipoUsuarioDialog(false);
              setTipoUsuarioSeleccionado(null);
            }}
          >
            {tipoUsuarioSeleccionado?.id ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={() => {
          setError('');
          setSuccess('');
        }}
      >
        <Alert
          onClose={() => {
            setError('');
            setSuccess('');
          }}
          severity={error ? 'error' : 'success'}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Perfil; 
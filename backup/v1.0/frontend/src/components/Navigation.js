import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Avatar,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  DirectionsCar as CarIcon,
  Build as BuildIcon,
  Inventory as InventoryIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Clientes', icon: <PeopleIcon />, path: '/clientes' },
    { text: 'Vehículos', icon: <CarIcon />, path: '/vehiculos' },
    { text: 'Servicios', icon: <BuildIcon />, path: '/servicios' },
    { text: 'Inventario', icon: <InventoryIcon />, path: '/inventario' },
    { text: 'Calendario', icon: <CalendarIcon />, path: '/calendario' },
  ];

  if (user?.rol === 'admin') {
    menuItems.push(
      { text: 'Configuración', icon: <SettingsIcon />, path: '/configuracion' }
    );
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          AutoManager
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {menuItems.map((item) => (
            <Button
              key={item.text}
              color="inherit"
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              sx={{
                mx: 1,
                backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
              }}
            >
              {item.text}
            </Button>
          ))}
          <IconButton
            onClick={handleMenu}
            color="inherit"
            sx={{ ml: 2 }}
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.nombre?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={() => navigate('/perfil')}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              Mi Perfil
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navigation; 
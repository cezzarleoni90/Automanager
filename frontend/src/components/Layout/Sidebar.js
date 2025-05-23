import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    Collapse,
    Box,
    Typography,
    Divider
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Inventory as InventoryIcon,
    LocalShipping as LocalShippingIcon,
    Build as BuildIcon,
    People as PeopleIcon,
    CalendarMonth as CalendarIcon,
    Receipt as ReceiptIcon,
    Settings as SettingsIcon,
    Person as PersonIcon,
    ExpandLess as ExpandLessIcon,
    ExpandMore as ExpandMoreIcon,
    Category as CategoryIcon,
    SwapHoriz as SwapHorizIcon,
    DirectionsCar as CarIcon,
    Engineering as EngineeringIcon
} from '@mui/icons-material';

const drawerWidth = 240;

const menuItems = [
    {
        title: 'Dashboard',
        path: '/',
        icon: <DashboardIcon />
    },
    {
        title: 'Inventario',
        icon: <InventoryIcon />,
        subItems: [
            {
                title: 'Catálogo de Repuestos',
                path: '/inventario/repuestos',
                icon: <CategoryIcon />
            },
            {
                title: 'Movimientos',
                path: '/inventario/movimientos',
                icon: <SwapHorizIcon />
            }
        ]
    },
    {
        title: 'Vehículos',
        path: '/vehiculos',
        icon: <CarIcon />
    },
    {
        title: 'Servicios',
        path: '/servicios',
        icon: <BuildIcon />
    },
    {
        title: 'Clientes',
        path: '/clientes',
        icon: <PeopleIcon />
    },
    {
        title: 'Calendario',
        path: '/calendario',
        icon: <CalendarIcon />
    },
    {
        title: 'Facturación',
        path: '/facturacion',
        icon: <ReceiptIcon />
    },
    {
        title: 'Configuración',
        path: '/configuracion',
        icon: <SettingsIcon />
    },
    {
        title: 'Perfil',
        path: '/perfil',
        icon: <PersonIcon />
    },
    {
        title: 'Mecánicos',
        path: '/mecanicos',
        icon: <EngineeringIcon />
    }
];

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = React.useState({});

    const handleClick = (title) => {
        setOpen(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    const handleNavigate = (path) => {
        navigate(path);
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    const renderMenuItem = (item) => {
        if (item.subItems) {
            return (
                <React.Fragment key={item.title}>
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => handleClick(item.title)}>
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.title} />
                            {open[item.title] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </ListItemButton>
                    </ListItem>
                    <Collapse in={open[item.title]} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {item.subItems.map((subItem) => (
                                <ListItemButton
                                    key={subItem.title}
                                    sx={{ pl: 4 }}
                                    onClick={() => handleNavigate(subItem.path)}
                                    selected={isActive(subItem.path)}
                                >
                                    <ListItemIcon>{subItem.icon}</ListItemIcon>
                                    <ListItemText primary={subItem.title} />
                                </ListItemButton>
                            ))}
                        </List>
                    </Collapse>
                </React.Fragment>
            );
        }

        return (
            <ListItem key={item.title} disablePadding>
                <ListItemButton
                    onClick={() => handleNavigate(item.path)}
                    selected={isActive(item.path)}
                >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.title} />
                </ListItemButton>
            </ListItem>
        );
    };

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                },
            }}
        >
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" noWrap component="div">
                    AutoManager
                </Typography>
            </Box>
            <List>
                {menuItems.map(renderMenuItem)}
            </List>
            <Divider />
        </Drawer>
    );
};

export default Sidebar; 
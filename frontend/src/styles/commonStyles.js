import { makeStyles } from '@mui/styles';

export const useCommonStyles = makeStyles((theme) => ({
    // Estilos para el contenedor principal
    container: {
        padding: theme.spacing(3),
        backgroundColor: theme.palette.background.default,
        minHeight: '100vh'
    },

    // Estilos para las tarjetas
    card: {
        marginBottom: theme.spacing(3),
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[2],
        '&:hover': {
            boxShadow: theme.shadows[4]
        }
    },

    // Estilos para los encabezados de sección
    sectionTitle: {
        marginBottom: theme.spacing(3),
        color: theme.palette.text.primary,
        fontWeight: 600
    },

    // Estilos para los botones de acción
    actionButton: {
        marginLeft: theme.spacing(1),
        '&:first-child': {
            marginLeft: 0
        }
    },

    // Estilos para los campos de formulario
    formField: {
        marginBottom: theme.spacing(2),
        '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
                borderColor: theme.palette.primary.main
            }
        }
    },

    // Estilos para las tablas
    table: {
        minWidth: 650,
        '& .MuiTableCell-head': {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            fontWeight: 600
        }
    },

    // Estilos para los estados
    statusChip: {
        borderRadius: theme.shape.borderRadius,
        padding: theme.spacing(0.5, 1),
        fontWeight: 500,
        textTransform: 'uppercase',
        fontSize: '0.75rem'
    },

    // Estilos para los modales
    modal: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    modalContent: {
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
        padding: theme.spacing(3),
        maxWidth: 600,
        width: '100%'
    },

    // Estilos para los filtros
    filterContainer: {
        display: 'flex',
        gap: theme.spacing(2),
        marginBottom: theme.spacing(3),
        flexWrap: 'wrap'
    },
    filterField: {
        minWidth: 200
    },

    // Estilos para la paginación
    pagination: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: theme.spacing(3)
    },

    // Estilos para los mensajes de error/éxito
    message: {
        marginTop: theme.spacing(2),
        padding: theme.spacing(2),
        borderRadius: theme.shape.borderRadius
    },
    errorMessage: {
        backgroundColor: theme.palette.error.light,
        color: theme.palette.error.contrastText
    },
    successMessage: {
        backgroundColor: theme.palette.success.light,
        color: theme.palette.success.contrastText
    },

    // Estilos para los tooltips
    tooltip: {
        backgroundColor: theme.palette.grey[700],
        fontSize: '0.875rem'
    },

    // Estilos para los iconos
    icon: {
        fontSize: '1.25rem',
        marginRight: theme.spacing(1)
    },

    // Estilos para los badges
    badge: {
        '& .MuiBadge-badge': {
            right: -3,
            top: 13,
            border: `2px solid ${theme.palette.background.paper}`,
            padding: '0 4px'
        }
    }
})); 
import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    IconButton,
    Typography,
    Grid,
    Paper
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const DetailModal = ({
    open,
    onClose,
    title,
    data,
    onEdit,
    onDelete,
    loading,
    children,
    maxWidth = "md",
    fullWidth = true,
    showActions = true
}) => {
    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth={maxWidth}
            fullWidth={fullWidth}
            TransitionProps={{
                timeout: 200,
                easing: {
                    enter: 'ease-out',
                    exit: 'ease-in'
                }
            }}
            PaperProps={{
                sx: {
                    transition: 'all 0.2s ease-in-out',
                    transform: 'scale(1)',
                    opacity: 1,
                    '&.MuiDialog-paper': {
                        transition: 'all 0.2s ease-in-out'
                    }
                }
            }}
        >
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', px: 2, py: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                        {title}
                    </Typography>
                    <IconButton 
                        color="inherit" 
                        onClick={onClose}
                        aria-label="cerrar diálogo"
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            
            <DialogContent dividers sx={{ p: 3 }}>
                {children}
            </DialogContent>
            
            {showActions && (
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button 
                        onClick={onClose} 
                        color="inherit"
                    >
                        Cerrar
                    </Button>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {onEdit && (
                            <Button 
                                variant="contained" 
                                color="primary"
                                onClick={() => onEdit(data)}
                                disabled={loading}
                            >
                                Editar
                            </Button>
                        )}
                        {onDelete && (
                            <Button 
                                variant="contained" 
                                color="error"
                                onClick={() => onDelete(data)}
                                disabled={loading}
                            >
                                Eliminar
                            </Button>
                        )}
                    </Box>
                </DialogActions>
            )}
        </Dialog>
    );
};

export default DetailModal; 
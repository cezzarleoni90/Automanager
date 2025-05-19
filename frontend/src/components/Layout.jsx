import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

const Layout = () => {
  return (
    <Box sx={{ 
      display: 'flex',
      minHeight: '100vh',
      width: '100%',
      bgcolor: '#f5f5f5'
    }}>
      <Box sx={{ 
        flexGrow: 1,
        width: '100%',
        overflow: 'auto'
      }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout; 
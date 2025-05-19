import { createTheme } from '@mui/material/styles';

// Paleta de colores futurista para AutoManager
const autoManagerPalette = {
  primary: {
    main: '#00D4FF', // Azul cibernético
    light: '#33E0FF',
    dark: '#0099CC',
    contrastText: '#FFFFFF'
  },
  secondary: {
    main: '#FF6B35', // Naranja vibrante para acciones
    light: '#FF8A65',
    dark: '#E64A19',
    contrastText: '#FFFFFF'
  },
  accent: {
    main: '#7B1FA2', // Púrpura para elementos premium
    light: '#9C27B0',
    dark: '#4A148C'
  },
  background: {
    default: '#0A0E1A', // Fondo oscuro principal
    paper: '#1A1F2E', // Tarjetas y superficies elevadas
    surface: '#242B3D', // Superficies intermedias
    elevated: '#2D3548' // Elementos elevados
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#B0BEC5',
    disabled: '#6B7280',
    accent: '#00D4FF'
  },
  divider: 'rgba(255, 255, 255, 0.12)',
  success: {
    main: '#00E676',
    light: '#66FF99',
    dark: '#00C853'
  },
  warning: {
    main: '#FFB74D',
    light: '#FFE082',
    dark: '#FF8F00'
  },
  error: {
    main: '#FF5252',
    light: '#FF8A80',
    dark: '#D32F2F'
  }
};

// Tipografía moderna y futurista
const autoManagerTypography = {
  fontFamily: [
    '"Inter"',
    '"SF Pro Display"',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    'sans-serif'
  ].join(','),
  h1: {
    fontSize: '2.75rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    background: 'linear-gradient(135deg, #00D4FF 0%, #7B1FA2 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  h2: {
    fontSize: '2.25rem',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.01em'
  },
  h3: {
    fontSize: '1.875rem',
    fontWeight: 600,
    lineHeight: 1.4
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 500,
    lineHeight: 1.4
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 500,
    lineHeight: 1.5
  },
  h6: {
    fontSize: '1.125rem',
    fontWeight: 500,
    lineHeight: 1.5
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.6,
    fontWeight: 400
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.5,
    fontWeight: 400
  },
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.4,
    fontWeight: 400,
    opacity: 0.7
  }
};

// Sombras y efectos futuristas
const customShadows = [
  'none',
  '0 2px 8px rgba(0, 212, 255, 0.15)', // Sombra sutil con tinte azul
  '0 4px 16px rgba(0, 212, 255, 0.2)',
  '0 8px 32px rgba(0, 212, 255, 0.25)',
  '0 12px 48px rgba(0, 212, 255, 0.3)',
  '0 16px 64px rgba(0, 212, 255, 0.35)'
];

// Tema principal de AutoManager
export const autoManagerTheme = createTheme({
  palette: autoManagerPalette,
  typography: autoManagerTypography,
  shadows: customShadows,
  shape: {
    borderRadius: 12 // Bordes más redondeados
  },
  components: {
    // Personalización del AppBar
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #1A1F2E 0%, #242B3D 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
          boxShadow: '0 4px 32px rgba(0, 0, 0, 0.3)'
        }
      }
    },
    
    // Personalización de Cards
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #1A1F2E 0%, #242B3D 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
          backdropFilter: 'blur(20px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 48px rgba(0, 212, 255, 0.2)',
            border: '1px solid rgba(0, 212, 255, 0.3)'
          }
        }
      }
    },
    
    // Botones futuristas
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          padding: '12px 24px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
            transition: 'left 0.5s'
          },
          '&:hover::before': {
            left: '100%'
          }
        },
        contained: {
          background: 'linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)',
          boxShadow: '0 4px 16px rgba(0, 212, 255, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #33E0FF 0%, #00B8D4 100%)',
            boxShadow: '0 8px 32px rgba(0, 212, 255, 0.4)',
            transform: 'translateY(-2px)'
          }
        },
        outlined: {
          border: '2px solid #00D4FF',
          color: '#00D4FF',
          '&:hover': {
            border: '2px solid #33E0FF',
            background: 'rgba(0, 212, 255, 0.1)',
            transform: 'translateY(-2px)'
          }
        }
      }
    },
    
    // Inputs modernos
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderWidth: 2
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 212, 255, 0.5)'
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00D4FF',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)'
            }
          },
          '& .MuiInputLabel-root': {
            color: '#B0BEC5',
            '&.Mui-focused': {
              color: '#00D4FF'
            }
          }
        }
      }
    },
    
    // Chips futuristas
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(123, 31, 162, 0.1) 100%)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          color: '#00D4FF',
          fontWeight: 500,
          '&:hover': {
            background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(123, 31, 162, 0.2) 100%)'
          }
        }
      }
    },
    
    // Paper mejorado
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: 'linear-gradient(135deg, #1A1F2E 0%, #242B3D 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)'
        }
      }
    },
    
    // Drawer futurista
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(180deg, #0A0E1A 0%, #1A1F2E 100%)',
          borderRight: '1px solid rgba(0, 212, 255, 0.2)',
          backdropFilter: 'blur(20px)'
        }
      }
    },
    
    // Tabs modernos
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTabs-indicator': {
            background: 'linear-gradient(90deg, #00D4FF, #7B1FA2)',
            height: 3,
            borderRadius: 2
          }
        }
      }
    },
    
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          transition: 'all 0.3s ease',
          '&:hover': {
            color: '#00D4FF',
            background: 'rgba(0, 212, 255, 0.1)'
          },
          '&.Mui-selected': {
            color: '#00D4FF'
          }
        }
      }
    },
    
    // Switches futuristas
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-track': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            opacity: 1
          },
          '& .MuiSwitch-thumb': {
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 100%)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          },
          '& .Mui-checked .MuiSwitch-thumb': {
            background: 'linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)'
          },
          '& .Mui-checked + .MuiSwitch-track': {
            backgroundColor: 'rgba(0, 212, 255, 0.3)'
          }
        }
      }
    }
  }
});

// Tema claro alternativo (para modo día)
export const autoManagerLightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0070F3',
      light: '#3291FF',
      dark: '#0761D1',
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#FF6B35',
      light: '#FF8A65',
      dark: '#E64A19',
      contrastText: '#FFFFFF'
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
      surface: '#F1F5F9',
      elevated: '#E2E8F0'
    },
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
      disabled: '#94A3B8',
      accent: '#0070F3'
    },
    divider: 'rgba(0, 0, 0, 0.12)',
    success: {
      main: '#00E676',
      light: '#66FF99',
      dark: '#00C853'
    },
    warning: {
      main: '#FFB74D',
      light: '#FFE082',
      dark: '#FF8F00'
    },
    error: {
      main: '#FF5252',
      light: '#FF8A80',
      dark: '#D32F2F'
    }
  },
  shadows: [
    'none',
    '0 2px 8px rgba(30, 41, 59, 0.10)',
    '0 4px 16px rgba(30, 41, 59, 0.12)',
    '0 8px 32px rgba(30, 41, 59, 0.14)',
    '0 12px 48px rgba(30, 41, 59, 0.16)',
    '0 16px 64px rgba(30, 41, 59, 0.18)'
  ],
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: '#FFFFFF',
          color: '#1E293B',
          borderBottom: '1px solid #E2E8F0',
          boxShadow: '0 4px 16px rgba(30, 41, 59, 0.12)'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          boxShadow: '0 4px 16px rgba(30, 41, 59, 0.12)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 8px 32px rgba(30, 41, 59, 0.14)',
            border: '1px solid #CBD5E1'
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          padding: '12px 24px',
          boxShadow: '0 2px 8px rgba(30, 41, 59, 0.10)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        },
        contained: {
          background: '#0070F3',
          color: '#FFFFFF',
          boxShadow: '0 4px 16px rgba(30, 41, 59, 0.12)',
          '&:hover': {
            background: '#0761D1',
            boxShadow: '0 8px 32px rgba(30, 41, 59, 0.14)'
          }
        },
        outlined: {
          border: '2px solid #0070F3',
          color: '#0070F3',
          '&:hover': {
            border: '2px solid #0761D1',
            background: 'rgba(0, 112, 243, 0.08)'
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            background: '#FFFFFF',
            transition: 'all 0.3s ease',
            '& fieldset': {
              borderColor: '#CBD5E1',
              borderWidth: 1
            },
            '&:hover fieldset': {
              borderColor: '#0070F3'
            },
            '&.Mui-focused fieldset': {
              borderColor: '#0070F3',
              boxShadow: '0 0 0 2px rgba(0, 112, 243, 0.10)'
            }
          },
          '& .MuiInputLabel-root': {
            color: '#64748B',
            '&.Mui-focused': {
              color: '#0070F3'
            }
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 16px rgba(30, 41, 59, 0.12)'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(30, 41, 59, 0.10)'
        }
      }
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTabs-indicator': {
            background: '#0070F3',
            height: 3,
            borderRadius: 2
          }
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          color: '#1E293B',
          transition: 'all 0.3s ease',
          '&:hover': {
            color: '#0070F3',
            background: 'rgba(0, 112, 243, 0.08)'
          },
          '&.Mui-selected': {
            color: '#0070F3'
          }
        }
      }
    }
  }
});

export default autoManagerLightTheme; 
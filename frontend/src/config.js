export const API_URL = 'http://localhost:5000/api';

const config = {
    // Configuración de autenticación
    AUTH_TOKEN_KEY: 'auth_token',
    AUTH_USER_KEY: 'auth_user',
    // Configuración de roles
    ROLES: {
        ADMIN: 'admin',
        MECANICO: 'mecanico',
        RECEPCIONISTA: 'recepcionista'
    },
    // Configuración de estados de vehículos
    VEHICULO_ESTADOS: {
        ACTIVO: 'activo',
        EN_SERVICIO: 'en_servicio',
        INACTIVO: 'inactivo'
    },
    // Configuración de tipos de combustible
    TIPOS_COMBUSTIBLE: [
        'gasolina',
        'diésel',
        'eléctrico',
        'híbrido',
        'gas natural'
    ],
    // Configuración de intervalos de tiempo
    CACHE_TIME: {
        SHORT: 5 * 60 * 1000,  // 5 minutos
        MEDIUM: 30 * 60 * 1000, // 30 minutos
        LONG: 24 * 60 * 60 * 1000 // 24 horas
    }
};

export default config; 
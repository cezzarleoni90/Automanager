// Estados de servicio
export const ESTADOS_SERVICIO = {
  PENDIENTE: 'PENDIENTE',
  EN_PROCESO: 'EN_PROCESO',
  COMPLETADO: 'COMPLETADO',
  CANCELADO: 'CANCELADO'
};

// Tipos de servicio
export const TIPOS_SERVICIO = {
  MANTENIMIENTO: 'MANTENIMIENTO',
  REPARACION: 'REPARACION',
  REVISION: 'REVISION',
  DIAGNOSTICO: 'DIAGNOSTICO'
};

// Estados de factura
export const ESTADOS_FACTURA = {
  PENDIENTE: 'PENDIENTE',
  PAGADA: 'PAGADA',
  ANULADA: 'ANULADA'
};

// Tipos de pago
export const TIPOS_PAGO = {
  EFECTIVO: 'EFECTIVO',
  TARJETA: 'TARJETA',
  TRANSFERENCIA: 'TRANSFERENCIA'
};

// Roles de usuario
export const ROLES = {
  ADMIN: 'ADMIN',
  MECANICO: 'MECANICO',
  RECEPCIONISTA: 'RECEPCIONISTA'
};

// Rutas de la aplicación
export const RUTAS = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  CLIENTES: '/clientes',
  VEHICULOS: '/vehiculos',
  SERVICIOS: '/servicios',
  REPUESTOS: '/repuestos',
  FACTURAS: '/facturas',
  PERFIL: '/perfil'
};

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Este campo es obligatorio',
  INVALID_EMAIL: 'El email no es válido',
  INVALID_PHONE: 'El teléfono no es válido',
  INVALID_DNI: 'El DNI/NIE no es válido',
  INVALID_MATRICULA: 'La matrícula no es válida',
  INVALID_POSTAL_CODE: 'El código postal no es válido',
  INVALID_PASSWORD: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
  PASSWORDS_NOT_MATCH: 'Las contraseñas no coinciden',
  INVALID_DATE: 'La fecha no es válida',
  INVALID_PRICE: 'El precio debe ser un número positivo',
  INVALID_QUANTITY: 'La cantidad debe ser un número entero positivo',
  INVALID_IBAN: 'El IBAN no es válido',
  INVALID_CIF: 'El CIF no es válido',
  INVALID_CREDIT_CARD: 'El número de tarjeta no es válido',
  INVALID_CVV: 'El CVV no es válido',
  INVALID_CARD_EXPIRY: 'La fecha de caducidad no es válida'
};

// Mensajes de éxito comunes
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Inicio de sesión exitoso',
  REGISTER_SUCCESS: 'Registro exitoso',
  LOGOUT_SUCCESS: 'Sesión cerrada exitosamente',
  CREATE_SUCCESS: 'Registro creado exitosamente',
  UPDATE_SUCCESS: 'Registro actualizado exitosamente',
  DELETE_SUCCESS: 'Registro eliminado exitosamente',
  PASSWORD_CHANGED: 'Contraseña cambiada exitosamente',
  PROFILE_UPDATED: 'Perfil actualizado exitosamente'
};

// Configuración de paginación
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100]
};

// Configuración de fechas
export const DATE_FORMAT = {
  DISPLAY: 'DD/MM/YYYY',
  API: 'YYYY-MM-DD',
  DATETIME: 'DD/MM/YYYY HH:mm'
};

// Configuración de moneda
export const CURRENCY = {
  SYMBOL: '€',
  LOCALE: 'es-ES'
};

// Configuración de archivos
export const FILE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
  MAX_FILES: 5
};

// Configuración de notificaciones
export const NOTIFICATION = {
  DURATION: 5000, // 5 segundos
  POSITION: 'top-right'
};

// Configuración de búsqueda
export const SEARCH = {
  MIN_LENGTH: 3,
  DEBOUNCE: 300 // 300ms
};

// Configuración de exportación
export const EXPORT = {
  FORMATS: ['xlsx', 'csv', 'pdf'],
  DEFAULT_FORMAT: 'xlsx'
};

// Configuración de impresión
export const PRINT = {
  ORIENTATION: 'portrait',
  FORMAT: 'A4'
}; 
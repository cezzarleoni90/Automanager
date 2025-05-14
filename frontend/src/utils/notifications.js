import { toast } from 'react-toastify';
import { NOTIFICATION } from './constants';

// Configuración por defecto de las notificaciones
const defaultConfig = {
  position: NOTIFICATION.POSITION,
  autoClose: NOTIFICATION.DURATION,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true
};

// Notificación de éxito
export const showSuccess = (message, config = {}) => {
  toast.success(message, {
    ...defaultConfig,
    ...config
  });
};

// Notificación de error
export const showError = (message, config = {}) => {
  toast.error(message, {
    ...defaultConfig,
    ...config
  });
};

// Notificación de advertencia
export const showWarning = (message, config = {}) => {
  toast.warning(message, {
    ...defaultConfig,
    ...config
  });
};

// Notificación de información
export const showInfo = (message, config = {}) => {
  toast.info(message, {
    ...defaultConfig,
    ...config
  });
};

// Notificación de confirmación
export const showConfirm = (message, onConfirm, onCancel) => {
  toast.info(
    <div>
      <p>{message}</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
        <button
          onClick={() => {
            onConfirm();
            toast.dismiss();
          }}
          style={{
            padding: '5px 10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Confirmar
        </button>
        <button
          onClick={() => {
            onCancel?.();
            toast.dismiss();
          }}
          style={{
            padding: '5px 10px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cancelar
        </button>
      </div>
    </div>,
    {
      ...defaultConfig,
      autoClose: false
    }
  );
};

// Notificación de carga
export const showLoading = (message) => {
  return toast.loading(message, {
    ...defaultConfig,
    autoClose: false
  });
};

// Actualizar notificación de carga
export const updateLoading = (toastId, message, type = 'success') => {
  toast.update(toastId, {
    render: message,
    type: type,
    isLoading: false,
    autoClose: NOTIFICATION.DURATION
  });
};

// Cerrar todas las notificaciones
export const closeAllNotifications = () => {
  toast.dismiss();
};

// Notificación de error de red
export const showNetworkError = () => {
  showError('Error de conexión. Por favor, verifica tu conexión a internet.');
};

// Notificación de error de autenticación
export const showAuthError = () => {
  showError('Sesión expirada. Por favor, inicia sesión nuevamente.');
};

// Notificación de error de permisos
export const showPermissionError = () => {
  showError('No tienes permisos para realizar esta acción.');
};

// Notificación de error de validación
export const showValidationError = (errors) => {
  if (Array.isArray(errors)) {
    errors.forEach(error => showError(error));
  } else {
    showError(errors);
  }
};

// Notificación de éxito al crear
export const showCreateSuccess = (entity) => {
  showSuccess(`${entity} creado exitosamente.`);
};

// Notificación de éxito al actualizar
export const showUpdateSuccess = (entity) => {
  showSuccess(`${entity} actualizado exitosamente.`);
};

// Notificación de éxito al eliminar
export const showDeleteSuccess = (entity) => {
  showSuccess(`${entity} eliminado exitosamente.`);
};

// Notificación de confirmación para eliminar
export const showDeleteConfirm = (entity, onConfirm) => {
  showConfirm(
    `¿Estás seguro de que deseas eliminar este ${entity}? Esta acción no se puede deshacer.`,
    onConfirm
  );
}; 
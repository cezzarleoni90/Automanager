// Claves de almacenamiento
const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  SETTINGS: 'settings'
};

// Guardar datos en localStorage
export const setItem = (key, value) => {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error('Error al guardar en localStorage:', error);
  }
};

// Obtener datos de localStorage
export const getItem = (key) => {
  try {
    const serializedValue = localStorage.getItem(key);
    return serializedValue ? JSON.parse(serializedValue) : null;
  } catch (error) {
    console.error('Error al obtener de localStorage:', error);
    return null;
  }
};

// Eliminar datos de localStorage
export const removeItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error al eliminar de localStorage:', error);
  }
};

// Limpiar todo el localStorage
export const clearStorage = () => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error al limpiar localStorage:', error);
  }
};

// Guardar token
export const setToken = (token) => {
  setItem(STORAGE_KEYS.TOKEN, token);
};

// Obtener token
export const getToken = () => {
  return getItem(STORAGE_KEYS.TOKEN);
};

// Eliminar token
export const removeToken = () => {
  removeItem(STORAGE_KEYS.TOKEN);
};

// Guardar usuario
export const setUser = (user) => {
  setItem(STORAGE_KEYS.USER, user);
};

// Obtener usuario
export const getUser = () => {
  return getItem(STORAGE_KEYS.USER);
};

// Eliminar usuario
export const removeUser = () => {
  removeItem(STORAGE_KEYS.USER);
};

// Guardar tema
export const setTheme = (theme) => {
  setItem(STORAGE_KEYS.THEME, theme);
};

// Obtener tema
export const getTheme = () => {
  return getItem(STORAGE_KEYS.THEME) || 'light';
};

// Guardar idioma
export const setLanguage = (language) => {
  setItem(STORAGE_KEYS.LANGUAGE, language);
};

// Obtener idioma
export const getLanguage = () => {
  return getItem(STORAGE_KEYS.LANGUAGE) || 'es';
};

// Guardar configuración
export const setSettings = (settings) => {
  setItem(STORAGE_KEYS.SETTINGS, settings);
};

// Obtener configuración
export const getSettings = () => {
  return getItem(STORAGE_KEYS.SETTINGS) || {};
};

// Verificar si el usuario está autenticado
export const isAuthenticated = () => {
  return !!getToken();
};

// Cerrar sesión
export const logout = () => {
  removeToken();
  removeUser();
  clearStorage();
};

// Guardar datos de sesión
export const saveSession = (token, user) => {
  setToken(token);
  setUser(user);
};

// Obtener datos de sesión
export const getSession = () => {
  return {
    token: getToken(),
    user: getUser()
  };
};

// Verificar si hay datos en el almacenamiento
export const hasStorageData = () => {
  return localStorage.length > 0;
};

// Obtener tamaño del almacenamiento
export const getStorageSize = () => {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length;
    }
  }
  return total;
};

// Verificar si hay espacio disponible
export const hasStorageSpace = () => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  return getStorageSize() < maxSize;
};

// Limpiar datos antiguos
export const cleanOldData = () => {
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días
  const now = Date.now();

  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      try {
        const item = JSON.parse(localStorage[key]);
        if (item.timestamp && now - item.timestamp > maxAge) {
          localStorage.removeItem(key);
        }
      } catch (error) {
        console.error('Error al limpiar datos antiguos:', error);
      }
    }
  }
}; 
@echo off
echo ==============================
echo Corrigiendo AuthContext.js
echo ==============================

echo.
echo Creando copia de respaldo...
copy /Y AuthContext.js AuthContext.js.backup
echo Hecho.

echo.
echo Creando versión corregida...
(
echo import React, { createContext, useContext, useState, useEffect } from 'react';
echo import axios from 'axios';
echo.
echo const AuthContext = createContext(null^);
echo.
echo export const useAuth = (^) =^> {
echo   const context = useContext(AuthContext^);
echo   if (!context^) {
echo     throw new Error('useAuth debe ser usado dentro de un AuthProvider'^);
echo   }
echo   return context;
echo };
echo.
echo export const AuthProvider = ({ children }^) =^> {
echo   const [user, setUser] = useState(null^);
echo   const [loading, setLoading] = useState(true^);
echo.
echo   useEffect((^) =^> {
echo     const token = localStorage.getItem('token'^);
echo     if (token^) {
echo       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
echo       // Aquí podrías hacer una llamada al backend para verificar el token
echo       // y obtener la información del usuario
echo       try {
echo         const userData = localStorage.getItem('user'^);
echo         if (userData^) {
echo           setUser(JSON.parse(userData^)^);
echo         }
echo       } catch (error^) {
echo         console.error('Error al obtener datos del usuario:', error^);
echo         localStorage.removeItem('user'^);
echo       }
echo     }
echo     setLoading(false^);
echo   }, []^);
echo.
echo   const login = async (email, password^) =^> {
echo     try {
echo       const response = await axios.post('http://localhost:5000/api/auth/login', {
echo         email,
echo         password
echo       }^);
echo.
echo       const { token, user } = response.data;
echo       localStorage.setItem('token', token^);
echo       localStorage.setItem('user', JSON.stringify(user^)^);
echo       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
echo       setUser(user^);
echo       return true;
echo     } catch (error^) {
echo       console.error('Error en login:', error^);
echo       throw error;
echo     }
echo   };
echo.
echo   const logout = (^) =^> {
echo     localStorage.removeItem('token'^);
echo     localStorage.removeItem('user'^);
echo     delete axios.defaults.headers.common['Authorization'];
echo     setUser(null^);
echo   };
echo.
echo   const value = {
echo     user,
echo     loading,
echo     isAuthenticated: !!user,
echo     login,
echo     logout
echo   };
echo.
echo   if (loading^) {
echo     return ^<div^>Cargando...^</div^>;
echo   }
echo.
echo   return (
echo     ^<AuthContext.Provider value={value}^>
echo       {children}
echo     ^</AuthContext.Provider^>
echo   ^);
echo };
) > AuthContext.js.new

echo Reemplazando archivo original...
move /Y AuthContext.js.new AuthContext.js
echo Corrección aplicada exitosamente!

echo.
echo ==============================
echo PASOS SIGUIENTES:
echo ==============================
echo 1. Regresa al directorio principal: cd C:\Users\cezza\proyectos
echo 2. Ejecuta restart_servers.cmd para reiniciar los servidores
echo 3. Cuando la aplicación se cargue, abre las herramientas de desarrollador (F12)
echo 4. Ve a Application > Local Storage y elimina todas las entradas
echo 5. Recarga la página (F5) e inicia sesión nuevamente
echo.
echo Presiona cualquier tecla para continuar...
pause > nul
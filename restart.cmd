@echo off
echo =======================================
echo   REINICIANDO SERVICIOS AUTOMANAGER
echo =======================================
echo.

echo [1/4] Deteniendo servicios anteriores si existen...
taskkill /f /im python.exe /fi "WINDOWTITLE eq AutoManager-Backend" >nul 2>&1
taskkill /f /im node.exe /fi "WINDOWTITLE eq AutoManager-Frontend" >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/4] Cambiando al directorio del backend...
cd /d "%~dp0backend"
echo Dir actual: %cd%

echo [3/4] Iniciando servidor backend...
start "AutoManager-Backend" cmd /k "color 0A && echo === SERVIDOR BACKEND === && python app.py"
timeout /t 5 /nobreak >nul

echo [4/4] Iniciando servidor frontend...
cd /d "%~dp0frontend"
echo Dir actual: %cd%
start "AutoManager-Frontend" cmd /k "color 0E && echo === SERVIDOR FRONTEND === && npm start"

echo.
echo =======================================
echo   SERVIDORES INICIADOS CORRECTAMENTE
echo =======================================
echo.
echo Accede a la aplicación en: http://localhost:3000
echo.

timeout /t 5 >nul 
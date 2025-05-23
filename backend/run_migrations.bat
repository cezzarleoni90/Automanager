@echo off
echo Ejecutando migraciones de base de datos...

set FLASK_APP=app.py
set FLASK_ENV=development

echo Inicializando migraciones...
flask db init

echo Creando migración...
flask db migrate -m "add proveedor_id"

echo Aplicando migración...
flask db upgrade

echo Migraciones completadas.
pause 
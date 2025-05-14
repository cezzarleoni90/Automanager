# AutoManager - Sistema de Gestión de Taller Automotriz

AutoManager es un sistema completo para la gestión de talleres automotrices, que permite administrar clientes, vehículos, servicios, mecánicos, inventario y facturación.

## Características Principales

- Gestión de clientes y vehículos
- Registro y seguimiento de servicios
- Control de inventario de repuestos
- Gestión de mecánicos y horas de trabajo
- Facturación y reportes
- Sistema de autenticación y roles de usuario

## Tecnologías Utilizadas

### Backend
- Python 3.8+
- Flask
- SQLAlchemy
- JWT para autenticación
- PostgreSQL

### Frontend
- React
- Material-UI
- Redux Toolkit
- React Router
- Axios

## Requisitos del Sistema

- Python 3.8 o superior
- Node.js 14 o superior
- PostgreSQL 12 o superior
- npm o yarn

## Instalación

### Backend

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/automanager.git
cd automanager/backend
```

2. Crear y activar entorno virtual:
```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

3. Instalar dependencias:
```bash
pip install -r requirements.txt
```

4. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

5. Inicializar la base de datos:
```bash
flask db init
flask db migrate
flask db upgrade
```

6. Ejecutar el servidor:
```bash
flask run
```

### Frontend

1. Navegar al directorio frontend:
```bash
cd ../frontend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. Ejecutar en modo desarrollo:
```bash
npm start
```

## Estructura del Proyecto

```
automanager/
├── backend/
│   ├── blueprints/
│   │   ├── auth.py
│   │   ├── clientes.py
│   │   ├── facturas.py
│   │   ├── inventario.py
│   │   ├── mecanicos.py
│   │   ├── servicios.py
│   │   ├── usuarios.py
│   │   └── vehiculos.py
│   ├── models.py
│   ├── app.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   ├── store/
    │   └── utils/
    ├── package.json
    └── README.md
```

## API Endpoints

### Autenticación
- POST /api/auth/login - Iniciar sesión
- POST /api/auth/register - Registrar usuario
- GET /api/auth/profile - Obtener perfil
- PUT /api/auth/profile - Actualizar perfil
- PUT /api/auth/change-password - Cambiar contraseña

### Usuarios
- GET /api/usuarios - Listar usuarios
- GET /api/usuarios/:id - Obtener usuario
- POST /api/usuarios - Crear usuario
- PUT /api/usuarios/:id - Actualizar usuario
- DELETE /api/usuarios/:id - Eliminar usuario

### Clientes
- GET /api/clientes - Listar clientes
- GET /api/clientes/:id - Obtener cliente
- POST /api/clientes - Crear cliente
- PUT /api/clientes/:id - Actualizar cliente
- GET /api/clientes/:id/servicios - Listar servicios del cliente

### Vehículos
- GET /api/vehiculos - Listar vehículos
- GET /api/vehiculos/:id - Obtener vehículo
- POST /api/vehiculos - Crear vehículo
- PUT /api/vehiculos/:id - Actualizar vehículo
- GET /api/vehiculos/:id/servicios - Listar servicios del vehículo

### Servicios
- GET /api/servicios - Listar servicios
- GET /api/servicios/:id - Obtener servicio
- POST /api/servicios - Crear servicio
- PUT /api/servicios/:id - Actualizar servicio
- POST /api/servicios/:id/horas - Registrar horas
- POST /api/servicios/:id/repuestos - Agregar repuesto

### Mecánicos
- GET /api/mecanicos - Listar mecánicos
- GET /api/mecanicos/:id - Obtener mecánico
- POST /api/mecanicos - Crear mecánico
- PUT /api/mecanicos/:id - Actualizar mecánico
- GET /api/mecanicos/:id/servicios - Listar servicios del mecánico

### Inventario
- GET /api/repuestos - Listar repuestos
- GET /api/repuestos/:id - Obtener repuesto
- POST /api/repuestos - Crear repuesto
- PUT /api/repuestos/:id - Actualizar repuesto
- POST /api/repuestos/:id/movimientos - Registrar movimiento
- GET /api/movimientos-inventario - Listar movimientos

### Facturas
- GET /api/facturas - Listar facturas
- GET /api/facturas/:id - Obtener factura
- PUT /api/facturas/:id/estado - Actualizar estado
- GET /api/servicios/:id/facturas - Listar facturas del servicio

## Configuración de la Base de Datos

### Desarrollo Local (SQLite)
Por defecto, la aplicación usa SQLite para desarrollo local. No es necesario configurar nada adicional.

### Producción (PostgreSQL)
Para usar PostgreSQL en producción, define la variable de entorno `DATABASE_URL` con la cadena de conexión de PostgreSQL. Por ejemplo:

```bash
export DATABASE_URL=postgresql://usuario:contraseña@host:puerto/nombre_db
```

## Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Contacto

Tu Nombre - [@tutwitter](https://twitter.com/tutwitter) - email@example.com

Link del Proyecto: [https://github.com/tu-usuario/automanager](https://github.com/tu-usuario/automanager) 
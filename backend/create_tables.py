import os
import sqlite3

# Eliminar la base de datos existente si existe
if os.path.exists('automanager.db'):
    os.remove('automanager.db')

# Crear nueva conexión a la base de datos
conn = sqlite3.connect('automanager.db')
cursor = conn.cursor()

# Crear tabla cliente
cursor.execute('''
CREATE TABLE cliente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    direccion VARCHAR(200),
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultima_visita DATETIME,
    preferencias TEXT,
    estado VARCHAR(20) DEFAULT 'activo'
)
''')

# Crear tabla vehiculo
cursor.execute('''
CREATE TABLE vehiculo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    año INTEGER NOT NULL,
    placa VARCHAR(20) UNIQUE NOT NULL,
    color VARCHAR(30),
    cliente_id INTEGER NOT NULL,
    kilometraje FLOAT,
    ultimo_servicio DATETIME,
    vin VARCHAR(17) UNIQUE,
    tipo_combustible VARCHAR(20),
    transmision VARCHAR(20),
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    notas TEXT,
    FOREIGN KEY (cliente_id) REFERENCES cliente(id)
)
''')

# Crear tabla mecanico
cursor.execute('''
CREATE TABLE mecanico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    especialidad VARCHAR(100),
    tarifa_hora FLOAT DEFAULT 0.0,
    fecha_contratacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'activo'
)
''')

# Crear tabla proveedor
cursor.execute('''
CREATE TABLE proveedor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    contacto VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(120),
    direccion VARCHAR(200),
    estado VARCHAR(20) DEFAULT 'activo',
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    notas TEXT
)
''')

# Crear tabla repuesto
cursor.execute('''
CREATE TABLE repuesto (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    stock INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 5,
    precio_compra FLOAT NOT NULL,
    precio_venta FLOAT NOT NULL,
    categoria VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'activo',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    proveedor_id INTEGER,
    FOREIGN KEY (proveedor_id) REFERENCES proveedor(id)
)
''')

# Crear tabla servicio
cursor.execute('''
CREATE TABLE servicio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_servicio VARCHAR(50) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_fin DATETIME,
    fecha_estimada_fin DATETIME,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    prioridad VARCHAR(10) DEFAULT 'normal',
    notas TEXT,
    diagnostico TEXT,
    recomendaciones TEXT,
    costo_estimado FLOAT DEFAULT 0,
    costo_real FLOAT DEFAULT 0,
    honorarios FLOAT DEFAULT 0,
    kilometraje_entrada FLOAT,
    kilometraje_salida FLOAT,
    nivel_combustible_entrada FLOAT,
    nivel_combustible_salida FLOAT,
    fecha_aprobacion_cliente DATETIME,
    motivo_cancelacion TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,
    vehiculo_id INTEGER NOT NULL,
    mecanico_id INTEGER,
    cliente_id INTEGER,
    usuario_id INTEGER NOT NULL,
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculo(id),
    FOREIGN KEY (mecanico_id) REFERENCES mecanico(id),
    FOREIGN KEY (cliente_id) REFERENCES cliente(id),
    FOREIGN KEY (usuario_id) REFERENCES usuario(id)
)
''')

# Crear tabla servicio_repuesto (tabla de relación)
cursor.execute('''
CREATE TABLE servicio_repuesto (
    servicio_id INTEGER NOT NULL,
    repuesto_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario FLOAT NOT NULL,
    PRIMARY KEY (servicio_id, repuesto_id),
    FOREIGN KEY (servicio_id) REFERENCES servicio(id),
    FOREIGN KEY (repuesto_id) REFERENCES repuesto(id)
)
''')

# Crear tabla usuario
cursor.execute('''
CREATE TABLE usuario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) DEFAULT '',
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(256),
    rol VARCHAR(20) DEFAULT 'usuario',
    activo BOOLEAN DEFAULT 1,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso DATETIME
)
''')

# Crear usuario administrador
cursor.execute('''
INSERT INTO usuario (nombre, apellido, email, rol)
VALUES ('Administrador', 'Sistema', 'admin@automanager.com', 'administrador')
''')

# Guardar cambios y cerrar conexión
conn.commit()
conn.close()

print("Base de datos creada exitosamente con todas las tablas necesarias.") 
from extensions import db
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
import hashlib
import os
import json
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

# Tablas de relación
servicio_repuesto = db.Table('servicio_repuesto',
    db.Column('servicio_id', db.Integer, db.ForeignKey('servicio.id'), primary_key=True),
    db.Column('repuesto_id', db.Integer, db.ForeignKey('repuesto.id'), primary_key=True),
    db.Column('cantidad', db.Integer, nullable=False),
    db.Column('precio_unitario', db.Float)
)

class Usuario(db.Model):
    __tablename__ = 'usuario'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    apellido = db.Column(db.String(100), nullable=True, default='')
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    rol = db.Column(db.String(20), default='usuario')
    activo = db.Column(db.Boolean, default=True)
    fecha_registro = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    ultimo_acceso = db.Column(db.DateTime)
    licencia_id = db.Column(db.Integer, db.ForeignKey('licencia.id'))
    licencia = db.relationship('Licencia', backref='usuarios')
    clave_activacion = db.Column(db.String(64), unique=True)
    
    # Relaciones
    servicios_creados = db.relationship('Servicio', back_populates='usuario')
    facturas_creadas = db.relationship('Factura', back_populates='usuario')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def is_admin(self):
        return self.rol == 'admin'

    def generar_clave_activacion(self):
        # Genera una clave de activación única basada en el email y fecha de creación
        datos = f"{self.email}{self.fecha_registro.isoformat()}{os.urandom(16).hex()}"
        self.clave_activacion = hashlib.sha256(datos.encode()).hexdigest()[:16].upper()
        return self.clave_activacion

class Licencia(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    codigo_licencia = db.Column(db.String(64), unique=True, nullable=False)
    fecha_inicio = db.Column(db.DateTime, nullable=False)
    fecha_fin = db.Column(db.DateTime, nullable=False)
    tipo = db.Column(db.String(20), nullable=False)  # 'trial' o 'full'
    activa = db.Column(db.Boolean, default=True)
    max_usuarios = db.Column(db.Integer, default=1)
    hash_verificacion = db.Column(db.String(64), nullable=False)
    archivo_licencia = db.Column(db.Text, nullable=False)  # Almacena el archivo de licencia cifrado

    @staticmethod
    def generar_codigo_licencia():
        # Genera un código de licencia único y seguro
        random_bytes = os.urandom(16)
        return hashlib.sha256(random_bytes).hexdigest()[:16].upper()

    @staticmethod
    def generar_clave_cifrado():
        # Genera una clave de cifrado usando PBKDF2
        salt = os.urandom(16)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(os.urandom(32)))
        return key, salt

    @staticmethod
    def crear_archivo_licencia(datos_licencia, clave_cifrado):
        # Cifra los datos de la licencia
        f = Fernet(clave_cifrado)
        datos_json = json.dumps(datos_licencia)
        datos_cifrados = f.encrypt(datos_json.encode())
        return datos_cifrados

    @staticmethod
    def crear_licencia_prueba():
        fecha_inicio = datetime.utcnow()
        fecha_fin = fecha_inicio + timedelta(days=30)
        codigo = Licencia.generar_codigo_licencia()
        
        # Crear datos de licencia
        datos_licencia = {
            'codigo': codigo,
            'tipo': 'trial',
            'fecha_inicio': fecha_inicio.isoformat(),
            'fecha_fin': fecha_fin.isoformat(),
            'max_usuarios': 1,
            'caracteristicas': ['clientes', 'vehiculos', 'servicios', 'inventario']
        }
        
        # Generar clave de cifrado y archivo de licencia
        clave_cifrado, salt = Licencia.generar_clave_cifrado()
        archivo_licencia = Licencia.crear_archivo_licencia(datos_licencia, clave_cifrado)
        
        # Crear hash de verificación
        datos_verificacion = f"{codigo}{fecha_inicio.isoformat()}{fecha_fin.isoformat()}{salt.hex()}"
        hash_verificacion = hashlib.sha256(datos_verificacion.encode()).hexdigest()
        
        return Licencia(
            codigo_licencia=codigo,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            tipo='trial',
            max_usuarios=1,
            hash_verificacion=hash_verificacion,
            archivo_licencia=archivo_licencia.decode()
        )

    @staticmethod
    def crear_licencia_anual():
        fecha_inicio = datetime.utcnow()
        fecha_fin = fecha_inicio + timedelta(days=365)
        codigo = Licencia.generar_codigo_licencia()
        
        # Crear datos de licencia
        datos_licencia = {
            'codigo': codigo,
            'tipo': 'full',
            'fecha_inicio': fecha_inicio.isoformat(),
            'fecha_fin': fecha_fin.isoformat(),
            'max_usuarios': 5,
            'caracteristicas': ['clientes', 'vehiculos', 'servicios', 'inventario', 'reportes', 'exportacion']
        }
        
        # Generar clave de cifrado y archivo de licencia
        clave_cifrado, salt = Licencia.generar_clave_cifrado()
        archivo_licencia = Licencia.crear_archivo_licencia(datos_licencia, clave_cifrado)
        
        # Crear hash de verificación
        datos_verificacion = f"{codigo}{fecha_inicio.isoformat()}{fecha_fin.isoformat()}{salt.hex()}"
        hash_verificacion = hashlib.sha256(datos_verificacion.encode()).hexdigest()
        
        return Licencia(
            codigo_licencia=codigo,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            tipo='full',
            max_usuarios=5,
            hash_verificacion=hash_verificacion,
            archivo_licencia=archivo_licencia.decode()
        )

    def verificar_licencia(self, clave_activacion=None):
        if not self.activa:
            return False
        
        ahora = datetime.utcnow()
        if ahora > self.fecha_fin:
            self.activa = False
            db.session.commit()
            return False
            
        # Verificar número de usuarios
        if len(self.usuarios) >= self.max_usuarios:
            return False
            
        # Si se proporciona una clave de activación, verificar que coincida
        if clave_activacion:
            usuario = Usuario.query.filter_by(clave_activacion=clave_activacion).first()
            if not usuario or usuario.licencia_id != self.id:
                return False
        
        return True

    def obtener_datos_licencia(self, clave_cifrado):
        try:
            f = Fernet(clave_cifrado)
            datos_cifrados = self.archivo_licencia.encode()
            datos_json = f.decrypt(datos_cifrados)
            return json.loads(datos_json)
        except:
            return None

class Cliente(db.Model):
    __tablename__ = 'cliente'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    apellido = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    telefono = db.Column(db.String(20))
    direccion = db.Column(db.String(200))
    fecha_registro = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    ultima_visita = db.Column(db.DateTime)
    preferencias = db.Column(db.JSON)
    estado = db.Column(db.String(20), default='activo')
    
    # Relaciones
    vehiculos = db.relationship('Vehiculo', back_populates='cliente', lazy=True)
    servicios = db.relationship('Servicio', back_populates='cliente', lazy=True)
    facturas = db.relationship('Factura', back_populates='cliente', lazy=True)
    notificaciones = db.relationship('Notificacion', backref='cliente', lazy=True)

class Vehiculo(db.Model):
    __tablename__ = 'vehiculo'
    id = db.Column(db.Integer, primary_key=True)
    marca = db.Column(db.String(50), nullable=False)
    modelo = db.Column(db.String(50), nullable=False)
    año = db.Column(db.Integer, nullable=False)
    placa = db.Column(db.String(20), unique=True, nullable=False)
    color = db.Column(db.String(30))
    cliente_id = db.Column(db.Integer, db.ForeignKey('cliente.id'), nullable=False)
    kilometraje = db.Column(db.Float)
    ultimo_servicio = db.Column(db.DateTime)
    vin = db.Column(db.String(17), unique=True)
    tipo_combustible = db.Column(db.String(20))
    transmision = db.Column(db.String(20))
    fecha_registro = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    notas = db.Column(db.Text)
    
    # Relaciones
    cliente = db.relationship('Cliente', back_populates='vehiculos')
    servicios = db.relationship('Servicio', back_populates='vehiculo', lazy=True)
    facturas = db.relationship('Factura', back_populates='vehiculo', lazy=True)
    historial_mantenimiento = db.relationship('HistorialMantenimiento', backref='vehiculo', lazy=True)

class Mecanico(db.Model):
    __tablename__ = 'mecanico'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    apellido = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    telefono = db.Column(db.String(20))
    especialidad = db.Column(db.String(100))
    fecha_contratacion = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    estado = db.Column(db.String(20), default='activo')
    
    # Relaciones
    servicios = db.relationship('Servicio', back_populates='mecanico', lazy=True)
    eventos = db.relationship('Evento', back_populates='mecanico', lazy=True)
    horas_trabajo = db.relationship('HoraTrabajo', backref='mecanico', lazy=True)

class Servicio(db.Model):
    __tablename__ = 'servicio'
    
    # Estados posibles del servicio
    ESTADOS = {
        'pendiente': 'Pendiente',
        'diagnostico': 'En Diagnóstico',
        'aprobado': 'Aprobado por Cliente',
        'en_progreso': 'En Progreso',
        'pausado': 'Pausado',
        'completado': 'Completado',
        'cancelado': 'Cancelado'
    }
    
    # Prioridades posibles
    PRIORIDADES = {
        'baja': 'Baja',
        'normal': 'Normal',
        'alta': 'Alta',
        'urgente': 'Urgente'
    }
    
    id = db.Column(db.Integer, primary_key=True)
    tipo_servicio = db.Column(db.String(50), nullable=False)
    descripcion = db.Column(db.Text, nullable=False)
    fecha_inicio = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    fecha_fin = db.Column(db.DateTime)
    fecha_estimada_fin = db.Column(db.DateTime)
    estado = db.Column(db.String(20), nullable=False, default='pendiente')
    prioridad = db.Column(db.String(10), default='normal')
    notas = db.Column(db.Text)
    diagnostico = db.Column(db.Text)
    recomendaciones = db.Column(db.Text)
    costo_estimado = db.Column(db.Float)
    costo_real = db.Column(db.Float)
    kilometraje_entrada = db.Column(db.Float)
    kilometraje_salida = db.Column(db.Float)
    nivel_combustible_entrada = db.Column(db.Float)
    nivel_combustible_salida = db.Column(db.Float)
    fecha_aprobacion_cliente = db.Column(db.DateTime)
    motivo_cancelacion = db.Column(db.Text)
    
    # Relaciones
    vehiculo_id = db.Column(db.Integer, db.ForeignKey('vehiculo.id'), nullable=False)
    mecanico_id = db.Column(db.Integer, db.ForeignKey('mecanico.id'))
    cliente_id = db.Column(db.Integer, db.ForeignKey('cliente.id'))
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    
    vehiculo = db.relationship('Vehiculo', back_populates='servicios')
    mecanico = db.relationship('Mecanico', back_populates='servicios')
    cliente = db.relationship('Cliente', back_populates='servicios')
    usuario = db.relationship('Usuario', back_populates='servicios_creados')
    repuestos = db.relationship('Repuesto', secondary='servicio_repuesto', backref='servicios')
    horas_trabajo = db.relationship('HoraTrabajo', backref='servicio', lazy='dynamic')
    facturas = db.relationship('Factura', back_populates='servicio', lazy='dynamic')
    movimientos_inventario = db.relationship('MovimientoInventario', back_populates='servicio', lazy='dynamic')
    historial_estados = db.relationship('HistorialEstado', backref='servicio', lazy='dynamic')
    eventos = db.relationship('Evento', back_populates='servicio', lazy=True)
    archivos = db.relationship('ArchivoServicio', back_populates='servicio', lazy=True)
    fotos = db.relationship('FotoServicio', back_populates='servicio', lazy=True)

    def __init__(self, **kwargs):
        super(Servicio, self).__init__(**kwargs)
        self.registrar_cambio_estado('pendiente', 'Servicio creado')

    def registrar_cambio_estado(self, nuevo_estado, comentario):
        if nuevo_estado not in self.ESTADOS:
            raise ValueError(f"Estado inválido: {nuevo_estado}")
            
        historial = HistorialEstado(
            servicio_id=self.id,
            estado_anterior=self.estado,
            estado_nuevo=nuevo_estado,
            comentario=comentario,
            fecha=datetime.utcnow()
        )
        self.estado = nuevo_estado
        db.session.add(historial)
        
        # Actualizar fechas según el estado
        if nuevo_estado == 'completado':
            self.fecha_fin = datetime.utcnow()
        elif nuevo_estado == 'aprobado':
            self.fecha_aprobacion_cliente = datetime.utcnow()

    def calcular_costo_total(self):
        costo_repuestos = sum(
            m.cantidad * m.repuesto.precio
            for m in self.movimientos_inventario
        )
        costo_horas = sum(
            h.horas * h.mecanico.tarifa_hora
            for h in self.horas_trabajo
        )
        return costo_repuestos + costo_horas

    def actualizar_costo_real(self):
        self.costo_real = self.calcular_costo_total()
        db.session.commit()

    def puede_cambiar_estado(self, nuevo_estado):
        # Definir las transiciones de estado permitidas
        transiciones = {
            'pendiente': ['diagnostico', 'cancelado'],
            'diagnostico': ['aprobado', 'cancelado'],
            'aprobado': ['en_progreso', 'cancelado'],
            'en_progreso': ['pausado', 'completado', 'cancelado'],
            'pausado': ['en_progreso', 'cancelado'],
            'completado': [],
            'cancelado': []
        }
        return nuevo_estado in transiciones.get(self.estado, [])

    def cancelar(self, motivo):
        if not self.puede_cambiar_estado('cancelado'):
            raise ValueError("No se puede cancelar el servicio en su estado actual")
        self.motivo_cancelacion = motivo
        self.registrar_cambio_estado('cancelado', f'Servicio cancelado: {motivo}')

    def completar(self):
        if not self.puede_cambiar_estado('completado'):
            raise ValueError("No se puede completar el servicio en su estado actual")
        self.actualizar_costo_real()
        self.registrar_cambio_estado('completado', 'Servicio completado')

    def pausar(self, motivo):
        if not self.puede_cambiar_estado('pausado'):
            raise ValueError("No se puede pausar el servicio en su estado actual")
        self.registrar_cambio_estado('pausado', f'Servicio pausado: {motivo}')

    def reanudar(self):
        if not self.puede_cambiar_estado('en_progreso'):
            raise ValueError("No se puede reanudar el servicio en su estado actual")
        self.registrar_cambio_estado('en_progreso', 'Servicio reanudado')

    def aprobar_por_cliente(self):
        if not self.puede_cambiar_estado('aprobado'):
            raise ValueError("No se puede aprobar el servicio en su estado actual")
        self.registrar_cambio_estado('aprobado', 'Servicio aprobado por el cliente')

    def iniciar_diagnostico(self):
        if not self.puede_cambiar_estado('diagnostico'):
            raise ValueError("No se puede iniciar el diagnóstico en el estado actual")
        self.registrar_cambio_estado('diagnostico', 'Iniciando diagnóstico del servicio')

    def iniciar_trabajo(self):
        if not self.puede_cambiar_estado('en_progreso'):
            raise ValueError("No se puede iniciar el trabajo en el estado actual")
        self.registrar_cambio_estado('en_progreso', 'Iniciando trabajo en el servicio')

class HistorialEstado(db.Model):
    __tablename__ = 'historial_estados'
    
    id = db.Column(db.Integer, primary_key=True)
    servicio_id = db.Column(db.Integer, db.ForeignKey('servicio.id'), nullable=False)
    estado_anterior = db.Column(db.String(20), nullable=False)
    estado_nuevo = db.Column(db.String(20), nullable=False)
    comentario = db.Column(db.Text)
    fecha = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    
    usuario = db.relationship('Usuario', backref='cambios_estado')

class Repuesto(db.Model):
    __tablename__ = 'repuesto'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    codigo = db.Column(db.String(50), unique=True, nullable=False)
    descripcion = db.Column(db.Text)
    stock = db.Column(db.Integer, default=0)
    stock_minimo = db.Column(db.Integer, default=5)
    precio_compra = db.Column(db.Float, nullable=False)
    precio_venta = db.Column(db.Float, nullable=False)
    categoria = db.Column(db.String(50))
    estado = db.Column(db.String(20), default='activo')
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    movimientos = db.relationship('MovimientoInventario', back_populates='repuesto')
    
    __table_args__ = (
        db.UniqueConstraint('codigo', name='uq_repuesto_codigo'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'codigo': self.codigo,
            'descripcion': self.descripcion,
            'stock': self.stock,
            'stock_minimo': self.stock_minimo,
            'precio_compra': self.precio_compra,
            'precio_venta': self.precio_venta,
            'categoria': self.categoria,
            'estado': self.estado,
            'fecha_creacion': self.fecha_creacion.isoformat(),
            'fecha_actualizacion': self.fecha_actualizacion.isoformat()
        }

class Evento(db.Model):
    __tablename__ = 'evento'
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.Text)
    fecha_inicio = db.Column(db.DateTime, nullable=False)
    fecha_fin = db.Column(db.DateTime, nullable=False)
    tipo = db.Column(db.String(50))
    estado = db.Column(db.String(20), default='pendiente')
    servicio_id = db.Column(db.Integer, db.ForeignKey('servicio.id'))
    mecanico_id = db.Column(db.Integer, db.ForeignKey('mecanico.id'))
    color = db.Column(db.String(20))
    recordatorio = db.Column(db.Boolean, default=True)
    recordatorio_enviado = db.Column(db.Boolean, default=False)
    
    # Relaciones
    servicio = db.relationship('Servicio', back_populates='eventos')
    mecanico = db.relationship('Mecanico', back_populates='eventos')
    notificaciones = db.relationship('Notificacion', backref='evento', lazy=True)

class HoraTrabajo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    mecanico_id = db.Column(db.Integer, db.ForeignKey('mecanico.id'), nullable=False)
    fecha = db.Column(db.Date, nullable=False)
    horas_trabajadas = db.Column(db.Float, nullable=False)
    tipo_trabajo = db.Column(db.String(50))
    servicio_id = db.Column(db.Integer, db.ForeignKey('servicio.id'))
    notas = db.Column(db.Text)

class MovimientoInventario(db.Model):
    __tablename__ = 'movimiento_inventario'
    
    id = db.Column(db.Integer, primary_key=True)
    repuesto_id = db.Column(db.Integer, db.ForeignKey('repuesto.id'), nullable=False)
    tipo = db.Column(db.String(20), nullable=False)  # entrada/salida
    cantidad = db.Column(db.Integer, nullable=False)
    fecha = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    servicio_id = db.Column(db.Integer, db.ForeignKey('servicio.id'))
    notas = db.Column(db.Text)
    
    # Relaciones
    repuesto = db.relationship('Repuesto', back_populates='movimientos')
    usuario = db.relationship('Usuario', backref='movimientos_inventario')
    servicio = db.relationship('Servicio', back_populates='movimientos_inventario')

    def to_dict(self):
        return {
            'id': self.id,
            'tipo': self.tipo,
            'cantidad': self.cantidad,
            'fecha': self.fecha.isoformat(),
            'repuesto': {
                'id': self.repuesto.id,
                'nombre': self.repuesto.nombre,
                'codigo': self.repuesto.codigo
            },
            'servicio': {
                'id': self.servicio.id,
                'tipo': self.servicio.tipo_servicio
            } if self.servicio else None,
            'usuario': f"{self.usuario.nombre} {self.usuario.apellido}" if self.usuario else None,
            'notas': self.notas
        }

class Factura(db.Model):
    __tablename__ = 'factura'
    id = db.Column(db.Integer, primary_key=True)
    numero = db.Column(db.String(20), unique=True, nullable=False)
    cliente_id = db.Column(db.Integer, db.ForeignKey('cliente.id'), nullable=False)
    vehiculo_id = db.Column(db.Integer, db.ForeignKey('vehiculo.id'))
    servicio_id = db.Column(db.Integer, db.ForeignKey('servicio.id'))
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    fecha_emision = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    fecha_vencimiento = db.Column(db.DateTime)
    subtotal = db.Column(db.Float, nullable=False)
    impuestos = db.Column(db.Float, default=0)
    total = db.Column(db.Float, nullable=False)
    estado = db.Column(db.String(20), default='pendiente')
    metodo_pago = db.Column(db.String(50))
    notas = db.Column(db.Text)
    
    # Relaciones
    cliente = db.relationship('Cliente', back_populates='facturas')
    vehiculo = db.relationship('Vehiculo', back_populates='facturas')
    servicio = db.relationship('Servicio', back_populates='facturas')
    usuario = db.relationship('Usuario', back_populates='facturas_creadas')
    pagos = db.relationship('Pago', backref='factura', lazy=True)

class Pago(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    factura_id = db.Column(db.Integer, db.ForeignKey('factura.id'), nullable=False)
    monto = db.Column(db.Float, nullable=False)
    fecha = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    metodo_pago = db.Column(db.String(50), nullable=False)
    referencia = db.Column(db.String(100))
    estado = db.Column(db.String(20), default='completado')
    notas = db.Column(db.Text)

class HistorialMantenimiento(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vehiculo_id = db.Column(db.Integer, db.ForeignKey('vehiculo.id'), nullable=False)
    fecha = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    tipo_mantenimiento = db.Column(db.String(50), nullable=False)
    descripcion = db.Column(db.Text)
    kilometraje = db.Column(db.Float)
    costo = db.Column(db.Float)
    servicio_id = db.Column(db.Integer, db.ForeignKey('servicio.id'))
    notas = db.Column(db.Text)

class Notificacion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(db.String(50), nullable=False)
    mensaje = db.Column(db.Text, nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    fecha_envio = db.Column(db.DateTime)
    estado = db.Column(db.String(20), default='pendiente')
    destinatario_id = db.Column(db.Integer, db.ForeignKey('cliente.id'))
    servicio_id = db.Column(db.Integer, db.ForeignKey('servicio.id'))
    evento_id = db.Column(db.Integer, db.ForeignKey('evento.id'))
    enviada = db.Column(db.Boolean, default=False)

class Configuracion(db.Model):
    __tablename__ = 'configuracion'
    
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(100), nullable=False, default='AutoManager')
    subtitulo = db.Column(db.String(200), nullable=True)
    logo = db.Column(db.String(200), nullable=True)
    fondo = db.Column(db.String(200), nullable=True)
    colores = db.Column(db.JSON, nullable=True, default={
        'primario': '#1976d2',
        'secundario': '#dc004e',
        'fondo': '#f5f5f5'
    })
    etiquetas = db.Column(db.JSON, nullable=True, default={
        'vehiculos': ['Sedan', 'SUV', 'Pickup', 'Van'],
        'servicios': ['Mantenimiento', 'Reparación', 'Diagnóstico'],
        'estados': ['Pendiente', 'En Proceso', 'Completado', 'Cancelado']
    })
    fecha_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'titulo': self.titulo,
            'subtitulo': self.subtitulo,
            'logo': self.logo,
            'fondo': self.fondo,
            'colores': self.colores,
            'etiquetas': self.etiquetas,
            'fecha_actualizacion': self.fecha_actualizacion.isoformat() if self.fecha_actualizacion else None
        }

class ArchivoServicio(db.Model):
    __tablename__ = 'archivo_servicio'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text)
    ruta_archivo = db.Column(db.String(500), nullable=False)
    tipo_archivo = db.Column(db.String(50))
    fecha_subida = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relaciones
    servicio_id = db.Column(db.Integer, db.ForeignKey('servicio.id'), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    
    servicio = db.relationship('Servicio', back_populates='archivos')
    usuario = db.relationship('Usuario', backref='archivos_servicio')

class FotoServicio(db.Model):
    __tablename__ = 'foto_servicio'
    
    id = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.Text)
    ruta_foto = db.Column(db.String(500), nullable=False)
    fecha_toma = db.Column(db.DateTime, default=datetime.utcnow)
    es_camara = db.Column(db.Boolean, default=False)
    
    # Relaciones
    servicio_id = db.Column(db.Integer, db.ForeignKey('servicio.id'), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    
    servicio = db.relationship('Servicio', back_populates='fotos')
    usuario = db.relationship('Usuario', backref='fotos_servicio') 
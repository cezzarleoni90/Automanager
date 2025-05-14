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
    
    # Nuevos campos para forma de pago
    tipo_pago = db.Column(db.String(20), default='tarifa_hora')  # 'tarifa_hora', 'salario', 'porcentaje'
    tarifa_hora = db.Column(db.Float, nullable=True)  # Para pago por hora
    salario_mensual = db.Column(db.Float, nullable=True)  # Para salario fijo
    porcentaje_servicio = db.Column(db.Float, nullable=True)  # Porcentaje sobre servicios
    
    # Relaciones
    servicios = db.relationship('Servicio', back_populates='mecanico', lazy=True)
    eventos = db.relationship('Evento', back_populates='mecanico', lazy=True)
    horas_trabajo = db.relationship('HoraTrabajo', backref='mecanico', lazy=True) 
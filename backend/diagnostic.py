from backend.app import create_app
from backend.models import db, Usuario, Repuesto, Proveedor, MovimientoInventario, Servicio, Cliente, Vehiculo, Mecanico, Factura, Pago, HistorialMantenimiento, Notificacion, Configuracion, Evento, HoraTrabajo, HistorialEstado, ArchivoServicio, FotoServicio

app = create_app()

with app.app_context():
    try:
        db.create_all()
        print("Tablas creadas correctamente")
    except Exception as e:
        print(f"Error al crear las tablas: {e}") 
from app import app
from extensions import db
from models import Usuario, Cliente, Vehiculo, Mecanico, Servicio, Repuesto, Factura, Evento
from datetime import datetime, timezone
import os

def create_tables():
    with app.app_context():
        try:
            # Eliminar todas las tablas existentes
            db.drop_all()
            print("Tablas existentes eliminadas")
            
            # Crear todas las tablas
            db.create_all()
            print("Nuevas tablas creadas")
            
            # Crear usuario administrador
            admin = Usuario(
                nombre='Administrador',
                email='admin@automanager.com',
                rol='admin',
                fecha_registro=datetime.now(timezone.utc),
                activo=True
            )
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print("Usuario administrador creado")
            
            # Crear cliente de prueba
            cliente = Cliente(
                nombre='Juan',
                apellido='Pérez',
                email='juan@ejemplo.com',
                telefono='123456789',
                direccion='Calle Principal 123',
                fecha_registro=datetime.now(timezone.utc)
            )
            db.session.add(cliente)
            db.session.commit()
            print("Cliente de prueba creado")
            
            # Crear mecánico de prueba
            mecanico = Mecanico(
                nombre='Carlos',
                apellido='Rodríguez',
                email='carlos@automanager.com',
                telefono='987654321',
                especialidad='Mecánica General',
                fecha_contratacion=datetime.now(timezone.utc),
                activo=True,
                tarifa_hora=25.00
            )
            db.session.add(mecanico)
            db.session.commit()
            print("Mecánico de prueba creado")
            
            # Crear vehículo de prueba
            vehiculo = Vehiculo(
                marca='Toyota',
                modelo='Corolla',
                año=2020,
                placa='ABC123',
                color='Rojo',
                cliente_id=1,  # ID del cliente creado
                kilometraje=15000,
                tipo_combustible='gasolina',
                transmision='automatico',
                fecha_registro=datetime.now(timezone.utc)
            )
            db.session.add(vehiculo)
            db.session.commit()
            print("Vehículo de prueba creado")
            
            # Crear servicio de prueba
            servicio = Servicio(
                cliente_id=1,  # ID del cliente creado
                vehiculo_id=1,  # ID del vehículo creado
                mecanico_id=1,  # ID del mecánico creado
                usuario_id=1,  # ID del admin creado
                tipo_servicio='Mantenimiento General',
                descripcion='Cambio de aceite y filtros',
                fecha_inicio=datetime.now(timezone.utc),
                fecha_estimada_fin=datetime.now(timezone.utc),
                estado='pendiente',
                prioridad='normal',
                notas='Servicio de prueba',
                diagnostico='Diagnóstico inicial',
                recomendaciones='Recomendaciones de mantenimiento',
                costo_estimado=150.00,
                costo_real=0.00,
                kilometraje_entrada=15000,
                kilometraje_salida=0,
                nivel_combustible_entrada=75.5,
                nivel_combustible_salida=0,
                fecha_aprobacion_cliente=None,
                motivo_cancelacion=None
            )
            db.session.add(servicio)
            db.session.commit()
            print("Servicio de prueba creado")
            
            # Crear repuestos de prueba
            repuestos = [
                Repuesto(
                    nombre='Aceite de Motor',
                    descripcion='Aceite sintético 5W-30',
                    marca='Toyota',
                    modelo_compatible='Corolla 2020',
                    precio_compra=25.00,
                    precio_venta=35.00,
                    stock=20,
                    stock_minimo=5,
                    ubicacion='Estante A1',
                    proveedor='Distribuidor XYZ'
                ),
                Repuesto(
                    nombre='Filtro de Aceite',
                    descripcion='Filtro compatible Toyota',
                    marca='Toyota',
                    modelo_compatible='Corolla 2020',
                    precio_compra=15.00,
                    precio_venta=25.00,
                    stock=15,
                    stock_minimo=3,
                    ubicacion='Estante B2',
                    proveedor='Distribuidor XYZ'
                )
            ]
            for repuesto in repuestos:
                db.session.add(repuesto)
            db.session.commit()
            print("Repuestos de prueba creados")
            
            # Crear factura de prueba
            factura = Factura(
                numero='F001-001',
                cliente_id=1,  # ID del cliente creado
                vehiculo_id=1,  # ID del vehículo creado
                servicio_id=1,  # ID del servicio creado
                usuario_id=1,  # ID del admin creado
                fecha_emision=datetime.now(timezone.utc),
                fecha_vencimiento=datetime.now(timezone.utc),
                subtotal=150.00,
                impuestos=27.00,
                total=177.00,
                estado='pendiente',
                metodo_pago='efectivo'
            )
            db.session.add(factura)
            db.session.commit()
            print("Factura de prueba creada")
            
            # Crear evento de prueba
            evento = Evento(
                titulo='Mantenimiento Toyota Corolla',
                descripcion='Cambio de aceite y filtros',
                fecha_inicio=datetime.now(timezone.utc),
                fecha_fin=datetime.now(timezone.utc),
                mecanico_id=1,  # ID del mecánico creado
                servicio_id=1,  # ID del servicio creado
                estado='pendiente',
                color='#1976d2'
            )
            db.session.add(evento)
            db.session.commit()
            print("Evento de prueba creado")
            
            print("Base de datos inicializada con datos de prueba")
            
        except Exception as e:
            print(f"Error al crear la base de datos: {str(e)}")
            db.session.rollback()
            raise e

if __name__ == '__main__':
    try:
        # Eliminar la base de datos existente si existe
        if os.path.exists('automanager.db'):
            os.remove('automanager.db')
            print("Base de datos anterior eliminada")
        
        # Crear nuevas tablas y datos de prueba
        create_tables()
        print("Proceso completado exitosamente")
    except Exception as e:
        print(f"Error en el proceso: {str(e)}") 
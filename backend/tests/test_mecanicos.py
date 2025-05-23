import pytest
from datetime import datetime, timezone, timedelta
from ..models import db, Mecanico, Servicio, HoraTrabajo
from ..validators import MecanicoValidator

def test_create_mecanico(app, client):
    """Test crear un mecánico"""
    with app.app_context():
        # Crear mecánico con tarifa por hora
        mecanico = Mecanico(
            nombre='Juan',
            apellido='Pérez',
            email='juan@example.com',
            telefono='123456789',
            especialidad='Motor',
            tarifa_hora=50.0,
            tipo_pago='tarifa_hora'
        )
        db.session.add(mecanico)
        db.session.commit()

        assert mecanico.id is not None
        assert mecanico.nombre == 'Juan'
        assert mecanico.tipo_pago == 'tarifa_hora'
        assert mecanico.tarifa_hora == 50.0
        assert mecanico.salario_mensual is None
        assert mecanico.porcentaje_servicio is None

        # Crear mecánico con salario fijo
        mecanico2 = Mecanico(
            nombre='María',
            apellido='González',
            email='maria@example.com',
            especialidad='Electricidad',
            salario_mensual=2000.0,
            tipo_pago='salario'
        )
        db.session.add(mecanico2)
        db.session.commit()

        assert mecanico2.id is not None
        assert mecanico2.tipo_pago == 'salario'
        assert mecanico2.salario_mensual == 2000.0
        assert mecanico2.tarifa_hora is None
        assert mecanico2.porcentaje_servicio is None

def test_update_mecanico(app, client):
    """Test actualizar un mecánico"""
    with app.app_context():
        # Crear mecánico inicial
        mecanico = Mecanico(
            nombre='Carlos',
            apellido='Rodríguez',
            email='carlos@example.com',
            tarifa_hora=45.0,
            tipo_pago='tarifa_hora'
        )
        db.session.add(mecanico)
        db.session.commit()

        # Actualizar a salario fijo
        mecanico.tipo_pago = 'salario'
        mecanico.salario_mensual = 1800.0
        mecanico.tarifa_hora = None
        db.session.commit()

        assert mecanico.tipo_pago == 'salario'
        assert mecanico.salario_mensual == 1800.0
        assert mecanico.tarifa_hora is None

def test_calcular_horas_trabajadas(app, client):
    """Test cálculo de horas trabajadas"""
    with app.app_context():
        # Crear mecánico
        mecanico = Mecanico(
            nombre='Ana',
            apellido='Martínez',
            email='ana@example.com',
            tarifa_hora=55.0,
            tipo_pago='tarifa_hora'
        )
        db.session.add(mecanico)
        db.session.commit()

        # Crear servicio
        servicio = Servicio(
            titulo='Reparación de motor',
            descripcion='Cambio de aceite y filtros',
            estado='en_progreso',
            fecha_inicio=datetime.now(timezone.utc)
        )
        db.session.add(servicio)
        db.session.commit()

        # Registrar horas de trabajo
        hora1 = HoraTrabajo(
            mecanico_id=mecanico.id,
            servicio_id=servicio.id,
            fecha=datetime.now(timezone.utc),
            horas_trabajadas=4.5
        )
        hora2 = HoraTrabajo(
            mecanico_id=mecanico.id,
            servicio_id=servicio.id,
            fecha=datetime.now(timezone.utc) + timedelta(days=1),
            horas_trabajadas=3.0
        )
        db.session.add_all([hora1, hora2])
        db.session.commit()

        # Calcular horas totales
        horas = mecanico.calcular_horas_trabajadas()
        assert horas == 7.5

        # Calcular ingresos
        ingresos = mecanico.calcular_ingresos()
        assert ingresos == 7.5 * 55.0

def test_verificar_disponibilidad(app, client):
    """Test verificación de disponibilidad"""
    with app.app_context():
        # Crear mecánico
        mecanico = Mecanico(
            nombre='Pedro',
            apellido='Sánchez',
            email='pedro@example.com',
            tarifa_hora=60.0,
            tipo_pago='tarifa_hora'
        )
        db.session.add(mecanico)
        db.session.commit()

        # Crear servicio existente
        servicio = Servicio(
            titulo='Revisión general',
            descripcion='Revisión completa del vehículo',
            estado='en_progreso',
            fecha_inicio=datetime.now(timezone.utc),
            fecha_fin=datetime.now(timezone.utc) + timedelta(days=2),
            mecanico_id=mecanico.id
        )
        db.session.add(servicio)
        db.session.commit()

        # Verificar disponibilidad en período ocupado
        fecha_inicio = datetime.now(timezone.utc) + timedelta(days=1)
        fecha_fin = fecha_inicio + timedelta(days=1)
        disponible = mecanico.verificar_disponibilidad(fecha_inicio, fecha_fin)
        assert not disponible

        # Verificar disponibilidad en período libre
        fecha_inicio = datetime.now(timezone.utc) + timedelta(days=3)
        fecha_fin = fecha_inicio + timedelta(days=1)
        disponible = mecanico.verificar_disponibilidad(fecha_inicio, fecha_fin)
        assert disponible 
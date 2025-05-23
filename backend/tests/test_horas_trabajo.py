import pytest
from datetime import datetime, timezone, timedelta
from ..models import db, Mecanico, Servicio, HoraTrabajo
from ..validators import HoraTrabajoValidator

def test_create_hora_trabajo(app, client):
    """Test crear un registro de horas de trabajo"""
    with app.app_context():
        # Crear mecánico
        mecanico = Mecanico(
            nombre='Luis',
            apellido='García',
            email='luis@example.com',
            tarifa_hora=65.0,
            tipo_pago='tarifa_hora'
        )
        db.session.add(mecanico)
        db.session.commit()

        # Crear servicio
        servicio = Servicio(
            titulo='Diagnóstico eléctrico',
            descripcion='Revisión del sistema eléctrico',
            estado='en_progreso',
            fecha_inicio=datetime.now(timezone.utc)
        )
        db.session.add(servicio)
        db.session.commit()

        # Crear registro de horas
        hora = HoraTrabajo(
            mecanico_id=mecanico.id,
            servicio_id=servicio.id,
            fecha=datetime.now(timezone.utc),
            horas_trabajadas=5.0,
            descripcion='Diagnóstico inicial'
        )
        db.session.add(hora)
        db.session.commit()

        assert hora.id is not None
        assert hora.mecanico_id == mecanico.id
        assert hora.servicio_id == servicio.id
        assert hora.horas_trabajadas == 5.0
        assert hora.descripcion == 'Diagnóstico inicial'

def test_calcular_costo_tarifa_hora(app, client):
    """Test cálculo de costo con tarifa por hora"""
    with app.app_context():
        # Crear mecánico con tarifa por hora
        mecanico = Mecanico(
            nombre='Roberto',
            apellido='Díaz',
            email='roberto@example.com',
            tarifa_hora=70.0,
            tipo_pago='tarifa_hora'
        )
        db.session.add(mecanico)
        db.session.commit()

        # Crear servicio
        servicio = Servicio(
            titulo='Reparación de transmisión',
            descripcion='Cambio de aceite de transmisión',
            estado='en_progreso',
            fecha_inicio=datetime.now(timezone.utc)
        )
        db.session.add(servicio)
        db.session.commit()

        # Crear registro de horas
        hora = HoraTrabajo(
            mecanico_id=mecanico.id,
            servicio_id=servicio.id,
            fecha=datetime.now(timezone.utc),
            horas_trabajadas=3.5
        )
        db.session.add(hora)
        db.session.commit()

        # Calcular costo
        costo = hora.calcular_costo()
        assert costo == 3.5 * 70.0

def test_calcular_costo_salario(app, client):
    """Test cálculo de costo con salario fijo"""
    with app.app_context():
        # Crear mecánico con salario fijo
        mecanico = Mecanico(
            nombre='Carmen',
            apellido='López',
            email='carmen@example.com',
            salario_mensual=2500.0,
            tipo_pago='salario'
        )
        db.session.add(mecanico)
        db.session.commit()

        # Crear servicio
        servicio = Servicio(
            titulo='Mantenimiento preventivo',
            descripcion='Revisión general y ajustes',
            estado='en_progreso',
            fecha_inicio=datetime.now(timezone.utc)
        )
        db.session.add(servicio)
        db.session.commit()

        # Crear registro de horas
        hora = HoraTrabajo(
            mecanico_id=mecanico.id,
            servicio_id=servicio.id,
            fecha=datetime.now(timezone.utc),
            horas_trabajadas=4.0
        )
        db.session.add(hora)
        db.session.commit()

        # Calcular costo (proporcional al salario mensual)
        costo = hora.calcular_costo()
        horas_mes = 8 * 30  # 8 horas por día, 30 días
        costo_esperado = (4.0 / horas_mes) * 2500.0
        assert abs(costo - costo_esperado) < 0.01

def test_calcular_costo_porcentaje(app, client):
    """Test cálculo de costo con porcentaje del servicio"""
    with app.app_context():
        # Crear mecánico con porcentaje
        mecanico = Mecanico(
            nombre='Miguel',
            apellido='Torres',
            email='miguel@example.com',
            porcentaje_servicio=15.0,
            tipo_pago='porcentaje'
        )
        db.session.add(mecanico)
        db.session.commit()

        # Crear servicio con costo
        servicio = Servicio(
            titulo='Reconstrucción de motor',
            descripcion='Reconstrucción completa',
            estado='en_progreso',
            fecha_inicio=datetime.now(timezone.utc),
            costo_real=5000.0
        )
        db.session.add(servicio)
        db.session.commit()

        # Crear registro de horas
        hora = HoraTrabajo(
            mecanico_id=mecanico.id,
            servicio_id=servicio.id,
            fecha=datetime.now(timezone.utc),
            horas_trabajadas=8.0
        )
        db.session.add(hora)
        db.session.commit()

        # Calcular costo (porcentaje del costo del servicio)
        costo = hora.calcular_costo()
        assert costo == 5000.0 * (15.0 / 100.0)

def test_validar_horas_maximas(app, client):
    """Test validación de horas máximas por día"""
    with app.app_context():
        # Crear mecánico
        mecanico = Mecanico(
            nombre='Sofía',
            apellido='Ruiz',
            email='sofia@example.com',
            tarifa_hora=75.0,
            tipo_pago='tarifa_hora'
        )
        db.session.add(mecanico)
        db.session.commit()

        # Crear servicio
        servicio = Servicio(
            titulo='Reparación de suspensión',
            descripcion='Cambio de amortiguadores',
            estado='en_progreso',
            fecha_inicio=datetime.now(timezone.utc)
        )
        db.session.add(servicio)
        db.session.commit()

        # Intentar registrar más de 24 horas en un día
        fecha = datetime.now(timezone.utc)
        hora1 = HoraTrabajo(
            mecanico_id=mecanico.id,
            servicio_id=servicio.id,
            fecha=fecha,
            horas_trabajadas=12.0
        )
        db.session.add(hora1)
        db.session.commit()

        # Intentar registrar más horas el mismo día
        hora2 = HoraTrabajo(
            mecanico_id=mecanico.id,
            servicio_id=servicio.id,
            fecha=fecha,
            horas_trabajadas=13.0
        )
        db.session.add(hora2)
        
        # Debería fallar la validación
        with pytest.raises(Exception):
            db.session.commit() 
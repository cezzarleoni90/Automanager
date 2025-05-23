from datetime import datetime
from sqlalchemy.exc import IntegrityError
from flask import current_app

class ServicioValidator:
    @staticmethod
    def validate_estado_transition(estado_actual, nuevo_estado):
        """Valida la transición de estado de un servicio"""
        transiciones_permitidas = {
            'pendiente': ['diagnostico', 'cancelado'],
            'diagnostico': ['aprobado', 'cancelado'],
            'aprobado': ['en_progreso', 'cancelado'],
            'en_progreso': ['pausado', 'completado', 'cancelado'],
            'pausado': ['en_progreso', 'cancelado'],
            'completado': [],
            'cancelado': []
        }
        
        if nuevo_estado not in transiciones_permitidas.get(estado_actual, []):
            raise ValueError(f"Transición de estado no permitida: {estado_actual} -> {nuevo_estado}")
        return True

    @staticmethod
    def validate_fechas(fecha_inicio, fecha_fin=None, fecha_estimada_fin=None):
        """Valida las fechas de un servicio"""
        if fecha_inicio and fecha_fin and fecha_inicio > fecha_fin:
            raise ValueError("La fecha de inicio no puede ser posterior a la fecha de fin")
        
        if fecha_inicio and fecha_estimada_fin and fecha_inicio > fecha_estimada_fin:
            raise ValueError("La fecha de inicio no puede ser posterior a la fecha estimada de fin")
        
        return True

    @staticmethod
    def validate_costo(costo_estimado, costo_real):
        """Valida los costos de un servicio"""
        if costo_estimado < 0 or costo_real < 0:
            raise ValueError("Los costos no pueden ser negativos")
        return True

class MecanicoValidator:
    @staticmethod
    def validate_tarifa(tarifa_hora, tipo_pago):
        """Valida la tarifa del mecánico según su tipo de pago"""
        if tipo_pago == 'tarifa_hora' and (tarifa_hora is None or tarifa_hora <= 0):
            raise ValueError("La tarifa por hora debe ser mayor que 0")
        return True

    @staticmethod
    def validate_disponibilidad(fecha_inicio, fecha_fin, mecanico_id, db):
        """Valida la disponibilidad del mecánico en un rango de fechas"""
        from models import Servicio, Evento
        
        # Verificar servicios existentes
        servicios_solapados = Servicio.query.filter(
            Servicio.mecanico_id == mecanico_id,
            Servicio.estado.in_(['en_progreso', 'diagnostico']),
            Servicio.fecha_inicio <= fecha_fin,
            Servicio.fecha_fin >= fecha_inicio
        ).first()
        
        if servicios_solapados:
            raise ValueError("El mecánico tiene servicios programados en ese horario")
        
        # Verificar eventos existentes
        eventos_solapados = Evento.query.filter(
            Evento.mecanico_id == mecanico_id,
            Evento.fecha_inicio <= fecha_fin,
            Evento.fecha_fin >= fecha_inicio
        ).first()
        
        if eventos_solapados:
            raise ValueError("El mecánico tiene eventos programados en ese horario")
        
        return True

class HoraTrabajoValidator:
    @staticmethod
    def validate_horas(horas_trabajadas, fecha, mecanico_id, servicio_id, db):
        """Valida las horas de trabajo registradas"""
        from models import HoraTrabajo
        
        # Verificar que no exceda las horas máximas diarias
        horas_dia = HoraTrabajo.query.filter(
            HoraTrabajo.mecanico_id == mecanico_id,
            HoraTrabajo.fecha == fecha
        ).with_entities(db.func.sum(HoraTrabajo.horas_trabajadas)).scalar() or 0
        
        if horas_dia + horas_trabajadas > 24:
            raise ValueError("No se pueden registrar más de 24 horas de trabajo por día")
        
        return True 
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from models import Cliente, Vehiculo, Servicio, Mecanico, Factura, Inventario
from extensions import db
from sqlalchemy import func, and_
from datetime import datetime, timedelta

bp = Blueprint('dashboard', __name__)

@bp.route('/', methods=['GET'])
@jwt_required()
def get_estadisticas():
    try:
        # Estadísticas generales
        total_clientes = Cliente.query.count()
        total_vehiculos = Vehiculo.query.count()
        total_servicios = Servicio.query.count()
        total_mecanicos = Mecanico.query.count()
        
        # Servicios por estado
        servicios_por_estado = db.session.query(
            Servicio.estado, 
            func.count(Servicio.id)
        ).group_by(Servicio.estado).all()
        
        # Servicios de los últimos 30 días
        fecha_limite = datetime.now() - timedelta(days=30)
        servicios_recientes = Servicio.query.filter(
            Servicio.fecha_inicio >= fecha_limite
        ).count()
        
        # Ingresos de los últimos 30 días
        ingresos_recientes = db.session.query(
            func.sum(Factura.total)
        ).join(Servicio).filter(
            Servicio.fecha_inicio >= fecha_limite,
            Servicio.estado == 'completado'
        ).scalar() or 0
        
        return jsonify({
            'estadisticas_generales': {
                'total_clientes': total_clientes,
                'total_vehiculos': total_vehiculos,
                'total_servicios': total_servicios,
                'total_mecanicos': total_mecanicos
            },
            'servicios_por_estado': dict(servicios_por_estado),
            'ultimos_30_dias': {
                'servicios': servicios_recientes,
                'ingresos': float(ingresos_recientes)
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/api/dashboard/servicios', methods=['GET'])
def get_servicios_dashboard():
    try:
        # Obtener servicios activos
        servicios_activos = Servicio.query.filter_by(estado='en_proceso').count()
        
        # Obtener total de clientes
        total_clientes = Cliente.query.count()
        
        # Obtener total de vehículos
        total_vehiculos = Vehiculo.query.count()
        
        # Obtener servicios por mes (últimos 6 meses)
        seis_meses_atras = datetime.now() - timedelta(days=180)
        servicios_por_mes = db.session.query(
            func.date_trunc('month', Servicio.fecha_creacion).label('mes'),
            func.count(Servicio.id).label('cantidad')
        ).filter(
            Servicio.fecha_creacion >= seis_meses_atras
        ).group_by(
            func.date_trunc('month', Servicio.fecha_creacion)
        ).order_by(
            func.date_trunc('month', Servicio.fecha_creacion)
        ).all()
        
        # Formatear datos de servicios por mes
        servicios_por_mes_formateados = [
            {
                'mes': mes.strftime('%B %Y'),
                'cantidad': cantidad
            }
            for mes, cantidad in servicios_por_mes
        ]
        
        return jsonify({
            'activos': servicios_activos,
            'totalClientes': total_clientes,
            'totalVehiculos': total_vehiculos,
            'serviciosPorMes': servicios_por_mes_formateados
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/api/dashboard/ingresos', methods=['GET'])
def get_ingresos_dashboard():
    try:
        # Obtener ingresos del mes actual
        inicio_mes = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        fin_mes = (inicio_mes + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        ingresos_mes = db.session.query(
            func.sum(Factura.total)
        ).filter(
            and_(
                Factura.fecha >= inicio_mes,
                Factura.fecha <= fin_mes,
                Factura.estado == 'pagada'
            )
        ).scalar() or 0
        
        # Obtener ingresos vs gastos del mes
        gastos_mes = db.session.query(
            func.sum(Factura.total)
        ).filter(
            and_(
                Factura.fecha >= inicio_mes,
                Factura.fecha <= fin_mes,
                Factura.tipo == 'gasto',
                Factura.estado == 'pagada'
            )
        ).scalar() or 0
        
        return jsonify({
            'ingresosMes': float(ingresos_mes),
            'ingresosVsGastos': [
                {'tipo': 'Ingresos', 'valor': float(ingresos_mes)},
                {'tipo': 'Gastos', 'valor': float(gastos_mes)}
            ]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/api/dashboard/alertas', methods=['GET'])
def get_alertas_dashboard():
    try:
        # Obtener alertas de inventario bajo
        alertas = db.session.query(Inventario).filter(
            Inventario.stock <= Inventario.stock_minimo
        ).all()
        
        alertas_formateadas = [
            {
                'mensaje': f'Stock bajo de {item.nombre}: {item.stock} unidades (mínimo: {item.stock_minimo})'
            }
            for item in alertas
        ]
        
        return jsonify({
            'alertas': alertas_formateadas
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/api/dashboard/proximos-servicios', methods=['GET'])
def get_proximos_servicios():
    try:
        # Obtener próximos servicios (próximos 7 días)
        hoy = datetime.now()
        siete_dias = hoy + timedelta(days=7)
        
        proximos_servicios = db.session.query(
            Servicio, Vehiculo, Cliente
        ).join(
            Vehiculo, Servicio.vehiculo_id == Vehiculo.id
        ).join(
            Cliente, Vehiculo.cliente_id == Cliente.id
        ).filter(
            and_(
                Servicio.fecha_programada >= hoy,
                Servicio.fecha_programada <= siete_dias
            )
        ).order_by(
            Servicio.fecha_programada
        ).all()
        
        servicios_formateados = [
            {
                'vehiculo': f"{servicio.Vehiculo.marca} {servicio.Vehiculo.modelo}",
                'cliente': f"{servicio.Cliente.nombre} {servicio.Cliente.apellido}",
                'fecha': servicio.Servicio.fecha_programada.isoformat(),
                'tipo': servicio.Servicio.tipo
            }
            for servicio in proximos_servicios
        ]
        
        return jsonify({
            'servicios': servicios_formateados
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

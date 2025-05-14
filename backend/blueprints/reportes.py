from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Servicio, Factura, Repuesto, MovimientoInventario, Cliente, Vehiculo, db
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_

reportes_bp = Blueprint('reportes', __name__)

# Reporte de servicios por período
@reportes_bp.route('/api/reportes/servicios', methods=['GET'])
@jwt_required()
def reporte_servicios():
    try:
        # Obtener parámetros
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        estado = request.args.get('estado')
        
        # Construir query base
        query = Servicio.query
        
        # Aplicar filtros
        if fecha_inicio:
            query = query.filter(Servicio.fecha_inicio >= datetime.fromisoformat(fecha_inicio))
        if fecha_fin:
            query = query.filter(Servicio.fecha_inicio <= datetime.fromisoformat(fecha_fin))
        if estado:
            query = query.filter(Servicio.estado == estado)
        
        servicios = query.all()
        
        # Procesar resultados
        total_servicios = len(servicios)
        servicios_por_estado = {}
        servicios_por_tipo = {}
        servicios_por_mecanico = {}
        
        for servicio in servicios:
            # Contar por estado
            servicios_por_estado[servicio.estado] = servicios_por_estado.get(servicio.estado, 0) + 1
            
            # Contar por tipo
            servicios_por_tipo[servicio.tipo_servicio] = servicios_por_tipo.get(servicio.tipo_servicio, 0) + 1
            
            # Contar por mecánico
            if servicio.mecanico:
                nombre_mecanico = f"{servicio.mecanico.nombre} {servicio.mecanico.apellido}"
                servicios_por_mecanico[nombre_mecanico] = servicios_por_mecanico.get(nombre_mecanico, 0) + 1
        
        return jsonify({
            'total_servicios': total_servicios,
            'servicios_por_estado': servicios_por_estado,
            'servicios_por_tipo': servicios_por_tipo,
            'servicios_por_mecanico': servicios_por_mecanico,
            'servicios': [{
                'id': s.id,
                'tipo': s.tipo_servicio,
                'estado': s.estado,
                'fecha_inicio': s.fecha_inicio.isoformat(),
                'fecha_fin': s.fecha_fin.isoformat() if s.fecha_fin else None,
                'vehiculo': {
                    'id': s.vehiculo.id,
                    'placa': s.vehiculo.placa,
                    'marca': s.vehiculo.marca,
                    'modelo': s.vehiculo.modelo
                },
                'mecanico': f"{s.mecanico.nombre} {s.mecanico.apellido}" if s.mecanico else None
            } for s in servicios]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Reporte de inventario
@reportes_bp.route('/api/reportes/inventario', methods=['GET'])
@jwt_required()
def reporte_inventario():
    try:
        # Obtener parámetros
        categoria = request.args.get('categoria')
        stock_bajo = request.args.get('stock_bajo', 'false').lower() == 'true'
        
        # Construir query base
        query = Repuesto.query.filter_by(estado='activo')
        
        # Aplicar filtros
        if categoria:
            query = query.filter(Repuesto.categoria == categoria)
        if stock_bajo:
            query = query.filter(Repuesto.stock <= Repuesto.stock_minimo)
        
        repuestos = query.all()
        
        # Procesar resultados
        total_repuestos = len(repuestos)
        repuestos_por_categoria = {}
        valor_total_inventario = 0
        repuestos_stock_bajo = 0
        
        for repuesto in repuestos:
            # Contar por categoría
            repuestos_por_categoria[repuesto.categoria] = repuestos_por_categoria.get(repuesto.categoria, 0) + 1
            
            # Calcular valor total
            valor_total_inventario += repuesto.stock * repuesto.precio_compra
            
            # Contar stock bajo
            if repuesto.stock <= repuesto.stock_minimo:
                repuestos_stock_bajo += 1
        
        return jsonify({
            'total_repuestos': total_repuestos,
            'repuestos_por_categoria': repuestos_por_categoria,
            'valor_total_inventario': valor_total_inventario,
            'repuestos_stock_bajo': repuestos_stock_bajo,
            'repuestos': [{
                'id': r.id,
                'nombre': r.nombre,
                'codigo': r.codigo,
                'categoria': r.categoria,
                'stock': r.stock,
                'stock_minimo': r.stock_minimo,
                'precio_compra': r.precio_compra,
                'precio_venta': r.precio_venta,
                'valor_total': r.stock * r.precio_compra
            } for r in repuestos]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Reporte de facturación
@reportes_bp.route('/api/reportes/facturacion', methods=['GET'])
@jwt_required()
def reporte_facturacion():
    try:
        # Obtener parámetros
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        estado = request.args.get('estado')
        
        # Construir query base
        query = Factura.query
        
        # Aplicar filtros
        if fecha_inicio:
            query = query.filter(Factura.fecha >= datetime.fromisoformat(fecha_inicio))
        if fecha_fin:
            query = query.filter(Factura.fecha <= datetime.fromisoformat(fecha_fin))
        if estado:
            query = query.filter(Factura.estado == estado)
        
        facturas = query.all()
        
        # Procesar resultados
        total_facturado = sum(f.total for f in facturas)
        facturas_por_estado = {}
        facturas_por_mes = {}
        
        for factura in facturas:
            # Contar por estado
            facturas_por_estado[factura.estado] = facturas_por_estado.get(factura.estado, 0) + 1
            
            # Contar por mes
            mes = factura.fecha.strftime('%Y-%m')
            if mes not in facturas_por_mes:
                facturas_por_mes[mes] = {'cantidad': 0, 'total': 0}
            facturas_por_mes[mes]['cantidad'] += 1
            facturas_por_mes[mes]['total'] += factura.total
        
        return jsonify({
            'total_facturado': total_facturado,
            'facturas_por_estado': facturas_por_estado,
            'facturas_por_mes': facturas_por_mes,
            'facturas': [{
                'id': f.id,
                'numero': f.numero,
                'fecha': f.fecha.isoformat(),
                'total': f.total,
                'estado': f.estado,
                'cliente': f"{f.cliente.nombre} {f.cliente.apellido}",
                'vehiculo': f.vehiculo.placa
            } for f in facturas]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Reporte de clientes
@reportes_bp.route('/api/reportes/clientes', methods=['GET'])
@jwt_required()
def reporte_clientes():
    try:
        # Obtener parámetros
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        
        # Construir query base
        query = Cliente.query.filter_by(estado='activo')
        
        # Aplicar filtros de fecha si se proporcionan
        if fecha_inicio or fecha_fin:
            subquery = db.session.query(Vehiculo.cliente_id).join(Servicio).filter(
                Servicio.estado == 'completado'
            )
            if fecha_inicio:
                subquery = subquery.filter(Servicio.fecha_inicio >= datetime.fromisoformat(fecha_inicio))
            if fecha_fin:
                subquery = subquery.filter(Servicio.fecha_inicio <= datetime.fromisoformat(fecha_fin))
            query = query.filter(Cliente.id.in_(subquery))
        
        clientes = query.all()
        
        # Procesar resultados
        total_clientes = len(clientes)
        clientes_activos = 0
        clientes_con_servicios = 0
        total_vehiculos = 0
        
        for cliente in clientes:
            if cliente.vehiculos:
                clientes_activos += 1
                total_vehiculos += len(cliente.vehiculos)
                
                # Verificar si tiene servicios completados
                tiene_servicios = any(
                    any(s.estado == 'completado' for s in v.servicios)
                    for v in cliente.vehiculos
                )
                if tiene_servicios:
                    clientes_con_servicios += 1
        
        return jsonify({
            'total_clientes': total_clientes,
            'clientes_activos': clientes_activos,
            'clientes_con_servicios': clientes_con_servicios,
            'total_vehiculos': total_vehiculos,
            'clientes': [{
                'id': c.id,
                'nombre': f"{c.nombre} {c.apellido}",
                'email': c.email,
                'telefono': c.telefono,
                'vehiculos': len(c.vehiculos),
                'servicios_completados': sum(
                    sum(1 for s in v.servicios if s.estado == 'completado')
                    for v in c.vehiculos
                )
            } for c in clientes]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Reporte de mecánicos
@reportes_bp.route('/api/reportes/mecanicos', methods=['GET'])
@jwt_required()
def reporte_mecanicos():
    try:
        # Obtener parámetros
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        
        # Construir query base
        query = db.session.query(
            Servicio.mecanico_id,
            func.count(Servicio.id).label('total_servicios'),
            func.sum(HoraTrabajo.horas).label('total_horas')
        ).join(HoraTrabajo).filter(
            Servicio.estado == 'completado'
        )
        
        # Aplicar filtros
        if fecha_inicio:
            query = query.filter(Servicio.fecha_inicio >= datetime.fromisoformat(fecha_inicio))
        if fecha_fin:
            query = query.filter(Servicio.fecha_inicio <= datetime.fromisoformat(fecha_fin))
        
        resultados = query.group_by(Servicio.mecanico_id).all()
        
        # Procesar resultados
        total_mecanicos = len(resultados)
        total_servicios = sum(r.total_servicios for r in resultados)
        total_horas = sum(r.total_horas for r in resultados)
        
        return jsonify({
            'total_mecanicos': total_mecanicos,
            'total_servicios': total_servicios,
            'total_horas': total_horas,
            'mecanicos': [{
                'id': r.mecanico_id,
                'nombre': f"{r.mecanico.nombre} {r.mecanico.apellido}",
                'especialidad': r.mecanico.especialidad,
                'servicios_completados': r.total_servicios,
                'horas_trabajadas': r.total_horas
            } for r in resultados]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500 
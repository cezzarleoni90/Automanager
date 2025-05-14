from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from models import (
    Cliente, Vehiculo, Servicio, Factura, Repuesto,
    Mecanico, MovimientoInventario, Usuario
)
from extensions import db
from sqlalchemy import or_

relaciones_bp = Blueprint('relaciones', __name__)

# Clientes y Vehículos
@relaciones_bp.route('/api/relaciones/clientes', methods=['GET'])
@jwt_required()
def get_clientes():
    try:
        clientes = Cliente.query.filter_by(estado='activo').all()
        return jsonify([{
            'id': c.id,
            'nombre': f"{c.nombre} {c.apellido}",
            'email': c.email,
            'telefono': c.telefono,
            'vehiculos': [{
                'id': v.id,
                'placa': v.placa,
                'marca': v.marca,
                'modelo': v.modelo
            } for v in c.vehiculos]
        } for c in clientes]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@relaciones_bp.route('/api/relaciones/vehiculos', methods=['GET'])
@jwt_required()
def get_vehiculos():
    try:
        vehiculos = Vehiculo.query.all()
        return jsonify([{
            'id': v.id,
            'placa': v.placa,
            'marca': v.marca,
            'modelo': v.modelo,
            'cliente': {
                'id': v.cliente.id,
                'nombre': f"{v.cliente.nombre} {v.cliente.apellido}"
            }
        } for v in vehiculos]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Mecánicos
@relaciones_bp.route('/api/relaciones/mecanicos', methods=['GET'])
@jwt_required()
def get_mecanicos():
    try:
        mecanicos = Mecanico.query.filter_by(estado='activo').all()
        return jsonify([{
            'id': m.id,
            'nombre': f"{m.nombre} {m.apellido}",
            'especialidad': m.especialidad,
            'servicios_activos': len([s for s in m.servicios if s.estado != 'completado'])
        } for m in mecanicos]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Repuestos
@relaciones_bp.route('/api/relaciones/repuestos', methods=['GET'])
@jwt_required()
def get_repuestos():
    try:
        repuestos = Repuesto.query.filter_by(estado='activo').all()
        return jsonify([{
            'id': r.id,
            'nombre': r.nombre,
            'codigo': r.codigo,
            'stock': r.stock,
            'stock_minimo': r.stock_minimo,
            'precio_compra': r.precio_compra,
            'precio_venta': r.precio_venta,
            'categoria': r.categoria
        } for r in repuestos]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Servicios
@relaciones_bp.route('/api/relaciones/servicios', methods=['GET'])
@jwt_required()
def get_servicios():
    try:
        servicios = Servicio.query.all()
        return jsonify([{
            'id': s.id,
            'tipo': s.tipo_servicio,
            'estado': s.estado,
            'vehiculo': {
                'id': s.vehiculo.id,
                'placa': s.vehiculo.placa,
                'cliente': f"{s.vehiculo.cliente.nombre} {s.vehiculo.cliente.apellido}"
            },
            'mecanico': f"{s.mecanico.nombre} {s.mecanico.apellido}" if s.mecanico else None,
            'repuestos': [{
                'id': r.id,
                'nombre': r.nombre,
                'cantidad': next((m.cantidad for m in s.movimientos_inventario if m.repuesto_id == r.id), 0)
            } for r in s.repuestos]
        } for s in servicios]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Facturas
@relaciones_bp.route('/api/relaciones/facturas', methods=['GET'])
@jwt_required()
def get_facturas():
    try:
        facturas = Factura.query.all()
        return jsonify([{
            'id': f.id,
            'numero': f.numero,
            'estado': f.estado,
            'total': f.total,
            'cliente': f"{f.cliente.nombre} {f.cliente.apellido}",
            'vehiculo': f.vehiculo.placa if f.vehiculo else None,
            'servicio': f.servicio.tipo_servicio if f.servicio else None
        } for f in facturas]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Búsqueda global
@relaciones_bp.route('/api/buscar', methods=['GET'])
@jwt_required()
def buscar():
    try:
        termino = request.args.get('q', '')
        if not termino:
            return jsonify({'error': 'Término de búsqueda requerido'}), 400
        
        # Buscar en clientes
        clientes = Cliente.query.filter(
            or_(
                Cliente.nombre.ilike(f'%{termino}%'),
                Cliente.apellido.ilike(f'%{termino}%'),
                Cliente.email.ilike(f'%{termino}%'),
                Cliente.telefono.ilike(f'%{termino}%')
            ),
            Cliente.estado == 'activo'
        ).all()
        
        # Buscar en vehículos
        vehiculos = Vehiculo.query.filter(
            or_(
                Vehiculo.placa.ilike(f'%{termino}%'),
                Vehiculo.marca.ilike(f'%{termino}%'),
                Vehiculo.modelo.ilike(f'%{termino}%')
            ),
            Vehiculo.estado == 'activo'
        ).all()
        
        # Buscar en servicios
        servicios = Servicio.query.filter(
            or_(
                Servicio.tipo_servicio.ilike(f'%{termino}%'),
                Servicio.descripcion.ilike(f'%{termino}%')
            )
        ).all()
        
        # Buscar en repuestos
        repuestos = Repuesto.query.filter(
            or_(
                Repuesto.nombre.ilike(f'%{termino}%'),
                Repuesto.codigo.ilike(f'%{termino}%'),
                Repuesto.categoria.ilike(f'%{termino}%')
            ),
            Repuesto.estado == 'activo'
        ).all()
        
        return jsonify({
            'clientes': [{
                'id': c.id,
                'nombre': f"{c.nombre} {c.apellido}",
                'email': c.email,
                'telefono': c.telefono
            } for c in clientes],
            'vehiculos': [{
                'id': v.id,
                'placa': v.placa,
                'marca': v.marca,
                'modelo': v.modelo,
                'cliente': f"{v.cliente.nombre} {v.cliente.apellido}"
            } for v in vehiculos],
            'servicios': [{
                'id': s.id,
                'tipo': s.tipo_servicio,
                'estado': s.estado,
                'vehiculo': s.vehiculo.placa,
                'cliente': f"{s.vehiculo.cliente.nombre} {s.vehiculo.cliente.apellido}"
            } for s in servicios],
            'repuestos': [{
                'id': r.id,
                'nombre': r.nombre,
                'codigo': r.codigo,
                'categoria': r.categoria,
                'stock': r.stock
            } for r in repuestos]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Obtener historial de servicios de un vehículo
@relaciones_bp.route('/api/vehiculos/<int:id>/historial', methods=['GET'])
@jwt_required()
def get_historial_vehiculo(id):
    try:
        vehiculo = Vehiculo.query.get_or_404(id)
        
        servicios = Servicio.query.filter_by(vehiculo_id=id).order_by(Servicio.fecha_inicio.desc()).all()
        
        return jsonify({
            'vehiculo': {
                'id': vehiculo.id,
                'placa': vehiculo.placa,
                'marca': vehiculo.marca,
                'modelo': vehiculo.modelo,
                'año': vehiculo.año,
                'cliente': f"{vehiculo.cliente.nombre} {vehiculo.cliente.apellido}"
            },
            'servicios': [{
                'id': s.id,
                'tipo': s.tipo_servicio,
                'descripcion': s.descripcion,
                'fecha_inicio': s.fecha_inicio.isoformat(),
                'fecha_fin': s.fecha_fin.isoformat() if s.fecha_fin else None,
                'estado': s.estado,
                'mecanico': f"{s.mecanico.nombre} {s.mecanico.apellido}" if s.mecanico else None,
                'repuestos': [{
                    'id': r.id,
                    'nombre': r.nombre,
                    'cantidad': next((m.cantidad for m in s.movimientos_inventario if m.repuesto_id == r.id), 0),
                    'precio': r.precio
                } for r in s.repuestos],
                'factura': {
                    'id': s.facturas[0].id,
                    'numero': s.facturas[0].numero,
                    'total': s.facturas[0].total,
                    'estado': s.facturas[0].estado
                } if s.facturas else None
            } for s in servicios]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Obtener historial de servicios de un cliente
@relaciones_bp.route('/api/clientes/<int:id>/historial', methods=['GET'])
@jwt_required()
def get_historial_cliente(id):
    try:
        cliente = Cliente.query.get_or_404(id)
        
        # Obtener todos los servicios de los vehículos del cliente
        servicios = Servicio.query.join(Vehiculo).filter(
            Vehiculo.cliente_id == id
        ).order_by(Servicio.fecha_inicio.desc()).all()
        
        return jsonify({
            'cliente': {
                'id': cliente.id,
                'nombre': f"{cliente.nombre} {cliente.apellido}",
                'email': cliente.email,
                'telefono': cliente.telefono
            },
            'vehiculos': [{
                'id': v.id,
                'placa': v.placa,
                'marca': v.marca,
                'modelo': v.modelo,
                'año': v.año
            } for v in cliente.vehiculos],
            'servicios': [{
                'id': s.id,
                'tipo': s.tipo_servicio,
                'descripcion': s.descripcion,
                'fecha_inicio': s.fecha_inicio.isoformat(),
                'fecha_fin': s.fecha_fin.isoformat() if s.fecha_fin else None,
                'estado': s.estado,
                'vehiculo': s.vehiculo.placa,
                'mecanico': f"{s.mecanico.nombre} {s.mecanico.apellido}" if s.mecanico else None,
                'factura': {
                    'id': s.facturas[0].id,
                    'numero': s.facturas[0].numero,
                    'total': s.facturas[0].total,
                    'estado': s.facturas[0].estado
                } if s.facturas else None
            } for s in servicios]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Obtener historial de servicios de un mecánico
@relaciones_bp.route('/api/mecanicos/<int:id>/historial', methods=['GET'])
@jwt_required()
def get_historial_mecanico(id):
    try:
        mecanico = Mecanico.query.get_or_404(id)
        
        servicios = Servicio.query.filter_by(mecanico_id=id).order_by(Servicio.fecha_inicio.desc()).all()
        
        return jsonify({
            'mecanico': {
                'id': mecanico.id,
                'nombre': f"{mecanico.nombre} {mecanico.apellido}",
                'especialidad': mecanico.especialidad,
                'email': mecanico.email
            },
            'servicios': [{
                'id': s.id,
                'tipo': s.tipo_servicio,
                'descripcion': s.descripcion,
                'fecha_inicio': s.fecha_inicio.isoformat(),
                'fecha_fin': s.fecha_fin.isoformat() if s.fecha_fin else None,
                'estado': s.estado,
                'vehiculo': {
                    'id': s.vehiculo.id,
                    'placa': s.vehiculo.placa,
                    'marca': s.vehiculo.marca,
                    'modelo': s.vehiculo.modelo,
                    'cliente': f"{s.vehiculo.cliente.nombre} {s.vehiculo.cliente.apellido}"
                },
                'repuestos': [{
                    'id': r.id,
                    'nombre': r.nombre,
                    'cantidad': next((m.cantidad for m in s.movimientos_inventario if m.repuesto_id == r.id), 0)
                } for r in s.repuestos],
                'horas_trabajo': sum(h.horas for h in s.horas_trabajo)
            } for s in servicios]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Obtener historial de movimientos de un repuesto
@relaciones_bp.route('/api/repuestos/<int:id>/historial', methods=['GET'])
@jwt_required()
def get_historial_repuesto(id):
    try:
        repuesto = Repuesto.query.get_or_404(id)
        
        movimientos = MovimientoInventario.query.filter_by(repuesto_id=id).order_by(MovimientoInventario.fecha.desc()).all()
        
        return jsonify({
            'repuesto': {
                'id': repuesto.id,
                'nombre': repuesto.nombre,
                'codigo': repuesto.codigo,
                'categoria': repuesto.categoria,
                'stock': repuesto.stock,
                'stock_minimo': repuesto.stock_minimo,
                'precio_compra': repuesto.precio_compra,
                'precio_venta': repuesto.precio_venta
            },
            'movimientos': [{
                'id': m.id,
                'tipo': m.tipo,
                'cantidad': m.cantidad,
                'fecha': m.fecha.isoformat(),
                'servicio': {
                    'id': m.servicio.id,
                    'tipo': m.servicio.tipo_servicio,
                    'vehiculo': m.servicio.vehiculo.placa,
                    'cliente': f"{m.servicio.vehiculo.cliente.nombre} {m.servicio.vehiculo.cliente.apellido}"
                } if m.servicio else None,
                'usuario': f"{m.usuario.nombre} {m.usuario.apellido}"
            } for m in movimientos]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500 
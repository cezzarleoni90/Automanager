from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from models import Factura, Servicio, db
from datetime import datetime
from sqlalchemy import or_

facturas_bp = Blueprint('facturas', __name__)

# Obtener lista de facturas
@facturas_bp.route('/api/facturas', methods=['GET'])
@jwt_required()
def listar_facturas():
    try:
        # Obtener parámetros de filtrado
        estado = request.args.get('estado')
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        busqueda = request.args.get('q')
        
        # Construir query base
        query = Factura.query
        
        # Aplicar filtros
        if estado:
            query = query.filter_by(estado=estado)
        if fecha_inicio:
            query = query.filter(Factura.fecha >= datetime.fromisoformat(fecha_inicio))
        if fecha_fin:
            query = query.filter(Factura.fecha <= datetime.fromisoformat(fecha_fin))
        if busqueda:
            query = query.filter(
                or_(
                    Factura.numero.ilike(f'%{busqueda}%'),
                    Factura.servicio.vehiculo.placa.ilike(f'%{busqueda}%'),
                    Factura.servicio.vehiculo.cliente.nombre.ilike(f'%{busqueda}%'),
                    Factura.servicio.vehiculo.cliente.apellido.ilike(f'%{busqueda}%')
                )
            )
        
        facturas = query.order_by(Factura.fecha.desc()).all()
        
        return jsonify({
            'facturas': [{
                'id': f.id,
                'numero': f.numero,
                'fecha': f.fecha.isoformat(),
                'total': f.total,
                'estado': f.estado,
                'servicio': {
                    'id': f.servicio.id,
                    'tipo': f.servicio.tipo_servicio,
                    'vehiculo': {
                        'id': f.servicio.vehiculo.id,
                        'placa': f.servicio.vehiculo.placa,
                        'marca': f.servicio.vehiculo.marca,
                        'modelo': f.servicio.vehiculo.modelo,
                        'cliente': f"{f.servicio.vehiculo.cliente.nombre} {f.servicio.vehiculo.cliente.apellido}"
                    }
                }
            } for f in facturas]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Obtener factura por ID
@facturas_bp.route('/api/facturas/<int:id>', methods=['GET'])
@jwt_required()
def obtener_factura(id):
    try:
        factura = Factura.query.get_or_404(id)
        
        return jsonify({
            'id': factura.id,
            'numero': factura.numero,
            'fecha': factura.fecha.isoformat(),
            'total': factura.total,
            'estado': factura.estado,
            'servicio': {
                'id': factura.servicio.id,
                'tipo': factura.servicio.tipo_servicio,
                'descripcion': factura.servicio.descripcion,
                'fecha_inicio': factura.servicio.fecha_inicio.isoformat(),
                'fecha_fin': factura.servicio.fecha_fin.isoformat() if factura.servicio.fecha_fin else None,
                'vehiculo': {
                    'id': factura.servicio.vehiculo.id,
                    'placa': factura.servicio.vehiculo.placa,
                    'marca': factura.servicio.vehiculo.marca,
                    'modelo': factura.servicio.vehiculo.modelo,
                    'cliente': {
                        'id': factura.servicio.vehiculo.cliente.id,
                        'nombre': factura.servicio.vehiculo.cliente.nombre,
                        'apellido': factura.servicio.vehiculo.cliente.apellido,
                        'email': factura.servicio.vehiculo.cliente.email,
                        'telefono': factura.servicio.vehiculo.cliente.telefono
                    }
                },
                'mecanico': f"{factura.servicio.mecanico.nombre} {factura.servicio.mecanico.apellido}" if factura.servicio.mecanico else None,
                'repuestos': [{
                    'id': r.id,
                    'nombre': r.nombre,
                    'cantidad': next((m.cantidad for m in factura.servicio.movimientos_inventario if m.repuesto_id == r.id), 0),
                    'precio': r.precio,
                    'subtotal': next((m.cantidad * r.precio for m in factura.servicio.movimientos_inventario if m.repuesto_id == r.id), 0)
                } for r in factura.servicio.repuestos],
                'horas_trabajo': [{
                    'id': h.id,
                    'fecha': h.fecha.isoformat(),
                    'horas': h.horas,
                    'descripcion': h.descripcion,
                    'mecanico': f"{h.mecanico.nombre} {h.mecanico.apellido}",
                    'tarifa': h.mecanico.tarifa_hora,
                    'subtotal': h.horas * h.mecanico.tarifa_hora
                } for h in factura.servicio.horas_trabajo]
            },
            'detalles': {
                'repuestos': sum(
                    m.cantidad * m.repuesto.precio
                    for m in factura.servicio.movimientos_inventario
                ),
                'horas_trabajo': sum(
                    h.horas * h.mecanico.tarifa_hora
                    for h in factura.servicio.horas_trabajo
                )
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Actualizar estado de factura
@facturas_bp.route('/api/facturas/<int:id>/estado', methods=['PUT'])
@jwt_required()
def actualizar_estado_factura(id):
    try:
        factura = Factura.query.get_or_404(id)
        data = request.get_json()
        
        # Validar datos requeridos
        if 'estado' not in data:
            return jsonify({'error': 'Campo estado es requerido'}), 400
        
        # Validar estado
        if data['estado'] not in ['pendiente', 'pagada', 'anulada']:
            return jsonify({'error': 'Estado inválido'}), 400
        
        # Actualizar estado
        factura.estado = data['estado']
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Estado actualizado exitosamente',
            'factura': {
                'id': factura.id,
                'numero': factura.numero,
                'estado': factura.estado
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Obtener facturas de un servicio
@facturas_bp.route('/api/servicios/<int:id>/facturas', methods=['GET'])
@jwt_required()
def listar_facturas_servicio(id):
    try:
        servicio = Servicio.query.get_or_404(id)
        
        return jsonify({
            'servicio': {
                'id': servicio.id,
                'tipo': servicio.tipo_servicio,
                'vehiculo': {
                    'id': servicio.vehiculo.id,
                    'placa': servicio.vehiculo.placa,
                    'cliente': f"{servicio.vehiculo.cliente.nombre} {servicio.vehiculo.cliente.apellido}"
                }
            },
            'facturas': [{
                'id': f.id,
                'numero': f.numero,
                'fecha': f.fecha.isoformat(),
                'total': f.total,
                'estado': f.estado
            } for f in servicio.facturas]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500 
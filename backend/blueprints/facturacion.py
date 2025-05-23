from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import Factura, Pago, Servicio, Vehiculo, Cliente, Usuario
from backend.extensions import db
from datetime import datetime, timezone
from sqlalchemy import func

facturacion_bp = Blueprint('facturacion', __name__)

# Rutas para Facturas
@facturacion_bp.route('/api/facturas', methods=['GET'])
@jwt_required()
def get_facturas():
    try:
        facturas = Factura.query.all()
        return jsonify([{
            'id': f.id,
            'numero': f.numero,
            'fecha': f.fecha.isoformat(),
            'total': f.total,
            'estado': f.estado,
            'cliente': {
                'id': f.cliente.id,
                'nombre': f"{f.cliente.nombre} {f.cliente.apellido}",
                'email': f.cliente.email
            },
            'vehiculo': {
                'id': f.vehiculo.id,
                'placa': f.vehiculo.placa,
                'marca': f.vehiculo.marca,
                'modelo': f.vehiculo.modelo
            },
            'servicios': [{
                'id': s.id,
                'tipo': s.tipo_servicio,
                'descripcion': s.descripcion,
                'fecha': s.fecha_inicio.isoformat()
            } for s in f.servicios]
        } for f in facturas]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@facturacion_bp.route('/api/facturas/<int:id>', methods=['GET'])
@jwt_required()
def get_factura(id):
    try:
        factura = Factura.query.get_or_404(id)
        return jsonify({
            'id': factura.id,
            'numero': factura.numero,
            'fecha': factura.fecha.isoformat(),
            'total': factura.total,
            'estado': factura.estado,
            'cliente': {
                'id': factura.cliente.id,
                'nombre': f"{factura.cliente.nombre} {factura.cliente.apellido}",
                'email': factura.cliente.email,
                'telefono': factura.cliente.telefono,
                'direccion': factura.cliente.direccion
            },
            'vehiculo': {
                'id': factura.vehiculo.id,
                'placa': factura.vehiculo.placa,
                'marca': factura.vehiculo.marca,
                'modelo': factura.vehiculo.modelo,
                'año': factura.vehiculo.año
            },
            'servicios': [{
                'id': s.id,
                'tipo': s.tipo_servicio,
                'descripcion': s.descripcion,
                'fecha_inicio': s.fecha_inicio.isoformat(),
                'fecha_fin': s.fecha_fin.isoformat() if s.fecha_fin else None,
                'mecanico': {
                    'id': s.mecanico.id,
                    'nombre': f"{s.mecanico.nombre} {s.mecanico.apellido}",
                    'especialidad': s.mecanico.especialidad
                } if s.mecanico else None,
                'repuestos': [{
                    'id': r.id,
                    'nombre': r.nombre,
                    'cantidad': next((m.cantidad for m in s.movimientos_inventario if m.repuesto_id == r.id), 0),
                    'precio': r.precio
                } for r in s.repuestos]
            } for s in factura.servicios],
            'usuario': {
                'id': factura.usuario.id,
                'nombre': f"{factura.usuario.nombre} {factura.usuario.apellido}"
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@facturacion_bp.route('/api/facturas', methods=['POST'])
@jwt_required()
def create_factura():
    try:
        data = request.get_json()
        usuario_id = get_jwt_identity()
        
        # Validar datos requeridos
        required_fields = ['cliente_id', 'vehiculo_id', 'servicios']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'El campo {field} es requerido'}), 400
        
        # Verificar cliente y vehículo
        cliente = Cliente.query.get_or_404(data['cliente_id'])
        vehiculo = Vehiculo.query.get_or_404(data['vehiculo_id'])
        
        # Verificar que el vehículo pertenece al cliente
        if vehiculo.cliente_id != cliente.id:
            return jsonify({'error': 'El vehículo no pertenece al cliente'}), 400
        
        # Verificar servicios
        servicios = []
        total = 0
        for servicio_id in data['servicios']:
            servicio = Servicio.query.get_or_404(servicio_id)
            if servicio.vehiculo_id != vehiculo.id:
                return jsonify({'error': f'El servicio {servicio_id} no pertenece al vehículo'}), 400
            if servicio.estado != 'completado':
                return jsonify({'error': f'El servicio {servicio_id} no está completado'}), 400
            if servicio.facturas:
                return jsonify({'error': f'El servicio {servicio_id} ya está facturado'}), 400
            
            servicios.append(servicio)
            
            # Calcular total del servicio
            servicio_total = 0
            # Sumar costo de repuestos
            for repuesto in servicio.repuestos:
                movimiento = next((m for m in servicio.movimientos_inventario if m.repuesto_id == repuesto.id), None)
                if movimiento:
                    servicio_total += repuesto.precio * movimiento.cantidad
            
            # Sumar horas de trabajo
            horas_trabajo = sum(h.horas for h in servicio.horas_trabajo)
            servicio_total += horas_trabajo * 50  # Tarifa por hora
            
            total += servicio_total
        
        # Generar número de factura
        ultima_factura = Factura.query.order_by(Factura.id.desc()).first()
        numero = f"F{datetime.now().year}{str(ultima_factura.id + 1 if ultima_factura else 1).zfill(4)}"
        
        # Crear factura
        factura = Factura(
            numero=numero,
            fecha=datetime.now(),
            total=total,
            estado='pendiente',
            cliente=cliente,
            vehiculo=vehiculo,
            servicios=servicios,
            usuario=Usuario.query.get(usuario_id)
        )
        
        db.session.add(factura)
        db.session.commit()
        
        return jsonify({
            'message': 'Factura creada exitosamente',
            'id': factura.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@facturacion_bp.route('/api/facturas/<int:id>/estado', methods=['PUT'])
@jwt_required()
def update_factura_estado(id):
    try:
        factura = Factura.query.get_or_404(id)
        data = request.get_json()
        
        if 'estado' not in data:
            return jsonify({'error': 'El campo estado es requerido'}), 400
        
        if data['estado'] not in ['pendiente', 'pagada', 'anulada']:
            return jsonify({'error': 'Estado no válido'}), 400
        
        factura.estado = data['estado']
        db.session.commit()
        
        return jsonify({
            'message': 'Estado de factura actualizado exitosamente'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@facturacion_bp.route('/api/facturas/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_factura(id):
    try:
        factura = Factura.query.get_or_404(id)
        
        # Verificar si tiene pagos asociados
        if factura.pagos:
            return jsonify({"error": "No se puede eliminar una factura con pagos asociados"}), 400
            
        db.session.delete(factura)
        db.session.commit()
        return jsonify({"mensaje": "Factura eliminada exitosamente"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Rutas para Pagos
@facturacion_bp.route('/api/facturas/<int:factura_id>/pagos', methods=['POST'])
@jwt_required()
def add_pago(factura_id):
    try:
        factura = Factura.query.get_or_404(factura_id)
        data = request.get_json()
        
        # Verificar si el pago excede el total pendiente
        total_pagado = sum(p.monto for p in factura.pagos)
        if total_pagado + data['monto'] > factura.total:
            return jsonify({"error": "El monto excede el total de la factura"}), 400
        
        nuevo_pago = Pago(
            monto=data['monto'],
            fecha=datetime.now(timezone.utc),
            metodo=data['metodo'],
            referencia=data.get('referencia'),
            factura_id=factura_id
        )
        
        # Actualizar estado de la factura si se paga el total
        if total_pagado + data['monto'] >= factura.total:
            factura.estado = 'pagada'
        
        db.session.add(nuevo_pago)
        db.session.commit()
        return jsonify({"mensaje": "Pago registrado exitosamente", "id": nuevo_pago.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@facturacion_bp.route('/api/facturas/<int:factura_id>/pagos', methods=['GET'])
@jwt_required()
def get_pagos(factura_id):
    try:
        pagos = Pago.query.filter_by(factura_id=factura_id).all()
        return jsonify([{
            'id': p.id,
            'monto': p.monto,
            'fecha': p.fecha.isoformat(),
            'metodo': p.metodo,
            'referencia': p.referencia
        } for p in pagos]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Rutas para Reportes
@facturacion_bp.route('/api/facturas/reporte/ventas', methods=['GET'])
@jwt_required()
def get_reporte_ventas():
    try:
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        
        query = Factura.query
        
        if fecha_inicio:
            query = query.filter(Factura.fecha >= datetime.fromisoformat(fecha_inicio))
        if fecha_fin:
            query = query.filter(Factura.fecha <= datetime.fromisoformat(fecha_fin))
            
        facturas = query.all()
        
        total_ventas = sum(f.total for f in facturas)
        total_pagado = sum(p.monto for f in facturas for p in f.pagos)
        
        return jsonify({
            'periodo': {
                'inicio': fecha_inicio,
                'fin': fecha_fin
            },
            'total_ventas': total_ventas,
            'total_pagado': total_pagado,
            'total_pendiente': total_ventas - total_pagado,
            'cantidad_facturas': len(facturas),
            'facturas': [{
                'id': f.id,
                'numero': f.numero,
                'fecha': f.fecha.isoformat(),
                'total': f.total,
                'estado': f.estado,
                'cliente': f.vehiculo.cliente.nombre if f.vehiculo and f.vehiculo.cliente else None
            } for f in facturas]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Obtener facturas por cliente
@facturacion_bp.route('/api/facturas/cliente/<int:cliente_id>', methods=['GET'])
@jwt_required()
def get_facturas_cliente(cliente_id):
    try:
        facturas = Factura.query.filter_by(cliente_id=cliente_id).all()
        return jsonify([{
            'id': f.id,
            'numero': f.numero,
            'fecha': f.fecha.isoformat(),
            'total': f.total,
            'estado': f.estado,
            'vehiculo': {
                'id': f.vehiculo.id,
                'placa': f.vehiculo.placa,
                'marca': f.vehiculo.marca,
                'modelo': f.vehiculo.modelo
            }
        } for f in facturas]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Obtener facturas por vehículo
@facturacion_bp.route('/api/facturas/vehiculo/<int:vehiculo_id>', methods=['GET'])
@jwt_required()
def get_facturas_vehiculo(vehiculo_id):
    try:
        facturas = Factura.query.filter_by(vehiculo_id=vehiculo_id).all()
        return jsonify([{
            'id': f.id,
            'numero': f.numero,
            'fecha': f.fecha.isoformat(),
            'total': f.total,
            'estado': f.estado,
            'cliente': {
                'id': f.cliente.id,
                'nombre': f"{f.cliente.nombre} {f.cliente.apellido}"
            }
        } for f in facturas]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Obtener resumen de facturación
@facturacion_bp.route('/api/facturacion/resumen', methods=['GET'])
@jwt_required()
def get_resumen_facturacion():
    try:
        # Total facturado
        total_facturado = db.session.query(func.sum(Factura.total)).filter_by(estado='pagada').scalar() or 0
        
        # Total pendiente
        total_pendiente = db.session.query(func.sum(Factura.total)).filter_by(estado='pendiente').scalar() or 0
        
        # Facturas por estado
        facturas_por_estado = db.session.query(
            Factura.estado,
            func.count(Factura.id)
        ).group_by(Factura.estado).all()
        
        # Facturas por mes
        facturas_por_mes = db.session.query(
            func.strftime('%Y-%m', Factura.fecha),
            func.count(Factura.id),
            func.sum(Factura.total)
        ).group_by(
            func.strftime('%Y-%m', Factura.fecha)
        ).order_by(
            func.strftime('%Y-%m', Factura.fecha).desc()
        ).limit(12).all()
        
        return jsonify({
            'total_facturado': total_facturado,
            'total_pendiente': total_pendiente,
            'facturas_por_estado': dict(facturas_por_estado),
            'facturas_por_mes': [{
                'mes': mes,
                'cantidad': cantidad,
                'total': total
            } for mes, cantidad, total in facturas_por_mes]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500 
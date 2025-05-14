from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from models import Repuesto, MovimientoInventario, db
from datetime import datetime

inventario_bp = Blueprint('inventario', __name__)

# ========== REPUESTOS ==========

# Obtener todos los repuestos
@inventario_bp.route('/repuestos', methods=['GET'])
@jwt_required()
def get_repuestos():
    try:
        repuestos = Repuesto.query.all()
        return jsonify({
            'repuestos': [{
                'id': r.id,
                'codigo': r.codigo,
                'nombre': r.nombre,
                'descripcion': r.descripcion,
                'categoria': r.categoria,
                'stock_actual': r.stock,
                'stock_minimo': r.stock_minimo,
                'precio_compra': r.precio_compra,
                'precio_venta': r.precio_venta,
                'estado': r.estado,
                'proveedor': getattr(r, 'proveedor', '') or ''
            } for r in repuestos]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Obtener repuesto por ID
@inventario_bp.route('/repuestos/<int:id>', methods=['GET'])
@jwt_required()
def get_repuesto(id):
    try:
        repuesto = Repuesto.query.get_or_404(id)
        return jsonify({
            'id': repuesto.id,
            'codigo': repuesto.codigo,
            'nombre': repuesto.nombre,
            'descripcion': repuesto.descripcion,
            'categoria': repuesto.categoria,
            'stock_minimo': repuesto.stock_minimo,
            'stock_actual': repuesto.stock,
            'precio_compra': repuesto.precio_compra,
            'precio_venta': repuesto.precio_venta,
            'proveedor': repuesto.proveedor if hasattr(repuesto, 'proveedor') else '',
            'estado': repuesto.estado
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Crear repuesto
@inventario_bp.route('/repuestos', methods=['POST'])
@jwt_required()
def create_repuesto():
    try:
        data = request.get_json()
        
        # Validar campos requeridos
        required_fields = ['codigo', 'nombre', 'categoria', 'precio_compra', 'precio_venta']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo {field} es requerido'}), 400
        
        # Verificar código único
        if Repuesto.query.filter_by(codigo=data['codigo']).first():
            return jsonify({'error': 'El código del repuesto ya existe'}), 400
        
        # Crear repuesto
        repuesto = Repuesto(
            codigo=data['codigo'],
            nombre=data['nombre'],
            descripcion=data.get('descripcion', ''),
            categoria=data['categoria'],
            stock=data.get('stock', 0),
            stock_minimo=data.get('stock_minimo', 0),
            precio_compra=float(data['precio_compra']),
            precio_venta=float(data['precio_venta']),
            estado='activo'
        )
        
        db.session.add(repuesto)
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Repuesto creado exitosamente',
            'repuesto': {
                'id': repuesto.id,
                'codigo': repuesto.codigo,
                'nombre': repuesto.nombre,
                'categoria': repuesto.categoria,
                'stock_actual': repuesto.stock
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Actualizar repuesto
@inventario_bp.route('/repuestos/<int:id>', methods=['PUT'])
@jwt_required()
def update_repuesto(id):
    try:
        repuesto = Repuesto.query.get_or_404(id)
        data = request.get_json()
        
        # Verificar código único (excluyendo el actual)
        if 'codigo' in data:
            existing = Repuesto.query.filter_by(codigo=data['codigo']).first()
            if existing and existing.id != id:
                return jsonify({'error': 'El código del repuesto ya existe'}), 400
            repuesto.codigo = data['codigo']
        
        # Actualizar campos
        if 'nombre' in data:
            repuesto.nombre = data['nombre']
        if 'descripcion' in data:
            repuesto.descripcion = data['descripcion']
        if 'categoria' in data:
            repuesto.categoria = data['categoria']
        if 'stock' in data:
            repuesto.stock = int(data['stock'])
        if 'stock_minimo' in data:
            repuesto.stock_minimo = int(data['stock_minimo'])
        if 'precio_compra' in data:
            repuesto.precio_compra = float(data['precio_compra'])
        if 'precio_venta' in data:
            repuesto.precio_venta = float(data['precio_venta'])
        
        repuesto.fecha_actualizacion = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Repuesto actualizado exitosamente',
            'repuesto': {
                'id': repuesto.id,
                'codigo': repuesto.codigo,
                'nombre': repuesto.nombre,
                'categoria': repuesto.categoria,
                'stock_actual': repuesto.stock
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Eliminar repuesto (mejorado)
@inventario_bp.route('/repuestos/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_repuesto(id):
    try:
        repuesto = Repuesto.query.get_or_404(id)
        
        # Verificar si tiene movimientos (con mejor manejo de errores)
        movimientos_count = MovimientoInventario.query.filter_by(repuesto_id=id).count()
        if movimientos_count > 0:
            return jsonify({
                'error': f'No se puede eliminar el repuesto {repuesto.codigo}. Tiene {movimientos_count} movimiento(s) asociado(s).'
            }), 400
        
        # Verificar si está siendo usado en servicios
        servicios_count = len(repuesto.servicios) if hasattr(repuesto, 'servicios') else 0
        if servicios_count > 0:
            return jsonify({
                'error': f'No se puede eliminar el repuesto {repuesto.codigo}. Está siendo usado en {servicios_count} servicio(s).'
            }), 400
        
        # Guardar información para el mensaje de respuesta
        codigo = repuesto.codigo
        nombre = repuesto.nombre
        
        # Eliminar el repuesto
        db.session.delete(repuesto)
        db.session.commit()
        
        return jsonify({
            'mensaje': f'Repuesto {codigo} - {nombre} eliminado exitosamente'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        # Registrar el error para debug
        print(f"Error al eliminar repuesto {id}: {str(e)}")
        return jsonify({'error': f'Error interno: {str(e)}'}), 500

# ========== MOVIMIENTOS ==========

# Crear movimiento de inventario (corrigido)
@inventario_bp.route('/movimientos', methods=['POST'])
@jwt_required()
def create_movimiento():
    try:
        data = request.get_json()
        
        # Validar campos requeridos
        required_fields = ['repuesto_id', 'tipo', 'cantidad']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo {field} es requerido'}), 400
        
        # Obtener repuesto
        repuesto = Repuesto.query.get_or_404(data['repuesto_id'])
        
        # Validar tipo
        if data['tipo'] not in ['entrada', 'salida']:
            return jsonify({'error': 'Tipo debe ser entrada o salida'}), 400
        
        # Validar cantidad para salida
        cantidad = int(data['cantidad'])
        if data['tipo'] == 'salida' and repuesto.stock < cantidad:
            return jsonify({'error': 'Stock insuficiente'}), 400
        
        # Crear movimiento
        movimiento = MovimientoInventario(
            repuesto_id=data['repuesto_id'],
            tipo=data['tipo'],
            cantidad=cantidad,
            notas=data.get('motivo', ''),  # ✅ Cambiar a 'notas' pero mantener compatibilidad con 'motivo'
            fecha=datetime.utcnow(),
            servicio_id=data.get('servicio_id'),
            usuario_id=data.get('usuario_id')
        )
        
        # Actualizar stock
        if data['tipo'] == 'entrada':
            repuesto.stock += cantidad
        else:  # salida
            repuesto.stock -= cantidad
        
        repuesto.fecha_actualizacion = datetime.utcnow()
        
        db.session.add(movimiento)
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Movimiento registrado exitosamente',
            'movimiento': {
                'id': movimiento.id,
                'tipo': movimiento.tipo,
                'cantidad': movimiento.cantidad,
                'stock_actual': repuesto.stock
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Obtener movimientos de un repuesto (corregido)
@inventario_bp.route('/repuestos/<int:id>/movimientos', methods=['GET'])
@jwt_required()
def get_movimientos_repuesto(id):
    try:
        repuesto = Repuesto.query.get_or_404(id)
        movimientos = MovimientoInventario.query.filter_by(repuesto_id=id).order_by(MovimientoInventario.fecha.desc()).all()
        
        return jsonify({
            'repuesto': {
                'id': repuesto.id,
                'codigo': repuesto.codigo,
                'nombre': repuesto.nombre,
                'stock_actual': repuesto.stock
            },
            'movimientos': [{
                'id': m.id,
                'tipo': m.tipo,
                'cantidad': m.cantidad,
                'notas': m.notas,  # ✅ Cambiar de 'motivo' a 'notas'
                'fecha': m.fecha.isoformat()
            } for m in movimientos]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500 
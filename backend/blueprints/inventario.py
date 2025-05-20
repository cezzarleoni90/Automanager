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
        return handle_error(e)

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
        return handle_error(e)

# ========== VALIDACIONES DE REPUESTOS ==========

def validar_repuesto(data, es_actualizacion=False):
    """Valida los datos de un repuesto"""
    errores = []
    
    # Validar campos requeridos
    required_fields = ['codigo', 'nombre', 'precio_compra', 'precio_venta']
    for field in required_fields:
        if not es_actualizacion and field not in data:
            errores.append(f'Campo {field} es requerido')
        elif field in data and not data[field]:
            errores.append(f'Campo {field} no puede estar vacío')
    
    # Validar precios
    if 'precio_compra' in data:
        try:
            precio_compra = float(data['precio_compra'])
            if precio_compra < 0:
                errores.append('El precio de compra no puede ser negativo')
        except ValueError:
            errores.append('El precio de compra debe ser un número válido')
            
    if 'precio_venta' in data:
        try:
            precio_venta = float(data['precio_venta'])
            if precio_venta < 0:
                errores.append('El precio de venta no puede ser negativo')
            if 'precio_compra' in data and precio_venta < float(data['precio_compra']):
                errores.append('El precio de venta no puede ser menor al precio de compra')
        except ValueError:
            errores.append('El precio de venta debe ser un número válido')
    
    # Validar stock
    if 'stock' in data:
        try:
            stock = int(data['stock'])
            if stock < 0:
                errores.append('El stock no puede ser negativo')
        except ValueError:
            errores.append('El stock debe ser un número entero válido')
            
    # Validar stock mínimo
    if 'stock_minimo' in data:
        try:
            stock_minimo = int(data['stock_minimo'])
            if stock_minimo < 0:
                errores.append('El stock mínimo no puede ser negativo')
        except ValueError:
            errores.append('El stock mínimo debe ser un número entero válido')
    
    # Validar proveedor
    if 'proveedor_id' in data:
        proveedor = Proveedor.query.get(data['proveedor_id'])
        if not proveedor:
            errores.append('El proveedor especificado no existe')
    
    return errores

@inventario_bp.route('/repuestos', methods=['POST'])
@jwt_required()
@transaction_handler
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
        for field in ['codigo', 'nombre', 'descripcion', 'estado']:
            if field in data:
                setattr(repuesto, field, data[field])
                
        if 'precio_compra' in data:
            repuesto.precio_compra = float(data['precio_compra'])
        if 'precio_venta' in data:
            repuesto.precio_venta = float(data['precio_venta'])
        if 'stock' in data:
            repuesto.stock = int(data['stock'])
        if 'stock_minimo' in data:
            repuesto.stock_minimo = int(data['stock_minimo'])
        if 'proveedor_id' in data:
            repuesto.proveedor_id = data['proveedor_id']
            
        repuesto.fecha_actualizacion = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Repuesto actualizado exitosamente',
            'repuesto': {
                'id': repuesto.id,
                'codigo': repuesto.codigo,
                'nombre': repuesto.nombre,
                'stock': repuesto.stock,
                'stock_minimo': repuesto.stock_minimo
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return handle_error(e)

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
        return handle_error(e)

# ========== MOVIMIENTOS ==========

# ========== VALIDACIONES Y UTILIDADES ==========

def validar_movimiento_inventario(repuesto_id, cantidad, tipo):
    """Valida si un movimiento de inventario es válido"""
    repuesto = Repuesto.query.get(repuesto_id)
    if not repuesto:
        return False, "Repuesto no encontrado"
        
    if tipo == 'salida' and repuesto.stock < cantidad:
        return False, "Stock insuficiente"
        
    if cantidad <= 0:
        return False, "La cantidad debe ser mayor a 0"
        
    return True, None

def registrar_movimiento(repuesto_id, cantidad, tipo, notas=None, servicio_id=None, usuario_id=None):
    """Registra un movimiento en el inventario"""
    try:
        # Validar movimiento
        es_valido, mensaje = validar_movimiento_inventario(repuesto_id, cantidad, tipo)
        if not es_valido:
            return False, mensaje
            
        # Crear movimiento
        movimiento = MovimientoInventario(
            repuesto_id=repuesto_id,
            tipo=tipo,
            cantidad=cantidad,
            notas=notas,
            servicio_id=servicio_id,
            usuario_id=usuario_id
        )
        
        # Actualizar stock
        repuesto = Repuesto.query.get(repuesto_id)
        if tipo == 'entrada':
            repuesto.stock += cantidad
        else:  # salida
            repuesto.stock -= cantidad
            
        db.session.add(movimiento)
        db.session.commit()
        
        return True, "Movimiento registrado exitosamente"
    except Exception as e:
        db.session.rollback()
        return False, str(e)

# ========== ENDPOINTS MEJORADOS ==========

@inventario_bp.route('/movimientos', methods=['POST'])
@jwt_required()
@transaction_handler
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
                'notas': m.notas,
                'fecha': m.fecha.isoformat()
            } for m in movimientos]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500 
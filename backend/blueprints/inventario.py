from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Repuesto, MovimientoInventario, db
from datetime import datetime, timedelta
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from functools import wraps
from utils.api_response import success_response, error_response, paginated_response
from sqlalchemy import or_

inventario_bp = Blueprint('inventario', __name__)

COLORES_PASTEL = [
    # ... (lista de más de 100 colores pastel, como la que te di antes) ...
]

class InventarioError(Exception):
    """Clase base para errores de inventario"""
    pass

class StockInsuficienteError(InventarioError):
    """Error cuando no hay suficiente stock"""
    pass

class RepuestoNoEncontradoError(InventarioError):
    """Error cuando no se encuentra el repuesto"""
    pass

class CodigoDuplicadoError(InventarioError):
    """Error cuando el código del repuesto ya existe"""
    pass

def handle_error(e):
    """Manejador centralizado de errores"""
    if isinstance(e, StockInsuficienteError):
        return jsonify({'error': str(e)}), 400
    elif isinstance(e, RepuestoNoEncontradoError):
        return jsonify({'error': str(e)}), 404
    elif isinstance(e, CodigoDuplicadoError):
        return jsonify({'error': str(e)}), 400
    elif isinstance(e, IntegrityError):
        return jsonify({'error': 'Error de integridad en la base de datos'}), 400
    elif isinstance(e, SQLAlchemyError):
        return jsonify({'error': 'Error en la base de datos'}), 500
    else:
        return jsonify({'error': 'Error interno del servidor'}), 500

def validar_repuesto(data, es_actualizacion=False):
    """Valida los datos de un repuesto"""
    errores = []
    
    # Validar campos requeridos
    campos_requeridos = ['codigo', 'nombre', 'categoria', 'precio_compra', 'precio_venta']
    for campo in campos_requeridos:
        if not es_actualizacion and campo not in data:
            errores.append(f'El campo {campo} es requerido')
    
    # Validar tipos de datos
    if 'stock' in data and not isinstance(data['stock'], (int, float)):
        errores.append('El stock debe ser un número')
    if 'stock_minimo' in data and not isinstance(data['stock_minimo'], (int, float)):
        errores.append('El stock mínimo debe ser un número')
    if 'precio_compra' in data and not isinstance(data['precio_compra'], (int, float)):
        errores.append('El precio de compra debe ser un número')
    if 'precio_venta' in data and not isinstance(data['precio_venta'], (int, float)):
        errores.append('El precio de venta debe ser un número')
    
    # Validar valores positivos
    if 'stock' in data and data['stock'] < 0:
        errores.append('El stock no puede ser negativo')
    if 'stock_minimo' in data and data['stock_minimo'] < 0:
        errores.append('El stock mínimo no puede ser negativo')
    if 'precio_compra' in data and data['precio_compra'] <= 0:
        errores.append('El precio de compra debe ser mayor a 0')
    if 'precio_venta' in data and data['precio_venta'] <= 0:
        errores.append('El precio de venta debe ser mayor a 0')
    
    # Validar longitud de campos
    if 'codigo' in data and len(data['codigo']) > 50:
        errores.append('El código no puede tener más de 50 caracteres')
    if 'nombre' in data and len(data['nombre']) > 100:
        errores.append('El nombre no puede tener más de 100 caracteres')
    if 'categoria' in data and len(data['categoria']) > 50:
        errores.append('La categoría no puede tener más de 50 caracteres')
    
    return errores

def validar_movimiento(data):
    """Valida los datos de un movimiento de inventario"""
    errores = []
    
    # Validar campos requeridos
    campos_requeridos = ['repuesto_id', 'tipo', 'cantidad']
    for campo in campos_requeridos:
        if campo not in data:
            errores.append(f'El campo {campo} es requerido')
    
    # Validar tipo de movimiento
    if 'tipo' in data and data['tipo'] not in ['entrada', 'salida']:
        errores.append('El tipo debe ser "entrada" o "salida"')
    
    # Validar cantidad
    if 'cantidad' in data:
        try:
            cantidad = int(data['cantidad'])
            if cantidad <= 0:
                errores.append('La cantidad debe ser mayor a 0')
        except ValueError:
            errores.append('La cantidad debe ser un número entero')
    
    return errores

def transaction_handler(f):
    """Decorador para manejar transacciones de base de datos"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            result = f(*args, **kwargs)
            db.session.commit()
            return result
        except Exception as e:
            db.session.rollback()
            return handle_error(e)
    return wrapper

# ========== REPUESTOS ==========

@inventario_bp.route('/repuestos', methods=['GET'])
@jwt_required()
def get_repuestos():
    try:
        # Obtener parámetros de paginación y filtrado
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        categoria = request.args.get('categoria')
        stock_bajo = request.args.get('stock_bajo', 'false').lower() == 'true'
        busqueda = request.args.get('busqueda')
        
        # Construir query base
        query = Repuesto.query
        
        # Aplicar filtros
        if categoria:
            query = query.filter_by(categoria=categoria)
        if stock_bajo:
            query = query.filter(Repuesto.stock <= Repuesto.stock_minimo)
        if busqueda:
            query = query.filter(
                or_(
                    Repuesto.nombre.ilike(f'%{busqueda}%'),
                    Repuesto.codigo.ilike(f'%{busqueda}%'),
                    Repuesto.categoria.ilike(f'%{busqueda}%')
                )
            )
        
        # Obtener total y aplicar paginación
        total = query.count()
        repuestos = query.order_by(Repuesto.nombre)\
            .offset((page - 1) * per_page)\
            .limit(per_page)\
            .all()
        
        # Formatear respuesta
        items = [{
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
        
        return paginated_response(
            items=items,
            total=total,
            page=page,
            per_page=per_page,
            message="Lista de repuestos obtenida exitosamente"
        )
        
    except Exception as e:
        return error_response(
            message="Error al obtener la lista de repuestos",
            errors=[str(e)],
            status_code=500
        )

@inventario_bp.route('/repuestos/<int:id>', methods=['GET'])
@jwt_required()
def get_repuesto(id):
    try:
        repuesto = Repuesto.query.get_or_404(id)
        return success_response(
            data={
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
            },
            message="Repuesto obtenido exitosamente"
        )
    except Exception as e:
        return error_response(
            message="Error al obtener el repuesto",
            errors=[str(e)],
            status_code=500
        )

@inventario_bp.route('/repuestos', methods=['POST'])
@jwt_required()
@transaction_handler
def create_repuesto():
    try:
        data = request.get_json()
        
        # Validar datos
        errores = validar_repuesto(data)
        if errores:
            return error_response(
                message="Error de validación",
                errors=errores,
                status_code=400
            )
        
        # Verificar código único
        if Repuesto.query.filter_by(codigo=data['codigo']).first():
            return error_response(
                message="Error de validación",
                errors=[f'El código del repuesto {data["codigo"]} ya existe'],
                status_code=400
            )
        
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
        
        return success_response(
            data={
                'id': repuesto.id,
                'codigo': repuesto.codigo,
                'nombre': repuesto.nombre,
                'categoria': repuesto.categoria,
                'stock_actual': repuesto.stock
            },
            message="Repuesto creado exitosamente",
            status_code=201
        )
        
    except Exception as e:
        db.session.rollback()
        return error_response(
            message="Error al crear el repuesto",
            errors=[str(e)],
            status_code=500
        )

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
                raise CodigoDuplicadoError(f'El código del repuesto {data["codigo"]} ya existe')
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

# Crear movimiento de inventario (corrigido)
@inventario_bp.route('/movimientos', methods=['POST'])
@jwt_required()
@transaction_handler
def create_movimiento():
    data = request.get_json()
    
    # Validar datos
    errores = validar_movimiento(data)
    if errores:
        return jsonify({'error': errores}), 400
    
    # Obtener repuesto
    repuesto = Repuesto.query.get(data['repuesto_id'])
    if not repuesto:
        raise RepuestoNoEncontradoError(f"Repuesto con ID {data['repuesto_id']} no encontrado")
    
    # Validar cantidad para salida
    cantidad = int(data['cantidad'])
    if data['tipo'] == 'salida' and repuesto.stock < cantidad:
        raise StockInsuficienteError(f'Stock insuficiente. Stock actual: {repuesto.stock}, Cantidad solicitada: {cantidad}')
    
    # Crear movimiento
    movimiento = MovimientoInventario(
        repuesto_id=data['repuesto_id'],
        tipo=data['tipo'],
        cantidad=cantidad,
        notas=data.get('motivo', ''),
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
    
    return jsonify({
        'mensaje': 'Movimiento registrado exitosamente',
        'movimiento': {
            'id': movimiento.id,
            'tipo': movimiento.tipo,
            'cantidad': movimiento.cantidad,
            'stock_actual': repuesto.stock
        }
    }), 201

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
        return handle_error(e) 
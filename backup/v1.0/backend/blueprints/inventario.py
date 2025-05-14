from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Repuesto, MovimientoInventario, Usuario, db
from datetime import datetime
from sqlalchemy import or_

inventario_bp = Blueprint('inventario', __name__)

# Obtener todos los repuestos
@inventario_bp.route('/api/repuestos', methods=['GET'])
@jwt_required()
def get_repuestos():
    try:
        repuestos = Repuesto.query.all()
        return jsonify([{
            'id': r.id,
            'nombre': r.nombre,
            'codigo': r.codigo,
            'descripcion': r.descripcion,
            'stock': r.stock,
            'stock_minimo': r.stock_minimo,
            'precio': r.precio,
            'categoria': r.categoria,
            'estado': r.estado,
            'fecha_registro': r.fecha_registro.isoformat()
        } for r in repuestos]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Obtener un repuesto específico
@inventario_bp.route('/api/repuestos/<int:id>', methods=['GET'])
@jwt_required()
def get_repuesto(id):
    try:
        repuesto = Repuesto.query.get_or_404(id)
        return jsonify({
            'id': repuesto.id,
            'nombre': repuesto.nombre,
            'codigo': repuesto.codigo,
            'descripcion': repuesto.descripcion,
            'stock': repuesto.stock,
            'stock_minimo': repuesto.stock_minimo,
            'precio': repuesto.precio,
            'categoria': repuesto.categoria,
            'estado': repuesto.estado,
            'fecha_registro': repuesto.fecha_registro.isoformat(),
            'movimientos': [{
                'id': m.id,
                'tipo': m.tipo,
                'cantidad': m.cantidad,
                'fecha': m.fecha.isoformat(),
                'servicio': {
                    'id': m.servicio.id,
                    'tipo': m.servicio.tipo_servicio
                } if m.servicio else None,
                'usuario': f"{m.usuario.nombre} {m.usuario.apellido}"
            } for m in repuesto.movimientos]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Crear un nuevo repuesto
@inventario_bp.route('/api/repuestos', methods=['POST'])
@jwt_required()
def crear_repuesto():
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['nombre', 'codigo', 'categoria', 'precio', 'stock', 'stock_minimo']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo {field} es requerido'}), 400
        
        # Verificar si el código ya existe
        if Repuesto.query.filter_by(codigo=data['codigo']).first():
            return jsonify({'error': 'El código ya está registrado'}), 400
        
        # Crear nuevo repuesto
        nuevo_repuesto = Repuesto(
            nombre=data['nombre'],
            codigo=data['codigo'],
            categoria=data['categoria'],
            precio=data['precio'],
            stock=data['stock'],
            stock_minimo=data['stock_minimo'],
            estado='activo'
        )
        
        db.session.add(nuevo_repuesto)
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Repuesto creado exitosamente',
            'repuesto': {
                'id': nuevo_repuesto.id,
                'nombre': nuevo_repuesto.nombre,
                'codigo': nuevo_repuesto.codigo,
                'categoria': nuevo_repuesto.categoria,
                'precio': nuevo_repuesto.precio,
                'stock': nuevo_repuesto.stock,
                'stock_minimo': nuevo_repuesto.stock_minimo,
                'estado': nuevo_repuesto.estado
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Actualizar un repuesto
@inventario_bp.route('/api/repuestos/<int:id>', methods=['PUT'])
@jwt_required()
def actualizar_repuesto(id):
    try:
        repuesto = Repuesto.query.get_or_404(id)
        data = request.get_json()
        
        # Actualizar campos permitidos
        if 'nombre' in data:
            repuesto.nombre = data['nombre']
        if 'categoria' in data:
            repuesto.categoria = data['categoria']
        if 'precio' in data:
            repuesto.precio = data['precio']
        if 'stock_minimo' in data:
            repuesto.stock_minimo = data['stock_minimo']
        if 'estado' in data:
            repuesto.estado = data['estado']
        
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Repuesto actualizado exitosamente',
            'repuesto': {
                'id': repuesto.id,
                'nombre': repuesto.nombre,
                'codigo': repuesto.codigo,
                'categoria': repuesto.categoria,
                'precio': repuesto.precio,
                'stock': repuesto.stock,
                'stock_minimo': repuesto.stock_minimo,
                'estado': repuesto.estado
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Eliminar un repuesto (soft delete)
@inventario_bp.route('/api/repuestos/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_repuesto(id):
    try:
        repuesto = Repuesto.query.get_or_404(id)
        
        # Verificar si tiene movimientos
        if repuesto.movimientos:
            return jsonify({
                'error': 'No se puede eliminar el repuesto porque tiene movimientos asociados'
            }), 400
        
        # Soft delete
        repuesto.estado = 'inactivo'
        db.session.commit()
        
        return jsonify({
            'message': 'Repuesto eliminado exitosamente'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Obtener movimientos de inventario
@inventario_bp.route('/api/movimientos', methods=['GET'])
@jwt_required()
def get_movimientos():
    try:
        movimientos = MovimientoInventario.query.all()
        return jsonify([{
            'id': m.id,
            'tipo': m.tipo,
            'cantidad': m.cantidad,
            'fecha': m.fecha.isoformat(),
            'repuesto': {
                'id': m.repuesto.id,
                'nombre': m.repuesto.nombre,
                'codigo': m.repuesto.codigo
            },
            'servicio': {
                'id': m.servicio.id,
                'tipo': m.servicio.tipo_servicio
            } if m.servicio else None,
            'usuario': f"{m.usuario.nombre} {m.usuario.apellido}"
        } for m in movimientos]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Crear un movimiento de inventario
@inventario_bp.route('/api/movimientos', methods=['POST'])
@jwt_required()
def create_movimiento():
    try:
        data = request.get_json()
        usuario_id = get_jwt_identity()
        
        # Validar datos requeridos
        required_fields = ['repuesto_id', 'tipo', 'cantidad']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'El campo {field} es requerido'}), 400
        
        # Verificar repuesto
        repuesto = Repuesto.query.get_or_404(data['repuesto_id'])
        
        # Verificar stock para salidas
        if data['tipo'] == 'salida' and repuesto.stock < data['cantidad']:
            return jsonify({'error': 'Stock insuficiente'}), 400
        
        # Crear movimiento
        movimiento = MovimientoInventario(
            repuesto=repuesto,
            tipo=data['tipo'],
            cantidad=data['cantidad'],
            servicio_id=data.get('servicio_id'),
            usuario=Usuario.query.get(usuario_id),
            fecha=datetime.now()
        )
        
        # Actualizar stock
        if data['tipo'] == 'entrada':
            repuesto.stock += data['cantidad']
        else:  # salida
            repuesto.stock -= data['cantidad']
        
        db.session.add(movimiento)
        db.session.commit()
        
        return jsonify({
            'message': 'Movimiento registrado exitosamente',
            'id': movimiento.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Obtener repuestos por categoría
@inventario_bp.route('/api/repuestos/categoria/<string:categoria>', methods=['GET'])
@jwt_required()
def get_repuestos_por_categoria(categoria):
    try:
        repuestos = Repuesto.query.filter_by(categoria=categoria, estado='activo').all()
        return jsonify([{
            'id': r.id,
            'nombre': r.nombre,
            'codigo': r.codigo,
            'stock': r.stock,
            'stock_minimo': r.stock_minimo,
            'precio': r.precio
        } for r in repuestos]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Obtener repuestos con stock bajo
@inventario_bp.route('/api/repuestos/stock-bajo', methods=['GET'])
@jwt_required()
def get_repuestos_stock_bajo():
    try:
        repuestos = Repuesto.query.filter(
            Repuesto.stock <= Repuesto.stock_minimo,
            Repuesto.estado == 'activo'
        ).all()
        return jsonify([{
            'id': r.id,
            'nombre': r.nombre,
            'codigo': r.codigo,
            'stock': r.stock,
            'stock_minimo': r.stock_minimo,
            'precio': r.precio,
            'categoria': r.categoria
        } for r in repuestos]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Buscar repuestos
@inventario_bp.route('/api/repuestos/buscar/<string:termino>', methods=['GET'])
@jwt_required()
def buscar_repuestos(termino):
    try:
        repuestos = Repuesto.query.filter(
            or_(
                Repuesto.nombre.ilike(f'%{termino}%'),
                Repuesto.codigo.ilike(f'%{termino}%'),
                Repuesto.categoria.ilike(f'%{termino}%')
            ),
            Repuesto.estado == 'activo'
        ).all()
        return jsonify([{
            'id': r.id,
            'nombre': r.nombre,
            'codigo': r.codigo,
            'stock': r.stock,
            'precio': r.precio,
            'categoria': r.categoria
        } for r in repuestos]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Obtener lista de repuestos
@inventario_bp.route('/api/repuestos', methods=['GET'])
@jwt_required()
def listar_repuestos():
    try:
        # Obtener parámetros de filtrado
        categoria = request.args.get('categoria')
        stock_minimo = request.args.get('stock_minimo')
        busqueda = request.args.get('q')
        
        # Construir query base
        query = Repuesto.query
        
        # Aplicar filtros
        if categoria:
            query = query.filter_by(categoria=categoria)
        if stock_minimo:
            query = query.filter(Repuesto.stock <= Repuesto.stock_minimo)
        if busqueda:
            query = query.filter(
                or_(
                    Repuesto.nombre.ilike(f'%{busqueda}%'),
                    Repuesto.codigo.ilike(f'%{busqueda}%'),
                    Repuesto.categoria.ilike(f'%{busqueda}%')
                )
            )
        
        repuestos = query.order_by(Repuesto.nombre).all()
        
        return jsonify({
            'repuestos': [{
                'id': r.id,
                'codigo': r.codigo,
                'nombre': r.nombre,
                'descripcion': r.descripcion,
                'categoria': r.categoria,
                'precio': r.precio,
                'stock': r.stock,
                'stock_minimo': r.stock_minimo,
                'estado': 'bajo_stock' if r.stock <= r.stock_minimo else 'normal'
            } for r in repuestos]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Obtener repuesto por ID
@inventario_bp.route('/api/repuestos/<int:id>', methods=['GET'])
@jwt_required()
def obtener_repuesto(id):
    try:
        repuesto = Repuesto.query.get_or_404(id)
        
        # Obtener movimientos recientes
        movimientos = MovimientoInventario.query.filter_by(repuesto_id=id).order_by(MovimientoInventario.fecha.desc()).limit(10).all()
        
        return jsonify({
            'id': repuesto.id,
            'codigo': repuesto.codigo,
            'nombre': repuesto.nombre,
            'descripcion': repuesto.descripcion,
            'categoria': repuesto.categoria,
            'precio': repuesto.precio,
            'stock': repuesto.stock,
            'stock_minimo': repuesto.stock_minimo,
            'estado': 'bajo_stock' if repuesto.stock <= repuesto.stock_minimo else 'normal',
            'movimientos_recientes': [{
                'id': m.id,
                'fecha': m.fecha.isoformat(),
                'tipo': m.tipo,
                'cantidad': m.cantidad,
                'stock_anterior': m.stock_anterior,
                'stock_nuevo': m.stock_nuevo,
                'servicio': {
                    'id': m.servicio.id,
                    'tipo': m.servicio.tipo_servicio,
                    'vehiculo': m.servicio.vehiculo.placa
                } if m.servicio else None
            } for m in movimientos]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Ajustar stock
@inventario_bp.route('/api/repuestos/<int:id>/stock', methods=['PUT'])
@jwt_required()
def ajustar_stock(id):
    try:
        repuesto = Repuesto.query.get_or_404(id)
        data = request.get_json()
        
        # Validar datos requeridos
        if 'cantidad' not in data or 'tipo' not in data:
            return jsonify({'error': 'Cantidad y tipo son requeridos'}), 400
        
        # Validar tipo de movimiento
        if data['tipo'] not in ['entrada', 'salida']:
            return jsonify({'error': 'Tipo inválido'}), 400
        
        # Validar cantidad
        if data['cantidad'] <= 0:
            return jsonify({'error': 'La cantidad debe ser mayor a 0'}), 400
        
        # Validar stock suficiente para salida
        if data['tipo'] == 'salida' and repuesto.stock < data['cantidad']:
            return jsonify({'error': 'Stock insuficiente'}), 400
        
        # Crear movimiento
        movimiento = MovimientoInventario(
            repuesto_id=repuesto.id,
            tipo=data['tipo'],
            cantidad=data['cantidad'],
            fecha=datetime.now(),
            usuario_id=get_jwt_identity()
        )
        
        # Actualizar stock
        if data['tipo'] == 'entrada':
            repuesto.stock += data['cantidad']
        else:
            repuesto.stock -= data['cantidad']
        
        db.session.add(movimiento)
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Stock ajustado exitosamente',
            'repuesto': {
                'id': repuesto.id,
                'nombre': repuesto.nombre,
                'stock': repuesto.stock,
                'stock_minimo': repuesto.stock_minimo
            },
            'movimiento': {
                'id': movimiento.id,
                'tipo': movimiento.tipo,
                'cantidad': movimiento.cantidad,
                'fecha': movimiento.fecha.isoformat()
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Obtener movimientos de inventario
@inventario_bp.route('/api/movimientos-inventario', methods=['GET'])
@jwt_required()
def listar_movimientos():
    try:
        # Obtener parámetros de filtrado
        tipo = request.args.get('tipo')
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        repuesto_id = request.args.get('repuesto_id')
        
        # Construir query base
        query = MovimientoInventario.query
        
        # Aplicar filtros
        if tipo:
            query = query.filter_by(tipo=tipo)
        if fecha_inicio:
            query = query.filter(MovimientoInventario.fecha >= datetime.fromisoformat(fecha_inicio))
        if fecha_fin:
            query = query.filter(MovimientoInventario.fecha <= datetime.fromisoformat(fecha_fin))
        if repuesto_id:
            query = query.filter_by(repuesto_id=repuesto_id)
        
        movimientos = query.order_by(MovimientoInventario.fecha.desc()).all()
        
        return jsonify({
            'movimientos': [{
                'id': m.id,
                'fecha': m.fecha.isoformat(),
                'tipo': m.tipo,
                'cantidad': m.cantidad,
                'stock_anterior': m.stock_anterior,
                'stock_nuevo': m.stock_nuevo,
                'repuesto': {
                    'id': m.repuesto.id,
                    'codigo': m.repuesto.codigo,
                    'nombre': m.repuesto.nombre
                },
                'servicio': {
                    'id': m.servicio.id,
                    'tipo': m.servicio.tipo_servicio,
                    'vehiculo': m.servicio.vehiculo.placa
                } if m.servicio else None
            } for m in movimientos]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500 
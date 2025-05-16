from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from models import Repuesto, MovimientoInventario, Proveedor, db
from datetime import datetime
from sqlalchemy import or_, and_

inventario_bp = Blueprint('inventario', __name__)

# ========== PROVEEDORES ==========

@inventario_bp.route('/proveedores', methods=['GET'])
@jwt_required()
def get_proveedores():
    try:
        # Obtener parámetros de filtrado
        estado = request.args.get('estado')
        busqueda = request.args.get('q')
        
        # Construir query base
        query = Proveedor.query
        
        # Aplicar filtros
        if estado:
            query = query.filter_by(estado=estado)
        if busqueda:
            query = query.filter(
                or_(
                    Proveedor.nombre.ilike(f'%{busqueda}%'),
                    Proveedor.contacto.ilike(f'%{busqueda}%'),
                    Proveedor.email.ilike(f'%{busqueda}%'),
                    Proveedor.telefono.ilike(f'%{busqueda}%')
                )
            )
        
        proveedores = query.order_by(Proveedor.nombre).all()
        
        return jsonify({
            'proveedores': [p.to_dict() for p in proveedores]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@inventario_bp.route('/proveedores/<int:id>', methods=['GET'])
@jwt_required()
def get_proveedor(id):
    try:
        proveedor = Proveedor.query.get_or_404(id)
        return jsonify(proveedor.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@inventario_bp.route('/proveedores', methods=['POST'])
@jwt_required()
def create_proveedor():
    try:
        data = request.get_json()
        
        # Validar datos
        errores = validar_proveedor(data)
        if errores:
            return jsonify({'error': 'Datos inválidos', 'detalles': errores}), 400
            
        # Verificar nombre único
        if Proveedor.query.filter_by(nombre=data['nombre']).first():
            return jsonify({'error': 'Ya existe un proveedor con ese nombre'}), 400
        
        # Crear proveedor
        proveedor = Proveedor(
            nombre=data['nombre'],
            contacto=data['contacto'],
            telefono=data['telefono'],
            email=data.get('email'),
            direccion=data.get('direccion'),
            notas=data.get('notas'),
            estado=data.get('estado', 'activo')
        )
        
        db.session.add(proveedor)
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Proveedor creado exitosamente',
            'proveedor': {
                'id': proveedor.id,
                'nombre': proveedor.nombre,
                'contacto': proveedor.contacto,
                'telefono': proveedor.telefono
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@inventario_bp.route('/proveedores/<int:id>', methods=['PUT'])
@jwt_required()
def update_proveedor(id):
    try:
        proveedor = Proveedor.query.get_or_404(id)
        data = request.get_json()
        
        # Validar datos
        errores = validar_proveedor(data, es_actualizacion=True)
        if errores:
            return jsonify({'error': 'Datos inválidos', 'detalles': errores}), 400
            
        # Verificar nombre único si se está actualizando
        if 'nombre' in data and data['nombre'] != proveedor.nombre:
            if Proveedor.query.filter_by(nombre=data['nombre']).first():
                return jsonify({'error': 'Ya existe un proveedor con ese nombre'}), 400
        
        # Actualizar campos
        for field in ['nombre', 'contacto', 'telefono', 'email', 'direccion', 'notas', 'estado']:
            if field in data:
                setattr(proveedor, field, data[field])
                
        proveedor.fecha_actualizacion = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Proveedor actualizado exitosamente',
            'proveedor': {
                'id': proveedor.id,
                'nombre': proveedor.nombre,
                'contacto': proveedor.contacto,
                'telefono': proveedor.telefono
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@inventario_bp.route('/proveedores/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_proveedor(id):
    try:
        proveedor = Proveedor.query.get_or_404(id)
        
        # Verificar si hay repuestos asociados
        if proveedor.repuestos:
            return jsonify({
                'error': 'No se puede eliminar el proveedor porque tiene repuestos asociados'
            }), 400
        
        db.session.delete(proveedor)
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Proveedor eliminado exitosamente'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

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
def create_repuesto():
    try:
        data = request.get_json()
        
        # Validar datos
        errores = validar_repuesto(data)
        if errores:
            return jsonify({'error': 'Datos inválidos', 'detalles': errores}), 400
            
        # Verificar código único
        if Repuesto.query.filter_by(codigo=data['codigo']).first():
            return jsonify({'error': 'Ya existe un repuesto con ese código'}), 400
        
        # Crear repuesto
        repuesto = Repuesto(
            codigo=data['codigo'],
            nombre=data['nombre'],
            descripcion=data.get('descripcion', ''),
            precio_compra=float(data['precio_compra']),
            precio_venta=float(data['precio_venta']),
            stock=int(data.get('stock', 0)),
            stock_minimo=int(data.get('stock_minimo', 0)),
            proveedor_id=data.get('proveedor_id'),
            estado=data.get('estado', 'activo')
        )
        
        db.session.add(repuesto)
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Repuesto creado exitosamente',
            'repuesto': {
                'id': repuesto.id,
                'codigo': repuesto.codigo,
                'nombre': repuesto.nombre,
                'stock': repuesto.stock,
                'stock_minimo': repuesto.stock_minimo
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
        
        # Validar datos
        errores = validar_repuesto(data, es_actualizacion=True)
        if errores:
            return jsonify({'error': 'Datos inválidos', 'detalles': errores}), 400
            
        # Verificar código único si se está actualizando
        if 'codigo' in data and data['codigo'] != repuesto.codigo:
            if Repuesto.query.filter_by(codigo=data['codigo']).first():
                return jsonify({'error': 'Ya existe un repuesto con ese código'}), 400
        
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
def create_movimiento():
    try:
        data = request.get_json()
        
        # Validar campos requeridos
        required_fields = ['repuesto_id', 'cantidad', 'tipo']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo {field} es requerido'}), 400
                
        # Validar tipo de movimiento
        if data['tipo'] not in ['entrada', 'salida']:
            return jsonify({'error': 'Tipo de movimiento inválido'}), 400
            
        # Registrar movimiento
        exito, mensaje = registrar_movimiento(
            repuesto_id=data['repuesto_id'],
            cantidad=data['cantidad'],
            tipo=data['tipo'],
            notas=data.get('notas'),
            servicio_id=data.get('servicio_id'),
            usuario_id=data.get('usuario_id')
        )
        
        if not exito:
            return jsonify({'error': mensaje}), 400
            
        return jsonify({
            'mensaje': mensaje,
            'movimiento': {
                'repuesto_id': data['repuesto_id'],
                'tipo': data['tipo'],
                'cantidad': data['cantidad']
            }
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@inventario_bp.route('/movimientos/batch', methods=['POST'])
@jwt_required()
def create_movimientos_batch():
    try:
        data = request.get_json()
        if not isinstance(data, list):
            return jsonify({'error': 'Se espera una lista de movimientos'}), 400
            
        resultados = {
            'exitosos': 0,
            'fallidos': 0,
            'detalles': []
        }
        
        for movimiento_data in data:
            try:
                # Validar campos requeridos
                required_fields = ['repuesto_id', 'cantidad', 'tipo']
                if not all(field in movimiento_data for field in required_fields):
                    resultados['fallidos'] += 1
                    resultados['detalles'].append({
                        'error': 'Campos requeridos faltantes',
                        'data': movimiento_data
                    })
                    continue
                    
                # Registrar movimiento
                exito, mensaje = registrar_movimiento(
                    repuesto_id=movimiento_data['repuesto_id'],
                    cantidad=movimiento_data['cantidad'],
                    tipo=movimiento_data['tipo'],
                    notas=movimiento_data.get('notas'),
                    servicio_id=movimiento_data.get('servicio_id'),
                    usuario_id=movimiento_data.get('usuario_id')
                )
                
                if exito:
                    resultados['exitosos'] += 1
                    resultados['detalles'].append({
                        'repuesto_id': movimiento_data['repuesto_id'],
                        'tipo': movimiento_data['tipo'],
                        'cantidad': movimiento_data['cantidad'],
                        'estado': 'exitoso'
                    })
                else:
                    resultados['fallidos'] += 1
                    resultados['detalles'].append({
                        'repuesto_id': movimiento_data['repuesto_id'],
                        'error': mensaje
                    })
                    
            except Exception as e:
                resultados['fallidos'] += 1
                resultados['detalles'].append({
                    'error': str(e),
                    'data': movimiento_data
                })
                
        return jsonify({
            'mensaje': 'Procesamiento de movimientos completado',
            'resultados': resultados
        }), 200
    except Exception as e:
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

# ========== GESTIÓN DE STOCK Y ALERTAS ==========

@inventario_bp.route('/alertas/stock-bajo', methods=['GET'])
@jwt_required()
def get_alertas_stock_bajo():
    try:
        # Obtener repuestos con stock bajo
        repuestos_bajo_stock = Repuesto.query.filter(
            Repuesto.stock <= Repuesto.stock_minimo
        ).all()
        
        return jsonify({
            'alertas': [{
                'id': r.id,
                'codigo': r.codigo,
                'nombre': r.nombre,
                'stock_actual': r.stock,
                'stock_minimo': r.stock_minimo,
                'diferencia': r.stock_minimo - r.stock,
                'proveedor': r.proveedor.to_dict() if r.proveedor else None
            } for r in repuestos_bajo_stock]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@inventario_bp.route('/repuestos/<int:id>/ajustar-stock-minimo', methods=['PUT'])
@jwt_required()
def ajustar_stock_minimo(id):
    try:
        repuesto = Repuesto.query.get_or_404(id)
        data = request.get_json()
        
        if 'stock_minimo' not in data:
            return jsonify({'error': 'El stock mínimo es requerido'}), 400
            
        nuevo_stock_minimo = int(data['stock_minimo'])
        if nuevo_stock_minimo < 0:
            return jsonify({'error': 'El stock mínimo no puede ser negativo'}), 400
            
        repuesto.stock_minimo = nuevo_stock_minimo
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Stock mínimo actualizado exitosamente',
            'repuesto': {
                'id': repuesto.id,
                'codigo': repuesto.codigo,
                'nombre': repuesto.nombre,
                'stock_actual': repuesto.stock,
                'stock_minimo': repuesto.stock_minimo
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@inventario_bp.route('/repuestos/batch/ajustar-stock-minimo', methods=['PUT'])
@jwt_required()
def ajustar_stock_minimo_batch():
    try:
        data = request.get_json()
        if not isinstance(data, list):
            return jsonify({'error': 'Se espera una lista de ajustes'}), 400
            
        resultados = []
        for ajuste in data:
            if 'id' not in ajuste or 'stock_minimo' not in ajuste:
                continue
                
            repuesto = Repuesto.query.get(ajuste['id'])
            if repuesto:
                repuesto.stock_minimo = int(ajuste['stock_minimo'])
                resultados.append({
                    'id': repuesto.id,
                    'codigo': repuesto.codigo,
                    'nombre': repuesto.nombre,
                    'stock_minimo': repuesto.stock_minimo
                })
        
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Stock mínimo actualizado para múltiples repuestos',
            'resultados': resultados
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ========== REPORTES DE INVENTARIO ==========

@inventario_bp.route('/reportes/valor-inventario', methods=['GET'])
@jwt_required()
def get_valor_inventario():
    try:
        # Calcular valor total del inventario
        repuestos = Repuesto.query.filter_by(estado='activo').all()
        valor_total = sum(r.stock * r.precio_compra for r in repuestos)
        valor_venta = sum(r.stock * r.precio_venta for r in repuestos)
        
        return jsonify({
            'valor_total_compra': valor_total,
            'valor_total_venta': valor_venta,
            'margen_bruto': valor_venta - valor_total,
            'cantidad_repuestos': len(repuestos),
            'repuestos_bajo_stock': len([r for r in repuestos if r.stock <= r.stock_minimo])
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@inventario_bp.route('/reportes/movimientos', methods=['GET'])
@jwt_required()
def get_reportes_movimientos():
    try:
        # Obtener parámetros
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        tipo = request.args.get('tipo')
        
        # Construir query base
        query = MovimientoInventario.query
        
        # Aplicar filtros
        if fecha_inicio:
            query = query.filter(MovimientoInventario.fecha >= fecha_inicio)
        if fecha_fin:
            query = query.filter(MovimientoInventario.fecha <= fecha_fin)
        if tipo:
            query = query.filter_by(tipo=tipo)
            
        movimientos = query.order_by(MovimientoInventario.fecha.desc()).all()
        
        return jsonify({
            'movimientos': [{
                'id': m.id,
                'fecha': m.fecha.isoformat(),
                'tipo': m.tipo,
                'cantidad': m.cantidad,
                'repuesto': {
                    'id': m.repuesto.id,
                    'codigo': m.repuesto.codigo,
                    'nombre': m.repuesto.nombre
                },
                'notas': m.notas
            } for m in movimientos]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== SINCRONIZACIÓN CON PROVEEDORES ==========

@inventario_bp.route('/proveedores/<int:id>/repuestos', methods=['GET'])
@jwt_required()
def get_repuestos_proveedor(id):
    try:
        proveedor = Proveedor.query.get_or_404(id)
        repuestos = Repuesto.query.filter_by(proveedor_id=id).all()
        
        return jsonify({
            'proveedor': proveedor.to_dict(),
            'repuestos': [{
                'id': r.id,
                'codigo': r.codigo,
                'nombre': r.nombre,
                'stock_actual': r.stock,
                'stock_minimo': r.stock_minimo,
                'precio_compra': r.precio_compra,
                'precio_venta': r.precio_venta,
                'estado': r.estado
            } for r in repuestos]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@inventario_bp.route('/proveedores/<int:id>/sincronizar', methods=['POST'])
@jwt_required()
def sincronizar_proveedor(id):
    try:
        proveedor = Proveedor.query.get_or_404(id)
        data = request.get_json()
        
        if 'repuestos' not in data:
            return jsonify({'error': 'Lista de repuestos requerida'}), 400
            
        resultados = {
            'actualizados': 0,
            'creados': 0,
            'errores': 0,
            'detalles': []
        }
        
        for repuesto_data in data['repuestos']:
            try:
                # Buscar repuesto existente por código
                repuesto = Repuesto.query.filter_by(
                    codigo=repuesto_data['codigo']
                ).first()
                
                if repuesto:
                    # Actualizar repuesto existente
                    repuesto.nombre = repuesto_data.get('nombre', repuesto.nombre)
                    repuesto.precio_compra = repuesto_data.get('precio_compra', repuesto.precio_compra)
                    repuesto.precio_venta = repuesto_data.get('precio_venta', repuesto.precio_venta)
                    repuesto.proveedor_id = id
                    resultados['actualizados'] += 1
                else:
                    # Crear nuevo repuesto
                    repuesto = Repuesto(
                        codigo=repuesto_data['codigo'],
                        nombre=repuesto_data['nombre'],
                        precio_compra=repuesto_data['precio_compra'],
                        precio_venta=repuesto_data['precio_venta'],
                        proveedor_id=id,
                        stock=0,
                        stock_minimo=5
                    )
                    db.session.add(repuesto)
                    resultados['creados'] += 1
                
                resultados['detalles'].append({
                    'codigo': repuesto_data['codigo'],
                    'accion': 'actualizado' if repuesto.id else 'creado'
                })
                
            except Exception as e:
                resultados['errores'] += 1
                resultados['detalles'].append({
                    'codigo': repuesto_data.get('codigo', 'desconocido'),
                    'error': str(e)
                })
        
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Sincronización completada',
            'resultados': resultados
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@inventario_bp.route('/proveedores/sincronizar-todos', methods=['POST'])
@jwt_required()
def sincronizar_todos_proveedores():
    try:
        proveedores = Proveedor.query.filter_by(estado='activo').all()
        resultados = {
            'total_proveedores': len(proveedores),
            'procesados': 0,
            'errores': 0,
            'detalles': []
        }
        
        for proveedor in proveedores:
            try:
                # Aquí iría la lógica para obtener datos del proveedor
                # Por ahora, solo simulamos la sincronización
                resultados['procesados'] += 1
                resultados['detalles'].append({
                    'proveedor_id': proveedor.id,
                    'nombre': proveedor.nombre,
                    'estado': 'completado'
                })
            except Exception as e:
                resultados['errores'] += 1
                resultados['detalles'].append({
                    'proveedor_id': proveedor.id,
                    'nombre': proveedor.nombre,
                    'error': str(e)
                })
        
        return jsonify({
            'mensaje': 'Sincronización masiva completada',
            'resultados': resultados
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== VALIDACIONES DE PROVEEDORES ==========

def validar_proveedor(data, es_actualizacion=False):
    """Valida los datos de un proveedor"""
    errores = []
    
    # Validar campos requeridos
    required_fields = ['nombre', 'contacto', 'telefono']
    for field in required_fields:
        if not es_actualizacion and field not in data:
            errores.append(f'Campo {field} es requerido')
        elif field in data and not data[field]:
            errores.append(f'Campo {field} no puede estar vacío')
    
    # Validar email si se proporciona
    if 'email' in data and data['email']:
        if not '@' in data['email'] or not '.' in data['email']:
            errores.append('El email no es válido')
    
    # Validar teléfono si se proporciona
    if 'telefono' in data:
        telefono = str(data['telefono']).replace(' ', '').replace('-', '')
        if not telefono.isdigit() or len(telefono) < 7:
            errores.append('El teléfono debe contener al menos 7 dígitos')
    
    # Validar dirección si se proporciona
    if 'direccion' in data and data['direccion']:
        if len(data['direccion']) < 5:
            errores.append('La dirección debe tener al menos 5 caracteres')
    
    return errores 
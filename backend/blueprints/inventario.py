from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from models import Repuesto, MovimientoInventario, db

inventario_bp = Blueprint('inventario', __name__)

# Obtener todos los repuestos
@inventario_bp.route('/repuestos', methods=['GET'])
@jwt_required()
def get_repuestos():
    try:
        repuestos = Repuesto.query.all()
        return jsonify({
            'repuestos': [{
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
            } for repuesto in repuestos]
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

# Crear nuevo repuesto
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
        
        # Verificar si el código ya existe
        if Repuesto.query.filter_by(codigo=data['codigo']).first():
            return jsonify({'error': 'El código del repuesto ya existe'}), 400
        
        # Crear nuevo repuesto
        nuevo_repuesto = Repuesto(
            codigo=data['codigo'],
            nombre=data['nombre'],
            descripcion=data.get('descripcion', ''),
            categoria=data['categoria'],
            stock_minimo=data.get('stock_minimo', 0),
            stock=data.get('stock', 0),
            precio_compra=data['precio_compra'],
            precio_venta=data['precio_venta'],
            estado='activo'
        )
        
        db.session.add(nuevo_repuesto)
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Repuesto creado exitosamente',
            'repuesto': {
                'id': nuevo_repuesto.id,
                'codigo': nuevo_repuesto.codigo,
                'nombre': nuevo_repuesto.nombre,
                'categoria': nuevo_repuesto.categoria,
                'stock_actual': nuevo_repuesto.stock
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Agregar rutas aquí cuando las necesites 
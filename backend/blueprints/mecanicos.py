from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from models import Mecanico, Servicio, HoraTrabajo, db
from sqlalchemy import or_

mecanicos_bp = Blueprint('mecanicos', __name__)

# Crear nuevo mecánico
@mecanicos_bp.route('/', methods=['POST'])
@jwt_required()
def create_mecanico():
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['nombre', 'apellido', 'email', 'especialidad', 'tarifa_hora']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo {field} es requerido'}), 400
        
        # Verificar si el email ya existe
        if Mecanico.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'El email ya está registrado'}), 400
        
        # Crear nuevo mecánico
        nuevo_mecanico = Mecanico(
            nombre=data['nombre'],
            apellido=data['apellido'],
            email=data['email'],
            telefono=data.get('telefono', ''),
            especialidad=data['especialidad'],
            tarifa_hora=data['tarifa_hora'],
            estado='activo'
        )
        
        db.session.add(nuevo_mecanico)
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Mecánico creado exitosamente',
            'mecanico': {
                'id': nuevo_mecanico.id,
                'nombre': nuevo_mecanico.nombre,
                'apellido': nuevo_mecanico.apellido,
                'email': nuevo_mecanico.email,
                'telefono': nuevo_mecanico.telefono,
                'especialidad': nuevo_mecanico.especialidad,
                'tarifa_hora': nuevo_mecanico.tarifa_hora,
                'estado': nuevo_mecanico.estado
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Obtener lista de mecánicos
@mecanicos_bp.route('/', methods=['GET'])
@jwt_required()
def get_mecanicos():
    try:
        mecanicos = Mecanico.query.all()
        return jsonify({
            'mecanicos': [{
                'id': mecanico.id,
                'nombre': mecanico.nombre,
                'apellido': mecanico.apellido,
                'especialidad': mecanico.especialidad,
                'telefono': mecanico.telefono,
                'email': mecanico.email,
                'estado': mecanico.estado
            } for mecanico in mecanicos]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Obtener mecánico por ID
@mecanicos_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_mecanico(id):
    try:
        mecanico = Mecanico.query.get_or_404(id)
        return jsonify({
            'id': mecanico.id,
            'nombre': mecanico.nombre,
            'apellido': mecanico.apellido,
            'especialidad': mecanico.especialidad,
            'telefono': mecanico.telefono,
            'email': mecanico.email,
            'estado': mecanico.estado,
            'servicios': [{
                'id': servicio.id,
                'tipo_servicio': servicio.tipo_servicio,
                'estado': servicio.estado,
                'fecha_inicio': servicio.fecha_inicio.isoformat() if servicio.fecha_inicio else None
            } for servicio in mecanico.servicios]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Actualizar mecánico
@mecanicos_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_mecanico(id):
    try:
        mecanico = Mecanico.query.get_or_404(id)
        data = request.get_json()
        
        # Actualizar campos permitidos
        if 'nombre' in data:
            mecanico.nombre = data['nombre']
        if 'apellido' in data:
            mecanico.apellido = data['apellido']
        if 'email' in data:
            # Verificar si el nuevo email ya existe
            existing = Mecanico.query.filter_by(email=data['email']).first()
            if existing and existing.id != id:
                return jsonify({'error': 'El email ya está registrado'}), 400
            mecanico.email = data['email']
        if 'telefono' in data:
            mecanico.telefono = data['telefono']
        if 'especialidad' in data:
            mecanico.especialidad = data['especialidad']
        if 'tarifa_hora' in data:
            mecanico.tarifa_hora = data['tarifa_hora']
        if 'estado' in data:
            mecanico.estado = data['estado']
        
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Mecánico actualizado exitosamente',
            'mecanico': {
                'id': mecanico.id,
                'nombre': mecanico.nombre,
                'apellido': mecanico.apellido,
                'email': mecanico.email,
                'telefono': mecanico.telefono,
                'especialidad': mecanico.especialidad,
                'tarifa_hora': mecanico.tarifa_hora,
                'estado': mecanico.estado
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Obtener servicios de mecánico
@mecanicos_bp.route('/api/mecanicos/<int:id>/servicios', methods=['GET'])
@jwt_required()
def listar_servicios_mecanico(id):
    try:
        mecanico = Mecanico.query.get_or_404(id)
        servicios = Servicio.query.filter_by(mecanico_id=id).all()
        
        return jsonify({
            'mecanico': {
                'id': mecanico.id,
                'nombre': mecanico.nombre,
                'apellido': mecanico.apellido,
                'especialidad': mecanico.especialidad,
                'tarifa_hora': mecanico.tarifa_hora
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
                    'cantidad': next((m.cantidad for m in s.movimientos_inventario if m.repuesto_id == r.id), 0),
                    'precio_compra': r.precio_compra,
                    'precio_venta': r.precio_venta
                } for r in s.repuestos],
                'horas_trabajo': sum(h.horas for h in s.horas_trabajo),
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

# Eliminar mecánico
@mecanicos_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_mecanico(id):
    try:
        mecanico = Mecanico.query.get_or_404(id)
        
        # Verificar si tiene servicios asociados
        if mecanico.servicios:
            return jsonify({'error': 'No se puede eliminar un mecánico con servicios asociados'}), 400
            
        mecanico.estado = 'inactivo'
        db.session.commit()
        return jsonify({'message': 'Mecánico eliminado exitosamente'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500 
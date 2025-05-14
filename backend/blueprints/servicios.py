from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Servicio, Mecanico, Vehiculo, HoraTrabajo, Repuesto, MovimientoInventario, Usuario, Factura, HistorialEstado, Cliente
from datetime import datetime, timezone
from sqlalchemy import or_

servicios_bp = Blueprint('servicios', __name__)

# Rutas para Mecánicos
@servicios_bp.route('/mecanicos', methods=['GET'])
@jwt_required()
def get_mecanicos():
    try:
        mecanicos = Mecanico.query.all()
        return jsonify([{
            'id': m.id,
            'nombre': m.nombre,
            'apellido': m.apellido,
            'especialidad': m.especialidad,
            'telefono': m.telefono,
            'email': m.email,
            'activo': m.estado == 'activo',
            'servicios': [{
                'id': s.id,
                'descripcion': s.descripcion,
                'fecha': s.fecha.isoformat(),
                'estado': s.estado
            } for s in m.servicios]
        } for m in mecanicos]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@servicios_bp.route('/mecanicos/<int:id>', methods=['GET'])
@jwt_required()
def get_mecanico(id):
    try:
        mecanico = Mecanico.query.get_or_404(id)
        return jsonify({
            'id': mecanico.id,
            'nombre': mecanico.nombre,
            'especialidad': mecanico.especialidad,
            'telefono': mecanico.telefono,
            'email': mecanico.email,
            'activo': mecanico.estado == 'activo',
            'servicios': [{
                'id': s.id,
                'descripcion': s.descripcion,
                'fecha': s.fecha.isoformat(),
                'estado': s.estado,
                'vehiculo': {
                    'id': s.vehiculo.id,
                    'marca': s.vehiculo.marca,
                    'modelo': s.vehiculo.modelo,
                    'placa': s.vehiculo.placa
                } if s.vehiculo else None
            } for s in mecanico.servicios],
            'horas_trabajo': [{
                'id': h.id,
                'fecha': h.fecha.isoformat(),
                'horas': h.horas,
                'descripcion': h.descripcion
            } for h in mecanico.horas_trabajo]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@servicios_bp.route('/mecanicos', methods=['POST'])
@jwt_required()
def create_mecanico():
    try:
        data = request.get_json()
        nuevo_mecanico = Mecanico(
            nombre=data['nombre'],
            especialidad=data['especialidad'],
            telefono=data['telefono'],
            email=data['email'],
            estado='activo'
        )
        db.session.add(nuevo_mecanico)
        db.session.commit()
        return jsonify({"mensaje": "Mecánico creado exitosamente", "id": nuevo_mecanico.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@servicios_bp.route('/mecanicos/<int:id>', methods=['PUT'])
@jwt_required()
def update_mecanico(id):
    try:
        mecanico = Mecanico.query.get_or_404(id)
        data = request.get_json()
        
        mecanico.nombre = data.get('nombre', mecanico.nombre)
        mecanico.especialidad = data.get('especialidad', mecanico.especialidad)
        mecanico.telefono = data.get('telefono', mecanico.telefono)
        mecanico.email = data.get('email', mecanico.email)
        mecanico.estado = data.get('estado', mecanico.estado)
        
        db.session.commit()
        return jsonify({"mensaje": "Mecánico actualizado exitosamente"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@servicios_bp.route('/mecanicos/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_mecanico(id):
    try:
        mecanico = Mecanico.query.get_or_404(id)
        
        # Verificar si tiene servicios asociados
        if mecanico.servicios:
            return jsonify({"error": "No se puede eliminar un mecánico con servicios asociados"}), 400
            
        db.session.delete(mecanico)
        db.session.commit()
        return jsonify({"mensaje": "Mecánico eliminado exitosamente"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Rutas para Servicios
@servicios_bp.route('/', methods=['GET'])
@jwt_required()
def get_servicios():
    try:
        # Obtener parámetros de filtrado
        estado = request.args.get('estado')
        tipo = request.args.get('tipo')
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        busqueda = request.args.get('q')
        
        # Construir query base
        query = Servicio.query
        
        # Aplicar filtros
        if estado:
            query = query.filter_by(estado=estado)
        if tipo:
            query = query.filter_by(tipo_servicio=tipo)
        if fecha_inicio:
            query = query.filter(Servicio.fecha_inicio >= datetime.fromisoformat(fecha_inicio))
        if fecha_fin:
            query = query.filter(Servicio.fecha_inicio <= datetime.fromisoformat(fecha_fin))
        if busqueda:
            query = query.filter(
                or_(
                    Servicio.vehiculo.placa.ilike(f'%{busqueda}%'),
                    Servicio.vehiculo.cliente.nombre.ilike(f'%{busqueda}%'),
                    Servicio.vehiculo.cliente.apellido.ilike(f'%{busqueda}%'),
                    Servicio.descripcion.ilike(f'%{busqueda}%')
                )
            )
        
        servicios = query.order_by(Servicio.fecha_inicio.desc()).all()
        
        return jsonify({
            'servicios': [{
                'id': servicio.id,
                'tipo_servicio': servicio.tipo_servicio,
                'descripcion': servicio.descripcion,
                'fecha_inicio': servicio.fecha_inicio.isoformat() if servicio.fecha_inicio else None,
                'fecha_fin': servicio.fecha_fin.isoformat() if servicio.fecha_fin else None,
                'estado': servicio.estado,
                'vehiculo_id': servicio.vehiculo_id,
                'mecanico_id': servicio.mecanico_id,
                'vehiculo': {
                    'id': servicio.vehiculo.id,
                    'placa': servicio.vehiculo.placa,
                    'marca': servicio.vehiculo.marca,
                    'modelo': servicio.vehiculo.modelo
                } if servicio.vehiculo else None,
                'mecanico': {
                    'id': servicio.mecanico.id,
                    'nombre': servicio.mecanico.nombre,
                    'apellido': servicio.mecanico.apellido
                } if servicio.mecanico else None
            } for servicio in servicios]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@servicios_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_servicio(id):
    try:
        servicio = Servicio.query.get_or_404(id)
        return jsonify({
            'id': servicio.id,
            'tipo_servicio': servicio.tipo_servicio,
            'descripcion': servicio.descripcion,
            'fecha_inicio': servicio.fecha_inicio.isoformat() if servicio.fecha_inicio else None,
            'fecha_fin': servicio.fecha_fin.isoformat() if servicio.fecha_fin else None,
            'estado': servicio.estado,
            'vehiculo_id': servicio.vehiculo_id,
            'mecanico_id': servicio.mecanico_id,
            'vehiculo': {
                'id': servicio.vehiculo.id,
                'placa': servicio.vehiculo.placa,
                'marca': servicio.vehiculo.marca,
                'modelo': servicio.vehiculo.modelo
            } if servicio.vehiculo else None,
            'mecanico': {
                'id': servicio.mecanico.id,
                'nombre': servicio.mecanico.nombre,
                'apellido': servicio.mecanico.apellido
            } if servicio.mecanico else None
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@servicios_bp.route('/', methods=['POST'])
@jwt_required()
def crear_servicio():
    try:
        data = request.get_json()
        usuario_id = get_jwt_identity()
        
        # Validar datos requeridos
        required_fields = ['tipo_servicio', 'vehiculo_id', 'descripcion']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo {field} es requerido'}), 400
        
        # Verificar que el vehículo existe
        vehiculo = Vehiculo.query.get_or_404(data['vehiculo_id'])
        
        # Verificar que el mecánico existe si se proporciona
        mecanico = None
        if 'mecanico_id' in data:
            mecanico = Mecanico.query.get_or_404(data['mecanico_id'])
        
        # Crear nuevo servicio
        nuevo_servicio = Servicio(
            tipo_servicio=data['tipo_servicio'],
            descripcion=data['descripcion'],
            fecha_inicio=datetime.now(),
            estado='pendiente',
            vehiculo_id=vehiculo.id,
            mecanico_id=mecanico.id if mecanico else None,
            usuario_id=usuario_id,
            prioridad=data.get('prioridad', 'normal'),
            notas=data.get('notas'),
            diagnostico=data.get('diagnostico'),
            recomendaciones=data.get('recomendaciones'),
            costo_estimado=data.get('costo_estimado'),
            costo_real=data.get('costo_real'),
            kilometraje_entrada=data.get('kilometraje_entrada'),
            kilometraje_salida=data.get('kilometraje_salida'),
            nivel_combustible_entrada=data.get('nivel_combustible_entrada'),
            nivel_combustible_salida=data.get('nivel_combustible_salida')
        )
        
        db.session.add(nuevo_servicio)
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Servicio creado exitosamente',
            'servicio': {
                'id': nuevo_servicio.id,
                'tipo': nuevo_servicio.tipo_servicio,
                'descripcion': nuevo_servicio.descripcion,
                'fecha_inicio': nuevo_servicio.fecha_inicio.isoformat(),
                'estado': nuevo_servicio.estado,
                'vehiculo': {
                    'id': vehiculo.id,
                    'placa': vehiculo.placa,
                    'cliente': f"{vehiculo.cliente.nombre} {vehiculo.cliente.apellido}"
                },
                'mecanico': f"{mecanico.nombre} {mecanico.apellido}" if mecanico else None
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@servicios_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def actualizar_servicio(id):
    try:
        servicio = Servicio.query.get_or_404(id)
        data = request.get_json()
        
        # Actualizar campos permitidos
        if 'tipo_servicio' in data:
            servicio.tipo_servicio = data['tipo_servicio']
        if 'descripcion' in data:
            servicio.descripcion = data['descripcion']
        if 'estado' in data:
            servicio.estado = data['estado']
            if data['estado'] == 'completado' and not servicio.fecha_fin:
                servicio.fecha_fin = datetime.now()
        if 'mecanico_id' in data:
            if data['mecanico_id']:
                mecanico = Mecanico.query.get_or_404(data['mecanico_id'])
                servicio.mecanico_id = mecanico.id
            else:
                servicio.mecanico_id = None
        
        # Actualizar campos adicionales
        if 'prioridad' in data:
            servicio.prioridad = data['prioridad']
        if 'notas' in data:
            servicio.notas = data['notas']
        if 'diagnostico' in data:
            servicio.diagnostico = data['diagnostico']
        if 'recomendaciones' in data:
            servicio.recomendaciones = data['recomendaciones']
        if 'costo_estimado' in data:
            servicio.costo_estimado = data['costo_estimado']
        if 'costo_real' in data:
            servicio.costo_real = data['costo_real']
        if 'kilometraje_entrada' in data:
            servicio.kilometraje_entrada = data['kilometraje_entrada']
        if 'kilometraje_salida' in data:
            servicio.kilometraje_salida = data['kilometraje_salida']
        if 'nivel_combustible_entrada' in data:
            servicio.nivel_combustible_entrada = data['nivel_combustible_entrada']
        if 'nivel_combustible_salida' in data:
            servicio.nivel_combustible_salida = data['nivel_combustible_salida']
        
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Servicio actualizado exitosamente',
            'servicio': {
                'id': servicio.id,
                'tipo': servicio.tipo_servicio,
                'descripcion': servicio.descripcion,
                'fecha_inicio': servicio.fecha_inicio.isoformat(),
                'fecha_fin': servicio.fecha_fin.isoformat() if servicio.fecha_fin else None,
                'estado': servicio.estado,
                'mecanico': f"{servicio.mecanico.nombre} {servicio.mecanico.apellido}" if servicio.mecanico else None
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@servicios_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_servicio(id):
    try:
        servicio = Servicio.query.get_or_404(id)
        db.session.delete(servicio)
        db.session.commit()
        return jsonify({'message': 'Servicio eliminado exitosamente'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Rutas para Horas de Trabajo
@servicios_bp.route('/<int:servicio_id>/horas', methods=['POST'])
@jwt_required()
def add_hora_trabajo(servicio_id):
    try:
        servicio = Servicio.query.get_or_404(servicio_id)
        data = request.get_json()
        
        nueva_hora = HoraTrabajo(
            fecha=datetime.now(timezone.utc),
            horas=data['horas'],
            descripcion=data['descripcion'],
            servicio_id=servicio_id,
            mecanico_id=servicio.mecanico_id
        )
        
        db.session.add(nueva_hora)
        db.session.commit()
        return jsonify({"mensaje": "Hora de trabajo registrada exitosamente", "id": nueva_hora.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@servicios_bp.route('/<int:servicio_id>/horas', methods=['GET'])
@jwt_required()
def get_horas_trabajo(servicio_id):
    try:
        horas = HoraTrabajo.query.filter_by(servicio_id=servicio_id).all()
        return jsonify([{
            'id': h.id,
            'fecha': h.fecha.isoformat(),
            'horas': h.horas,
            'descripcion': h.descripcion,
            'mecanico': {
                'id': h.mecanico.id,
                'nombre': h.mecanico.nombre
            } if h.mecanico else None
        } for h in horas]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Rutas para Repuestos
@servicios_bp.route('/<int:id>/repuestos', methods=['POST'])
@jwt_required()
def add_repuesto_servicio(id):
    try:
        servicio = Servicio.query.get_or_404(id)
        data = request.get_json()
        usuario_id = get_jwt_identity()
        
        # Validar datos requeridos
        required_fields = ['repuesto_id', 'cantidad']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'El campo {field} es requerido'}), 400
        
        # Verificar repuesto
        repuesto = Repuesto.query.get_or_404(data['repuesto_id'])
        
        # Verificar stock
        if repuesto.stock < data['cantidad']:
            return jsonify({'error': 'Stock insuficiente'}), 400
        
        # Agregar repuesto al servicio
        servicio.repuestos.append(repuesto)
        
        # Crear movimiento de inventario
        movimiento = MovimientoInventario(
            repuesto=repuesto,
            tipo='salida',
            cantidad=data['cantidad'],
            servicio=servicio,
            usuario=Usuario.query.get(usuario_id)
        )
        
        # Actualizar stock
        repuesto.stock -= data['cantidad']
        
        db.session.add(movimiento)
        db.session.commit()
        
        return jsonify({
            'message': 'Repuesto agregado exitosamente'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@servicios_bp.route('/<int:id>/repuestos/<int:repuesto_id>', methods=['DELETE'])
@jwt_required()
def remove_repuesto_servicio(id, repuesto_id):
    try:
        servicio = Servicio.query.get_or_404(id)
        repuesto = Repuesto.query.get_or_404(repuesto_id)
        
        # Verificar si el repuesto está en el servicio
        if repuesto not in servicio.repuestos:
            return jsonify({'error': 'El repuesto no está en el servicio'}), 400
        
        # Obtener la cantidad del movimiento
        movimiento = MovimientoInventario.query.filter_by(
            servicio_id=id,
            repuesto_id=repuesto_id
        ).first()
        
        if movimiento:
            # Devolver stock
            repuesto.stock += movimiento.cantidad
            # Eliminar movimiento
            db.session.delete(movimiento)
        
        # Eliminar relación
        servicio.repuestos.remove(repuesto)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Repuesto eliminado exitosamente'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Obtener servicios por estado
@servicios_bp.route('/estado/<string:estado>', methods=['GET'])
@jwt_required()
def get_servicios_por_estado(estado):
    try:
        servicios = Servicio.query.filter_by(estado=estado).all()
        return jsonify([{
            'id': s.id,
            'tipo_servicio': s.tipo_servicio,
            'descripcion': s.descripcion,
            'fecha_inicio': s.fecha_inicio.isoformat(),
            'fecha_fin': s.fecha_fin.isoformat() if s.fecha_fin else None,
            'vehiculo': {
                'id': s.vehiculo.id,
                'placa': s.vehiculo.placa,
                'cliente': f"{s.vehiculo.cliente.nombre} {s.vehiculo.cliente.apellido}"
            },
            'mecanico': f"{s.mecanico.nombre} {s.mecanico.apellido}" if s.mecanico else None
        } for s in servicios]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Obtener servicios por mecánico
@servicios_bp.route('/mecanico/<int:mecanico_id>', methods=['GET'])
@jwt_required()
def get_servicios_por_mecanico(mecanico_id):
    try:
        servicios = Servicio.query.filter_by(mecanico_id=mecanico_id).all()
        return jsonify([{
            'id': s.id,
            'tipo_servicio': s.tipo_servicio,
            'descripcion': s.descripcion,
            'fecha_inicio': s.fecha_inicio.isoformat(),
            'fecha_fin': s.fecha_fin.isoformat() if s.fecha_fin else None,
            'estado': s.estado,
            'vehiculo': {
                'id': s.vehiculo.id,
                'placa': s.vehiculo.placa,
                'cliente': f"{s.vehiculo.cliente.nombre} {s.vehiculo.cliente.apellido}"
            }
        } for s in servicios]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Obtener servicio por ID
@servicios_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def obtener_servicio(id):
    try:
        servicio = Servicio.query.get_or_404(id)
        
        return jsonify({
            'id': servicio.id,
            'tipo': servicio.tipo_servicio,
            'descripcion': servicio.descripcion,
            'fecha_inicio': servicio.fecha_inicio.isoformat(),
            'fecha_fin': servicio.fecha_fin.isoformat() if servicio.fecha_fin else None,
            'estado': servicio.estado,
            'vehiculo': {
                'id': servicio.vehiculo.id,
                'placa': servicio.vehiculo.placa,
                'marca': servicio.vehiculo.marca,
                'modelo': servicio.vehiculo.modelo,
                'cliente': {
                    'id': servicio.vehiculo.cliente.id,
                    'nombre': servicio.vehiculo.cliente.nombre,
                    'apellido': servicio.vehiculo.cliente.apellido,
                    'email': servicio.vehiculo.cliente.email,
                    'telefono': servicio.vehiculo.cliente.telefono
                }
            },
            'mecanico': {
                'id': servicio.mecanico.id,
                'nombre': servicio.mecanico.nombre,
                'apellido': servicio.mecanico.apellido,
                'especialidad': servicio.mecanico.especialidad,
                'tarifa_hora': servicio.mecanico.tarifa_hora
            } if servicio.mecanico else None,
            'repuestos': [{
                'id': r.id,
                'codigo': r.codigo,
                'nombre': r.nombre,
                'cantidad': next((m.cantidad for m in servicio.movimientos_inventario if m.repuesto_id == r.id), 0),
                'precio_compra': r.precio_compra,
                'precio_venta': r.precio_venta,
                'subtotal': next((m.cantidad * r.precio_venta for m in servicio.movimientos_inventario if m.repuesto_id == r.id), 0)
            } for r in servicio.repuestos],
            'factura': {
                'id': servicio.facturas[0].id,
                'numero': servicio.facturas[0].numero,
                'total': servicio.facturas[0].total,
                'estado': servicio.facturas[0].estado
            } if servicio.facturas else None
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Registrar horas de trabajo
@servicios_bp.route('/<int:id>/horas', methods=['POST'])
@jwt_required()
def registrar_horas(id):
    try:
        servicio = Servicio.query.get_or_404(id)
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['mecanico_id', 'horas', 'descripcion']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo {field} es requerido'}), 400
        
        # Verificar que el mecánico existe
        mecanico = Mecanico.query.get_or_404(data['mecanico_id'])
        
        # Validar horas
        if data['horas'] <= 0:
            return jsonify({'error': 'Las horas deben ser mayores a 0'}), 400
        
        # Registrar horas
        horas = HoraTrabajo(
            servicio_id=servicio.id,
            mecanico_id=mecanico.id,
            horas=data['horas'],
            descripcion=data['descripcion'],
            fecha=datetime.now()
        )
        
        db.session.add(horas)
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Horas registradas exitosamente',
            'horas': {
                'id': horas.id,
                'fecha': horas.fecha.isoformat(),
                'horas': horas.horas,
                'descripcion': horas.descripcion,
                'mecanico': f"{mecanico.nombre} {mecanico.apellido}",
                'tarifa': mecanico.tarifa_hora,
                'subtotal': horas.horas * mecanico.tarifa_hora
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Agregar repuesto a un servicio
@servicios_bp.route('/<int:servicio_id>/repuestos', methods=['POST'])
@jwt_required()
def agregar_repuesto_servicio(servicio_id):
    try:
        servicio = Servicio.query.get_or_404(servicio_id)
        data = request.get_json()
        
        # Validar datos requeridos
        if 'repuesto_id' not in data or 'cantidad' not in data:
            return jsonify({'error': 'repuesto_id y cantidad son requeridos'}), 400
        
        # Verificar que el repuesto existe
        repuesto = Repuesto.query.get_or_404(data['repuesto_id'])
        
        # Verificar stock disponible
        if repuesto.stock < data['cantidad']:
            return jsonify({'error': 'Stock insuficiente'}), 400
        
        # Crear movimiento de inventario
        movimiento = MovimientoInventario(
            repuesto_id=data['repuesto_id'],
            servicio_id=servicio_id,
            tipo_movimiento='salida',
            cantidad=data['cantidad'],
            precio_unitario=repuesto.precio_venta,
            razon=f'Servicio #{servicio_id}'
        )
        
        # Actualizar stock del repuesto
        repuesto.stock -= data['cantidad']
        
        # Agregar repuesto al servicio
        servicio.repuestos.append(repuesto)
        
        db.session.add(movimiento)
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Repuesto agregado al servicio exitosamente',
            'movimiento': {
                'id': movimiento.id,
                'repuesto': repuesto.nombre,
                'cantidad': movimiento.cantidad,
                'precio_total': movimiento.cantidad * movimiento.precio_unitario
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Quitar repuesto de un servicio
@servicios_bp.route('/<int:servicio_id>/repuestos/<int:repuesto_id>', methods=['DELETE'])
@jwt_required()
def quitar_repuesto_servicio(servicio_id, repuesto_id):
    try:
        servicio = Servicio.query.get_or_404(servicio_id)
        repuesto = Repuesto.query.get_or_404(repuesto_id)
        
        # Buscar el movimiento de inventario
        movimiento = MovimientoInventario.query.filter_by(
            servicio_id=servicio_id,
            repuesto_id=repuesto_id,
            tipo_movimiento='salida'
        ).first()
        
        if not movimiento:
            return jsonify({'error': 'No se encontró el movimiento de inventario'}), 404
        
        # Crear movimiento de devolución
        devolucion = MovimientoInventario(
            repuesto_id=repuesto_id,
            servicio_id=servicio_id,
            tipo_movimiento='entrada',
            cantidad=movimiento.cantidad,
            precio_unitario=movimiento.precio_unitario,
            razon=f'Devolución de servicio #{servicio_id}'
        )
        
        # Restaurar stock del repuesto
        repuesto.stock += movimiento.cantidad
        
        # Quitar repuesto del servicio
        servicio.repuestos.remove(repuesto)
        
        db.session.add(devolucion)
        db.session.delete(movimiento)
        db.session.commit()
        
        return jsonify({'mensaje': 'Repuesto quitado del servicio exitosamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Obtener repuestos de un servicio
@servicios_bp.route('/<int:servicio_id>/repuestos', methods=['GET'])
@jwt_required()
def get_repuestos_servicio(servicio_id):
    try:
        servicio = Servicio.query.get_or_404(servicio_id)
        
        repuestos_servicio = []
        for movimiento in servicio.movimientos_inventario:
            if movimiento.tipo_movimiento == 'salida':
                repuesto = movimiento.repuesto
                repuestos_servicio.append({
                    'id': repuesto.id,
                    'codigo': repuesto.codigo,
                    'nombre': repuesto.nombre,
                    'cantidad': movimiento.cantidad,
                    'precio_unitario': movimiento.precio_unitario,
                    'precio_total': movimiento.cantidad * movimiento.precio_unitario,
                    'categoria': repuesto.categoria
                })
        
        return jsonify({
            'servicio_id': servicio_id,
            'repuestos': repuestos_servicio,
            'costo_total_repuestos': sum(r['precio_total'] for r in repuestos_servicio)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Actualizar cantidad de repuesto en servicio
@servicios_bp.route('/<int:servicio_id>/repuestos/<int:repuesto_id>', methods=['PUT'])
@jwt_required()
def actualizar_repuesto_servicio(servicio_id, repuesto_id):
    try:
        servicio = Servicio.query.get_or_404(servicio_id)
        repuesto = Repuesto.query.get_or_404(repuesto_id)
        data = request.get_json()
        
        if 'cantidad' not in data:
            return jsonify({'error': 'cantidad es requerida'}), 400
        
        nueva_cantidad = data['cantidad']
        
        # Buscar el movimiento original
        movimiento_original = MovimientoInventario.query.filter_by(
            servicio_id=servicio_id,
            repuesto_id=repuesto_id,
            tipo_movimiento='salida'
        ).first()
        
        if not movimiento_original:
            return jsonify({'error': 'No se encontró el repuesto en este servicio'}), 404
        
        diferencia = nueva_cantidad - movimiento_original.cantidad
        
        # Verificar stock si necesitamos más repuestos
        if diferencia > 0 and repuesto.stock < diferencia:
            return jsonify({'error': 'Stock insuficiente'}), 400
        
        # Actualizar stock del repuesto
        repuesto.stock -= diferencia
        
        # Crear nuevo movimiento para el ajuste
        if diferencia != 0:
            tipo_mov = 'salida' if diferencia > 0 else 'entrada'
            cantidad_mov = abs(diferencia)
            
            ajuste = MovimientoInventario(
                repuesto_id=repuesto_id,
                servicio_id=servicio_id,
                tipo_movimiento=tipo_mov,
                cantidad=cantidad_mov,
                precio_unitario=movimiento_original.precio_unitario,
                razon=f'Ajuste en servicio #{servicio_id}'
            )
            db.session.add(ajuste)
        
        # Actualizar cantidad del movimiento original
        movimiento_original.cantidad = nueva_cantidad
        
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Cantidad actualizada exitosamente',
            'cantidad_anterior': movimiento_original.cantidad - diferencia,
            'cantidad_nueva': nueva_cantidad,
            'diferencia': diferencia
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Generar factura
@servicios_bp.route('/<int:id>/factura', methods=['POST'])
@jwt_required()
def generar_factura(id):
    try:
        servicio = Servicio.query.get_or_404(id)
        
        # Verificar que el servicio está completado
        if servicio.estado != 'completado':
            return jsonify({'error': 'El servicio debe estar completado'}), 400
        
        # Verificar que no tiene factura
        if servicio.facturas:
            return jsonify({'error': 'El servicio ya tiene una factura'}), 400
        
        # Calcular total
        total_repuestos = sum(
            m.cantidad * m.repuesto.precio_venta
            for m in servicio.movimientos_inventario
        )
        
        total_horas = sum(
            h.horas * h.mecanico.tarifa_hora
            for h in servicio.horas_trabajo
        )
        
        total = total_repuestos + total_horas
        
        # Crear factura
        factura = Factura(
            servicio_id=servicio.id,
            numero=f"F-{datetime.now().strftime('%Y%m%d')}-{servicio.id}",
            fecha=datetime.now(),
            total=total,
            estado='pendiente'
        )
        
        db.session.add(factura)
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Factura generada exitosamente',
            'factura': {
                'id': factura.id,
                'numero': factura.numero,
                'fecha': factura.fecha.isoformat(),
                'total': factura.total,
                'estado': factura.estado,
                'detalles': {
                    'repuestos': total_repuestos,
                    'horas_trabajo': total_horas
                }
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Asignar mecánico a un servicio
@servicios_bp.route('/<int:id>/asignar_mecanico', methods=['POST'])
@jwt_required()
def asignar_mecanico(id):
    try:
        servicio = Servicio.query.get_or_404(id)
        data = request.get_json()
        
        if 'mecanico_id' not in data:
            return jsonify({'error': 'mecanico_id es requerido'}), 400
            
        mecanico = Mecanico.query.get_or_404(data['mecanico_id'])
        servicio.mecanico_id = mecanico.id
        
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Mecánico asignado exitosamente',
            'servicio': {
                'id': servicio.id,
                'mecanico': f"{mecanico.nombre} {mecanico.apellido}"
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Cambiar estado del servicio
@servicios_bp.route('/<int:id>/cambiar_estado', methods=['POST'])
@jwt_required()
def cambiar_estado(id):
    try:
        servicio = Servicio.query.get_or_404(id)
        data = request.get_json()
        usuario_id = get_jwt_identity()
        
        if 'estado' not in data:
            return jsonify({'error': 'El campo estado es requerido'}), 400
            
        # Validar transición de estado
        estados_validos = {
            'pendiente': ['en_diagnostico', 'cancelado'],
            'en_diagnostico': ['en_reparacion', 'cancelado'],
            'en_reparacion': ['en_revision', 'cancelado'],
            'en_revision': ['completado', 'en_reparacion'],
            'completado': [],
            'cancelado': []
        }
        
        if servicio.estado not in estados_validos:
            return jsonify({'error': 'Estado actual inválido'}), 400
            
        if data['estado'] not in estados_validos[servicio.estado]:
            return jsonify({'error': 'Transición de estado no permitida'}), 400
        
        # Registrar cambio de estado
        servicio.registrar_cambio_estado(
            data['estado'],
            data.get('comentario', 'Cambio de estado')
        )
        
        # Actualizar fecha de fin si se completa
        if data['estado'] == 'completado':
            servicio.fecha_fin = datetime.now()
        
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Estado actualizado exitosamente',
            'servicio': {
                'id': servicio.id,
                'estado': servicio.estado,
                'fecha_fin': servicio.fecha_fin.isoformat() if servicio.fecha_fin else None
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Obtener historial de estados
@servicios_bp.route('/<int:id>/historial', methods=['GET'])
@jwt_required()
def obtener_historial(id):
    try:
        servicio = Servicio.query.get_or_404(id)
        
        return jsonify({
            'servicio_id': servicio.id,
            'estado_actual': servicio.estado,
            'historial': [{
                'id': h.id,
                'estado_anterior': h.estado_anterior,
                'estado_nuevo': h.estado_nuevo,
                'comentario': h.comentario,
                'fecha': h.fecha.isoformat(),
                'usuario': h.usuario.nombre if h.usuario else None
            } for h in servicio.historial_estados.order_by(HistorialEstado.fecha.desc())]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Obtener estados disponibles
@servicios_bp.route('/estados', methods=['GET'])
@jwt_required()
def obtener_estados():
    try:
        estados = {
            'pendiente': {
                'nombre': 'Pendiente',
                'descripcion': 'Servicio creado y pendiente de iniciar',
                'siguientes': ['en_diagnostico', 'cancelado']
            },
            'en_diagnostico': {
                'nombre': 'En Diagnóstico',
                'descripcion': 'El vehículo está siendo diagnosticado',
                'siguientes': ['en_reparacion', 'cancelado']
            },
            'en_reparacion': {
                'nombre': 'En Reparación',
                'descripcion': 'El vehículo está siendo reparado',
                'siguientes': ['en_revision', 'cancelado']
            },
            'en_revision': {
                'nombre': 'En Revisión',
                'descripcion': 'El vehículo está siendo revisado después de la reparación',
                'siguientes': ['completado', 'en_reparacion']
            },
            'completado': {
                'nombre': 'Completado',
                'descripcion': 'El servicio ha sido completado',
                'siguientes': []
            },
            'cancelado': {
                'nombre': 'Cancelado',
                'descripcion': 'El servicio ha sido cancelado',
                'siguientes': []
            }
        }
        
        return jsonify(estados), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500 
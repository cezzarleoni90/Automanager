from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Servicio, Mecanico, Vehiculo, HoraTrabajo, Repuesto, MovimientoInventario, Usuario, Factura, HistorialEstado, Cliente
from datetime import datetime, timezone, timedelta
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
                'fecha_inicio': s.fecha_inicio.isoformat() if s.fecha_inicio else None,
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
            'apellido': mecanico.apellido,
            'especialidad': mecanico.especialidad,
            'telefono': mecanico.telefono,
            'email': mecanico.email,
            'activo': mecanico.estado == 'activo',
            'servicios': [{
                'id': s.id,
                'descripcion': s.descripcion,
                'fecha_inicio': s.fecha_inicio.isoformat() if s.fecha_inicio else None,
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
                'fecha': h.fecha.isoformat() if h.fecha else None,
                'horas_trabajadas': h.horas_trabajadas,
                'descripcion': h.notas
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
        # Filtros opcionales
        estado = request.args.get('estado')
        cliente_id = request.args.get('cliente_id')
        mecanico_id = request.args.get('mecanico_id')
        vehiculo_id = request.args.get('vehiculo_id')
        fecha_desde = request.args.get('fecha_desde')
        fecha_hasta = request.args.get('fecha_hasta')
        
        # Construir query base
        query = Servicio.query
        
        # Aplicar filtros
        if estado:
            query = query.filter(Servicio.estado == estado)
        if cliente_id:
            query = query.filter(Servicio.cliente_id == cliente_id)
        if mecanico_id:
            query = query.filter(Servicio.mecanico_id == mecanico_id)
        if vehiculo_id:
            query = query.filter(Servicio.vehiculo_id == vehiculo_id)
        if fecha_desde:
            query = query.filter(Servicio.fecha_inicio >= datetime.fromisoformat(fecha_desde))
        if fecha_hasta:
            query = query.filter(Servicio.fecha_inicio <= datetime.fromisoformat(fecha_hasta))
        
        # Ordenar por fecha más reciente
        servicios = query.order_by(Servicio.fecha_inicio.desc()).all()
        
        return jsonify({
            'servicios': [{
                'id': s.id,
                'tipo_servicio': s.tipo_servicio,
                'descripcion': s.descripcion,
                'estado': s.estado,
                'prioridad': s.prioridad,
                'fecha_inicio': s.fecha_inicio.isoformat(),
                'fecha_fin': s.fecha_fin.isoformat() if s.fecha_fin else None,
                'fecha_estimada_fin': s.fecha_estimada_fin.isoformat() if s.fecha_estimada_fin else None,
                'costo_estimado': s.costo_estimado,
                'costo_real': s.costo_real,
                'cliente': {
                    'id': s.cliente.id,
                    'nombre': f"{s.cliente.nombre} {s.cliente.apellido}",
                    'email': s.cliente.email
                } if s.cliente else None,
                'vehiculo': {
                    'id': s.vehiculo.id,
                    'placa': s.vehiculo.placa,
                    'marca': s.vehiculo.marca,
                    'modelo': s.vehiculo.modelo,
                    'año': s.vehiculo.año
                } if s.vehiculo else None,
                'mecanico': {
                    'id': s.mecanico.id,
                    'nombre': f"{s.mecanico.nombre} {s.mecanico.apellido}",
                    'especialidad': s.mecanico.especialidad
                } if s.mecanico else None,
                'total_horas': sum(h.horas_trabajadas for h in s.horas_trabajo.all()),
                'total_repuestos': len(s.repuestos),
                'notas': s.notas
            } for s in servicios]
        }), 200
        
    except Exception as e:
        print(f"Error en get_servicios: {str(e)}")
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
            'vehiculo': {
                'id': servicio.vehiculo.id,
                'placa': servicio.vehiculo.placa,
                'marca': servicio.vehiculo.marca,
                'modelo': servicio.vehiculo.modelo,
                'año': servicio.vehiculo.año,
                'color': servicio.vehiculo.color,
                'vin': servicio.vehiculo.vin
            } if servicio.vehiculo else None,
            'mecanico': {
                'id': servicio.mecanico.id,
                'nombre': f"{servicio.mecanico.nombre} {servicio.mecanico.apellido}",
                'especialidad': servicio.mecanico.especialidad,
                'tarifa_hora': getattr(servicio.mecanico, 'tarifa_hora', 0)
            } if servicio.mecanico else None,
            'repuestos': [{
                'id': r.id,
                'codigo': r.codigo,
                'nombre': r.nombre,
                'cantidad': next((mov.cantidad for mov in servicio.movimientos_inventario.all() 
                                if mov.repuesto_id == r.id), 0),
                'precio_unitario': r.precio_venta,
                'subtotal': next((mov.cantidad * r.precio_venta for mov in servicio.movimientos_inventario.all() 
                                if mov.repuesto_id == r.id), 0)
            } for r in servicio.repuestos],
            'horas_trabajo': [{
                'id': h.id,
                'fecha': h.fecha.isoformat() if h.fecha else None,
                'horas_trabajadas': h.horas_trabajadas,
                'tipo_trabajo': h.tipo_trabajo,
                'notas': h.notas,
                'costo': h.horas_trabajadas * (servicio.mecanico.tarifa_hora if servicio.mecanico else 0)
            } for h in servicio.horas_trabajo.all()],
            'cliente': {
                'id': servicio.vehiculo.cliente.id,
                'nombre': servicio.vehiculo.cliente.nombre,
                'apellido': servicio.vehiculo.cliente.apellido,
                'telefono': servicio.vehiculo.cliente.telefono,
                'email': servicio.vehiculo.cliente.email
            } if servicio.vehiculo and servicio.vehiculo.cliente else None
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@servicios_bp.route('/', methods=['POST'])
@jwt_required()
def create_servicio():
    try:
        data = request.get_json()
        
        # Validar campos requeridos
        required_fields = ['tipo_servicio', 'descripcion', 'vehiculo_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo {field} es requerido'}), 400
        
        # Verificar que el vehículo existe
        vehiculo = Vehiculo.query.get_or_404(data['vehiculo_id'])
        
        # Verificar cliente (opcional, si no se proporciona tomar del vehículo)
        cliente_id = data.get('cliente_id') or vehiculo.cliente_id
        cliente = Cliente.query.get_or_404(cliente_id)
        
        # Verificar mecánico (opcional)
        mecanico = None
        if data.get('mecanico_id'):
            mecanico = Mecanico.query.get_or_404(data['mecanico_id'])
        
        # Obtener usuario actual
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get_or_404(usuario_id)
        
        # Crear servicio sin inicializar automáticamente el estado
        servicio = Servicio(
            inicializar_estado=False,  # No inicializar el estado automáticamente
            tipo_servicio=data['tipo_servicio'],
            descripcion=data['descripcion'],
            vehiculo_id=vehiculo.id,
            cliente_id=cliente.id,
            mecanico_id=mecanico.id if mecanico else None,
            usuario_id=usuario.id,
            prioridad=data.get('prioridad', 'normal'),
            fecha_inicio=datetime.utcnow(),
            fecha_estimada_fin=datetime.fromisoformat(data['fecha_estimada_fin']) 
                              if data.get('fecha_estimada_fin') else None,
            costo_estimado=data.get('costo_estimado', 0),
            kilometraje_entrada=data.get('kilometraje_entrada'),
            nivel_combustible_entrada=data.get('nivel_combustible_entrada'),
            diagnostico=data.get('diagnostico', ''),
            notas=data.get('notas', ''),
            estado='pendiente'
        )
        
        # Primero guardar el servicio para obtener un ID
        db.session.add(servicio)
        db.session.commit()
        
        # Ahora crear el historial de estado manualmente
        historial = HistorialEstado(
            servicio_id=servicio.id,
            estado_anterior='pendiente',
            estado_nuevo='pendiente',
            comentario='Servicio creado',
            fecha=datetime.utcnow(),
            usuario_id=usuario_id
        )
        db.session.add(historial)
        
        # Actualizar último servicio del vehículo
        vehiculo.ultimo_servicio = datetime.utcnow()
        if servicio.kilometraje_entrada:
            vehiculo.kilometraje = servicio.kilometraje_entrada
        
        # Actualizar última visita del cliente
        cliente.ultima_visita = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Servicio creado exitosamente',
            'servicio': {
                'id': servicio.id,
                'tipo_servicio': servicio.tipo_servicio,
                'estado': servicio.estado,
                'fecha_inicio': servicio.fecha_inicio.isoformat()
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en create_servicio: {str(e)}")
        return jsonify({'error': str(e)}), 500

@servicios_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_servicio(id):
    try:
        servicio = Servicio.query.get_or_404(id)
        data = request.get_json()
        usuario_id = get_jwt_identity()
        
        # Campos que se pueden actualizar
        updateable_fields = [
            'tipo_servicio', 'descripcion', 'prioridad', 'fecha_estimada_fin',
            'costo_estimado', 'diagnostico', 'recomendaciones', 'notas',
            'kilometraje_entrada', 'kilometraje_salida',
            'nivel_combustible_entrada', 'nivel_combustible_salida',
            'estado'  # Agregar estado a los campos actualizables
        ]
        
        # Guardar el estado anterior antes de actualizarlo
        estado_anterior = servicio.estado
        
        for field in updateable_fields:
            if field in data:
                if field in ['fecha_estimada_fin'] and data[field]:
                    setattr(servicio, field, datetime.fromisoformat(data[field]))
                else:
                    setattr(servicio, field, data[field])
        
        # Si se cambió el estado, registrar en el historial
        if 'estado' in data and data['estado'] != estado_anterior:
            print(f"Detectado cambio de estado en update_servicio: {estado_anterior} -> {data['estado']}")
            
            # Crear registro en historial de estados
            historial = HistorialEstado(
                servicio_id=servicio.id,
                estado_anterior=estado_anterior,
                estado_nuevo=data['estado'],
                comentario=data.get('comentario', f'Estado cambiado a {data["estado"]} desde formulario de edición'),
                fecha=datetime.utcnow(),
                usuario_id=usuario_id
            )
            db.session.add(historial)
            
            # Actualizar fechas según el estado
            if data['estado'] == 'completado' and not servicio.fecha_fin:
                servicio.fecha_fin = datetime.utcnow()
            elif estado_anterior == 'completado' and data['estado'] != 'completado':
                servicio.fecha_fin = None
        
        # Actualizar mecánico si se proporciona
        if 'mecanico_id' in data:
            if data['mecanico_id']:
                mecanico = Mecanico.query.get_or_404(data['mecanico_id'])
                servicio.mecanico_id = mecanico.id
            else:
                servicio.mecanico_id = None
        
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Servicio actualizado exitosamente',
            'servicio': {
                'id': servicio.id,
                'tipo_servicio': servicio.tipo_servicio,
                'estado': servicio.estado
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en update_servicio: {str(e)}")
        return jsonify({'error': str(e)}), 500

@servicios_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_servicio(id):
    try:
        servicio = Servicio.query.get_or_404(id)
        
        # Primero eliminar registros relacionados para evitar errores de integridad
        # Eliminar historial de estados
        if servicio.historial_estados:
            for historial in servicio.historial_estados.all():
                db.session.delete(historial)
        
        # Eliminar relación con repuestos
        if servicio.repuestos:
            for repuesto in servicio.repuestos:
                servicio.repuestos.remove(repuesto)
        
        # Eliminar movimientos de inventario
        if servicio.movimientos_inventario:
            for movimiento in servicio.movimientos_inventario.all():
                db.session.delete(movimiento)
        
        # Eliminar horas de trabajo
        if servicio.horas_trabajo:
            for hora in servicio.horas_trabajo.all():
                db.session.delete(hora)
        
        # Eliminar eventos
        if servicio.eventos:
            for evento in servicio.eventos:
                db.session.delete(evento)
        
        # Eliminar facturas
        if servicio.facturas:
            for factura in servicio.facturas.all():
                db.session.delete(factura)
        
        # Hacer commit parcial para asegurar que se eliminen las relaciones
        db.session.flush()
        
        # Ahora sí eliminar el servicio
        db.session.delete(servicio)
        db.session.commit()
        
        return jsonify({'message': 'Servicio eliminado exitosamente'})
    except Exception as e:
        db.session.rollback()
        # Añadir mensaje más detallado para depuración
        print(f"Error al eliminar servicio {id}: {str(e)}")
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
            horas_trabajadas=data['horas'],
            tipo_trabajo=data.get('tipo_trabajo', 'general'),
            notas=data['descripcion'],
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
        fecha = datetime.now()
        if 'fecha' in data and data['fecha']:
            try:
                fecha = datetime.fromisoformat(data['fecha'].replace('Z', '+00:00'))
            except ValueError:
                # Si hay error, usar la fecha actual
                pass

        horas = HoraTrabajo(
            servicio_id=servicio.id,
            mecanico_id=mecanico.id,
            horas_trabajadas=data['horas'],
            notas=data['descripcion'],
            fecha=fecha,
            tipo_trabajo=data.get('tipo_trabajo', 'general')
        )
        
        db.session.add(horas)
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Horas registradas exitosamente',
            'horas': {
                'id': horas.id,
                'fecha': horas.fecha.isoformat(),
                'horas_trabajadas': horas.horas_trabajadas,
                'notas': horas.notas,
                'mecanico': f"{mecanico.nombre} {mecanico.apellido}",
                'tarifa': mecanico.tarifa_hora,
                'subtotal': horas.horas_trabajadas * mecanico.tarifa_hora
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
            tipo='salida',
            cantidad=data['cantidad'],
            notas=f'Servicio #{servicio_id}',
            fecha=datetime.utcnow()
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
                'precio_total': movimiento.cantidad * repuesto.precio_venta
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
            
        nuevo_estado = data['estado']
        comentario = data.get('comentario', 'Cambio de estado')
        
        # Validar que el nuevo estado sea válido
        if nuevo_estado not in Servicio.ESTADOS:
            return jsonify({'error': f'Estado "{nuevo_estado}" no válido. Estados disponibles: {list(Servicio.ESTADOS.keys())}'}), 400
        
        # Validar la transición de estado
        estados_validos = {
            'pendiente': ['diagnostico', 'en_progreso', 'cancelado'],  # Permitir transición directa a en_progreso
            'diagnostico': ['en_progreso', 'pendiente', 'completado', 'cancelado'],  # Más flexibilidad
            'en_progreso': ['pausado', 'completado', 'cancelado', 'diagnostico'],  # Permitir volver a diagnóstico
            'pausado': ['en_progreso', 'completado', 'cancelado'],  # Permitir completar directo
            'completado': ['en_progreso', 'diagnostico'],  # Permitir reabrir
            'cancelado': ['pendiente']  # Permitir reactivar
        }
        
        if nuevo_estado not in estados_validos.get(servicio.estado, []):
            return jsonify({
                'error': f'No se permite cambiar de "{servicio.estado}" a "{nuevo_estado}".',
                'transiciones_permitidas': estados_validos.get(servicio.estado, [])
            }), 400
        
        print(f"Cambiando estado del servicio {id} de '{servicio.estado}' a '{nuevo_estado}'")
        
        # Guardar el estado anterior para el historial
        estado_anterior = servicio.estado
        fecha_cambio = datetime.utcnow()
        
        # Crear manualmente el historial de estado
        historial = HistorialEstado(
            servicio_id=servicio.id,
            estado_anterior=estado_anterior,
            estado_nuevo=nuevo_estado,
            comentario=comentario,
            fecha=fecha_cambio,
            usuario_id=usuario_id
        )
        
        # Actualizar el estado del servicio
        servicio.estado = nuevo_estado
        
        # Actualizar fechas según el estado
        if nuevo_estado == 'completado':
            servicio.fecha_fin = fecha_cambio
        # Si se reactiva un servicio completado, eliminar fecha_fin
        elif estado_anterior == 'completado' and nuevo_estado != 'completado':
            servicio.fecha_fin = None
        
        # Añadir el historial y confirmar cambios
        db.session.add(historial)
        
        # Asegurarse de que se haga commit y manejar errores específicamente
        try:
            db.session.commit()
            print(f"✅ Estado del servicio {id} actualizado correctamente a '{nuevo_estado}'")
        except Exception as commit_error:
            db.session.rollback()
            print(f"❌ Error al hacer commit: {str(commit_error)}")
            return jsonify({'error': f'Error al guardar los cambios: {str(commit_error)}'}), 500
        
        # Devolver respuesta con datos completos
        return jsonify({
            'mensaje': 'Estado actualizado exitosamente',
            'servicio': {
                'id': servicio.id,
                'tipo_servicio': servicio.tipo_servicio,
                'descripcion': servicio.descripcion,
                'estado_anterior': estado_anterior,
                'estado_nuevo': servicio.estado,
                'fecha_actualizacion': fecha_cambio.isoformat(),
                'fecha_fin': servicio.fecha_fin.isoformat() if servicio.fecha_fin else None,
                'historial_reciente': {
                    'id': historial.id,
                    'estado_anterior': historial.estado_anterior,
                    'estado_nuevo': historial.estado_nuevo,
                    'comentario': historial.comentario,
                    'fecha': historial.fecha.isoformat()
                }
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error al cambiar estado: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Obtener historial de estados
@servicios_bp.route('/<int:id>/historial', methods=['GET'])
@jwt_required()
def obtener_historial(id):
    try:
        servicio = Servicio.query.get_or_404(id)
        
        historial_items = servicio.historial_estados.order_by(HistorialEstado.fecha.desc()).all()
        
        historial_formateado = []
        for h in historial_items:
            # Obtener información del usuario que hizo el cambio
            usuario_nombre = None
            if h.usuario_id:
                usuario = Usuario.query.get(h.usuario_id)
                if usuario:
                    usuario_nombre = f"{usuario.nombre} {usuario.apellido}" if usuario.apellido else usuario.nombre
            
            historial_formateado.append({
                'id': h.id,
                'estado_anterior': h.estado_anterior,
                'estado_nuevo': h.estado_nuevo,
                'comentario': h.comentario,
                'fecha': h.fecha.isoformat(),
                'usuario': usuario_nombre,
                'usuario_id': h.usuario_id
            })
        
        return jsonify({
            'servicio_id': servicio.id,
            'estado_actual': servicio.estado,
            'historial': historial_formateado
        }), 200
    except Exception as e:
        print(f"❌ Error al obtener historial: {str(e)}")
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

# Obtener estadísticas de servicios
@servicios_bp.route('/estadisticas', methods=['GET'])
@jwt_required()
def get_estadisticas_servicios():
    try:
        # Servicios por estado
        servicios_por_estado = {}
        for estado in Servicio.ESTADOS.keys():
            count = Servicio.query.filter_by(estado=estado).count()
            servicios_por_estado[estado] = count
        
        # Servicios del mes actual
        inicio_mes = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        servicios_mes = Servicio.query.filter(Servicio.fecha_inicio >= inicio_mes).count()
        
        # Ingresos del mes (solo servicios completados)
        ingresos_mes = db.session.query(db.func.sum(Servicio.costo_real)).filter(
            Servicio.estado == 'completado',
            Servicio.fecha_fin >= inicio_mes
        ).scalar() or 0
        
        # Top 5 mecánicos por servicios completados
        top_mecanicos = db.session.query(
            Mecanico,
            db.func.count(Servicio.id).label('servicios_completados')
        ).join(Servicio).filter(
            Servicio.estado == 'completado'
        ).group_by(Mecanico.id).order_by(
            db.func.count(Servicio.id).desc()
        ).limit(5).all()
        
        return jsonify({
            'servicios_por_estado': servicios_por_estado,
            'servicios_mes': servicios_mes,
            'ingresos_mes': ingresos_mes,
            'top_mecanicos': [{
                'id': mecanico.id,
                'nombre': f"{mecanico.nombre} {mecanico.apellido}",
                'servicios_completados': count
            } for mecanico, count in top_mecanicos]
        }), 200
        
    except Exception as e:
        print(f"Error en get_estadisticas_servicios: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Buscar servicios
@servicios_bp.route('/buscar', methods=['GET'])
@jwt_required()
def buscar_servicios():
    try:
        query_text = request.args.get('q', '').strip()
        
        if not query_text:
            return jsonify({'servicios': []}), 200
        
        # Buscar en múltiples campos
        servicios = Servicio.query.join(Cliente).join(Vehiculo).filter(
            or_(
                Servicio.tipo_servicio.ilike(f'%{query_text}%'),
                Servicio.descripcion.ilike(f'%{query_text}%'),
                Cliente.nombre.ilike(f'%{query_text}%'),
                Cliente.apellido.ilike(f'%{query_text}%'),
                Vehiculo.placa.ilike(f'%{query_text}%'),
                Vehiculo.marca.ilike(f'%{query_text}%'),
                Vehiculo.modelo.ilike(f'%{query_text}%')
            )
        ).order_by(Servicio.fecha_inicio.desc()).limit(20).all()
        
        return jsonify({
            'servicios': [{
                'id': s.id,
                'tipo_servicio': s.tipo_servicio,
                'estado': s.estado,
                'fecha_inicio': s.fecha_inicio.isoformat(),
                'cliente': f"{s.cliente.nombre} {s.cliente.apellido}",
                'vehiculo': f"{s.vehiculo.marca} {s.vehiculo.modelo} - {s.vehiculo.placa}"
            } for s in servicios]
        }), 200
        
    except Exception as e:
        print(f"Error en buscar_servicios: {str(e)}")
        return jsonify({'error': str(e)}), 500 
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Servicio, Mecanico, Vehiculo, HoraTrabajo, Repuesto, MovimientoInventario, Usuario, Factura
from datetime import datetime, timezone
from sqlalchemy import or_

servicios_bp = Blueprint('servicios', __name__)

# Rutas para Mecánicos
@servicios_bp.route('/api/mecanicos', methods=['GET'])
@jwt_required()
def get_mecanicos():
    try:
        mecanicos = Mecanico.query.all()
        return jsonify([{
            'id': m.id,
            'nombre': m.nombre,
            'especialidad': m.especialidad,
            'telefono': m.telefono,
            'email': m.email,
            'activo': m.activo,
            'servicios': [{
                'id': s.id,
                'descripcion': s.descripcion,
                'fecha': s.fecha.isoformat(),
                'estado': s.estado
            } for s in m.servicios]
        } for m in mecanicos]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@servicios_bp.route('/api/mecanicos/<int:id>', methods=['GET'])
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
            'activo': mecanico.activo,
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

@servicios_bp.route('/api/mecanicos', methods=['POST'])
@jwt_required()
def create_mecanico():
    try:
        data = request.get_json()
        nuevo_mecanico = Mecanico(
            nombre=data['nombre'],
            especialidad=data['especialidad'],
            telefono=data['telefono'],
            email=data['email'],
            activo=True
        )
        db.session.add(nuevo_mecanico)
        db.session.commit()
        return jsonify({"mensaje": "Mecánico creado exitosamente", "id": nuevo_mecanico.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@servicios_bp.route('/api/mecanicos/<int:id>', methods=['PUT'])
@jwt_required()
def update_mecanico(id):
    try:
        mecanico = Mecanico.query.get_or_404(id)
        data = request.get_json()
        
        mecanico.nombre = data.get('nombre', mecanico.nombre)
        mecanico.especialidad = data.get('especialidad', mecanico.especialidad)
        mecanico.telefono = data.get('telefono', mecanico.telefono)
        mecanico.email = data.get('email', mecanico.email)
        mecanico.activo = data.get('activo', mecanico.activo)
        
        db.session.commit()
        return jsonify({"mensaje": "Mecánico actualizado exitosamente"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@servicios_bp.route('/api/mecanicos/<int:id>', methods=['DELETE'])
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
def get_servicios():
    try:
        servicios = Servicio.query.all()
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
def create_servicio():
    try:
        data = request.get_json()
        
        # Convertir fechas de string a datetime
        fecha_inicio = datetime.fromisoformat(data['fecha_inicio']) if data.get('fecha_inicio') else None
        fecha_fin = datetime.fromisoformat(data['fecha_fin']) if data.get('fecha_fin') else None
        
        servicio = Servicio(
            tipo_servicio=data['tipo_servicio'],
            descripcion=data['descripcion'],
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            estado=data['estado'],
            vehiculo_id=data['vehiculo_id'],
            mecanico_id=data.get('mecanico_id')
        )
        
        db.session.add(servicio)
        db.session.commit()
        
        return jsonify({
            'message': 'Servicio creado exitosamente',
            'servicio': {
                'id': servicio.id,
                'tipo_servicio': servicio.tipo_servicio,
                'descripcion': servicio.descripcion,
                'fecha_inicio': servicio.fecha_inicio.isoformat() if servicio.fecha_inicio else None,
                'fecha_fin': servicio.fecha_fin.isoformat() if servicio.fecha_fin else None,
                'estado': servicio.estado,
                'vehiculo_id': servicio.vehiculo_id,
                'mecanico_id': servicio.mecanico_id
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@servicios_bp.route('/<int:id>', methods=['PUT'])
def update_servicio(id):
    try:
        servicio = Servicio.query.get_or_404(id)
        data = request.get_json()
        
        # Convertir fechas de string a datetime
        if 'fecha_inicio' in data:
            servicio.fecha_inicio = datetime.fromisoformat(data['fecha_inicio']) if data['fecha_inicio'] else None
        if 'fecha_fin' in data:
            servicio.fecha_fin = datetime.fromisoformat(data['fecha_fin']) if data['fecha_fin'] else None
        
        servicio.tipo_servicio = data.get('tipo_servicio', servicio.tipo_servicio)
        servicio.descripcion = data.get('descripcion', servicio.descripcion)
        servicio.estado = data.get('estado', servicio.estado)
        servicio.vehiculo_id = data.get('vehiculo_id', servicio.vehiculo_id)
        servicio.mecanico_id = data.get('mecanico_id', servicio.mecanico_id)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Servicio actualizado exitosamente',
            'servicio': {
                'id': servicio.id,
                'tipo_servicio': servicio.tipo_servicio,
                'descripcion': servicio.descripcion,
                'fecha_inicio': servicio.fecha_inicio.isoformat() if servicio.fecha_inicio else None,
                'fecha_fin': servicio.fecha_fin.isoformat() if servicio.fecha_fin else None,
                'estado': servicio.estado,
                'vehiculo_id': servicio.vehiculo_id,
                'mecanico_id': servicio.mecanico_id
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@servicios_bp.route('/<int:id>', methods=['DELETE'])
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
@servicios_bp.route('/api/servicios/<int:servicio_id>/horas', methods=['POST'])
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

@servicios_bp.route('/api/servicios/<int:servicio_id>/horas', methods=['GET'])
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
@servicios_bp.route('/api/servicios/<int:id>/repuestos', methods=['POST'])
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

@servicios_bp.route('/api/servicios/<int:id>/repuestos/<int:repuesto_id>', methods=['DELETE'])
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
@servicios_bp.route('/api/servicios/estado/<string:estado>', methods=['GET'])
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
@servicios_bp.route('/api/servicios/mecanico/<int:mecanico_id>', methods=['GET'])
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

# Obtener lista de servicios
@servicios_bp.route('/api/servicios', methods=['GET'])
@jwt_required()
def listar_servicios():
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
                'mecanico': f"{s.mecanico.nombre} {s.mecanico.apellido}" if s.mecanico else None,
                'horas_trabajo': sum(h.horas for h in s.horas_trabajo),
                'repuestos': len(s.repuestos),
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

# Obtener servicio por ID
@servicios_bp.route('/api/servicios/<int:id>', methods=['GET'])
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
                'precio': r.precio,
                'subtotal': next((m.cantidad * r.precio for m in servicio.movimientos_inventario if m.repuesto_id == r.id), 0)
            } for r in servicio.repuestos],
            'horas_trabajo': [{
                'id': h.id,
                'fecha': h.fecha.isoformat(),
                'horas': h.horas,
                'descripcion': h.descripcion,
                'mecanico': f"{h.mecanico.nombre} {h.mecanico.apellido}",
                'tarifa': h.mecanico.tarifa_hora,
                'subtotal': h.horas * h.mecanico.tarifa_hora
            } for h in servicio.horas_trabajo],
            'facturas': [{
                'id': f.id,
                'numero': f.numero,
                'fecha': f.fecha.isoformat(),
                'total': f.total,
                'estado': f.estado
            } for f in servicio.facturas],
            'totales': {
                'repuestos': sum(
                    m.cantidad * m.repuesto.precio
                    for m in servicio.movimientos_inventario
                ),
                'horas_trabajo': sum(
                    h.horas * h.mecanico.tarifa_hora
                    for h in servicio.horas_trabajo
                )
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Crear nuevo servicio
@servicios_bp.route('/api/servicios', methods=['POST'])
@jwt_required()
def crear_servicio():
    try:
        data = request.get_json()
        
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
            mecanico_id=mecanico.id if mecanico else None
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

# Actualizar servicio
@servicios_bp.route('/api/servicios/<int:id>', methods=['PUT'])
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

# Registrar horas de trabajo
@servicios_bp.route('/api/servicios/<int:id>/horas', methods=['POST'])
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

# Agregar repuesto al servicio
@servicios_bp.route('/api/servicios/<int:id>/repuestos', methods=['POST'])
@jwt_required()
def agregar_repuesto(id):
    try:
        servicio = Servicio.query.get_or_404(id)
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['repuesto_id', 'cantidad']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo {field} es requerido'}), 400
        
        # Verificar que el repuesto existe
        repuesto = Repuesto.query.get_or_404(data['repuesto_id'])
        
        # Validar cantidad
        if data['cantidad'] <= 0:
            return jsonify({'error': 'La cantidad debe ser mayor a 0'}), 400
        
        # Validar stock suficiente
        if data['cantidad'] > repuesto.stock:
            return jsonify({'error': 'Stock insuficiente'}), 400
        
        # Registrar movimiento de inventario
        stock_anterior = repuesto.stock
        stock_nuevo = stock_anterior - data['cantidad']
        
        movimiento = MovimientoInventario(
            repuesto_id=repuesto.id,
            servicio_id=servicio.id,
            tipo='salida',
            cantidad=data['cantidad'],
            stock_anterior=stock_anterior,
            stock_nuevo=stock_nuevo,
            fecha=datetime.now()
        )
        
        # Actualizar stock
        repuesto.stock = stock_nuevo
        
        # Agregar repuesto al servicio si no existe
        if repuesto not in servicio.repuestos:
            servicio.repuestos.append(repuesto)
        
        db.session.add(movimiento)
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Repuesto agregado exitosamente',
            'repuesto': {
                'id': repuesto.id,
                'codigo': repuesto.codigo,
                'nombre': repuesto.nombre,
                'cantidad': data['cantidad'],
                'precio': repuesto.precio,
                'subtotal': data['cantidad'] * repuesto.precio
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Generar factura
@servicios_bp.route('/api/servicios/<int:id>/factura', methods=['POST'])
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
            m.cantidad * m.repuesto.precio
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
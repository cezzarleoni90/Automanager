from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import Vehiculo, Servicio, HistorialMantenimiento, Cliente, Notificacion
from backend.extensions import db
from datetime import datetime, timezone, timedelta

mantenimiento_bp = Blueprint('mantenimiento', __name__)

# Rutas para Historial de Mantenimiento
@mantenimiento_bp.route('/api/vehiculos/<int:vehiculo_id>/historial', methods=['GET'])
@jwt_required()
def get_historial_vehiculo(vehiculo_id):
    try:
        vehiculo = Vehiculo.query.get_or_404(vehiculo_id)
        historiales = HistorialMantenimiento.query.filter_by(vehiculo_id=vehiculo_id).all()
        
        return jsonify([{
            'id': h.id,
            'tipo': h.tipo,
            'descripcion': h.descripcion,
            'fecha': h.fecha.isoformat(),
            'kilometraje': h.kilometraje,
            'costo': h.costo,
            'servicio_id': h.servicio_id,
            'servicio': {
                'id': h.servicio.id,
                'descripcion': h.servicio.descripcion,
                'fecha': h.servicio.fecha.isoformat(),
                'mecanico': {
                    'id': h.servicio.mecanico.id,
                    'nombre': h.servicio.mecanico.nombre
                } if h.servicio.mecanico else None
            } if h.servicio else None
        } for h in historiales]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@mantenimiento_bp.route('/api/vehiculos/<int:vehiculo_id>/historial', methods=['POST'])
@jwt_required()
def add_historial(vehiculo_id):
    try:
        vehiculo = Vehiculo.query.get_or_404(vehiculo_id)
        data = request.get_json()
        
        nuevo_historial = HistorialMantenimiento(
            tipo=data['tipo'],
            descripcion=data['descripcion'],
            fecha=datetime.now(timezone.utc),
            kilometraje=data['kilometraje'],
            costo=data.get('costo', 0),
            vehiculo_id=vehiculo_id,
            servicio_id=data.get('servicio_id')
        )
        
        db.session.add(nuevo_historial)
        db.session.commit()
        return jsonify({"mensaje": "Registro de mantenimiento agregado exitosamente", "id": nuevo_historial.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Rutas para Mantenimiento Predictivo
@mantenimiento_bp.route('/api/vehiculos/<int:vehiculo_id>/mantenimiento-predictivo', methods=['GET'])
@jwt_required()
def get_mantenimiento_predictivo(vehiculo_id):
    try:
        vehiculo = Vehiculo.query.get_or_404(vehiculo_id)
        
        # Obtener último mantenimiento de cada tipo
        ultimos_mantenimientos = {}
        for tipo in ['aceite', 'frenos', 'filtros', 'general']:
            ultimo = HistorialMantenimiento.query.filter_by(
                vehiculo_id=vehiculo_id,
                tipo=tipo
            ).order_by(HistorialMantenimiento.fecha.desc()).first()
            
            if ultimo:
                ultimos_mantenimientos[tipo] = {
                    'fecha': ultimo.fecha.isoformat(),
                    'kilometraje': ultimo.kilometraje
                }
        
        # Calcular próximos mantenimientos
        proximos_mantenimientos = []
        
        # Mantenimiento de aceite (cada 5000 km o 6 meses)
        if 'aceite' in ultimos_mantenimientos:
            ultimo = ultimos_mantenimientos['aceite']
            fecha_ultimo = datetime.fromisoformat(ultimo['fecha'])
            km_ultimo = ultimo['kilometraje']
            
            # Por kilometraje
            if vehiculo.kilometraje - km_ultimo >= 5000:
                proximos_mantenimientos.append({
                    'tipo': 'aceite',
                    'razon': 'kilometraje',
                    'km_restantes': 0,
                    'dias_restantes': 0
                })
            else:
                km_restantes = 5000 - (vehiculo.kilometraje - km_ultimo)
                proximos_mantenimientos.append({
                    'tipo': 'aceite',
                    'razon': 'kilometraje',
                    'km_restantes': km_restantes,
                    'dias_restantes': None
                })
            
            # Por tiempo
            dias_transcurridos = (datetime.now(timezone.utc) - fecha_ultimo).days
            if dias_transcurridos >= 180:
                proximos_mantenimientos.append({
                    'tipo': 'aceite',
                    'razon': 'tiempo',
                    'km_restantes': None,
                    'dias_restantes': 0
                })
            else:
                dias_restantes = 180 - dias_transcurridos
                proximos_mantenimientos.append({
                    'tipo': 'aceite',
                    'razon': 'tiempo',
                    'km_restantes': None,
                    'dias_restantes': dias_restantes
                })
        
        # Mantenimiento de frenos (cada 20000 km o 1 año)
        if 'frenos' in ultimos_mantenimientos:
            ultimo = ultimos_mantenimientos['frenos']
            fecha_ultimo = datetime.fromisoformat(ultimo['fecha'])
            km_ultimo = ultimo['kilometraje']
            
            # Por kilometraje
            if vehiculo.kilometraje - km_ultimo >= 20000:
                proximos_mantenimientos.append({
                    'tipo': 'frenos',
                    'razon': 'kilometraje',
                    'km_restantes': 0,
                    'dias_restantes': 0
                })
            else:
                km_restantes = 20000 - (vehiculo.kilometraje - km_ultimo)
                proximos_mantenimientos.append({
                    'tipo': 'frenos',
                    'razon': 'kilometraje',
                    'km_restantes': km_restantes,
                    'dias_restantes': None
                })
            
            # Por tiempo
            dias_transcurridos = (datetime.now(timezone.utc) - fecha_ultimo).days
            if dias_transcurridos >= 365:
                proximos_mantenimientos.append({
                    'tipo': 'frenos',
                    'razon': 'tiempo',
                    'km_restantes': None,
                    'dias_restantes': 0
                })
            else:
                dias_restantes = 365 - dias_transcurridos
                proximos_mantenimientos.append({
                    'tipo': 'frenos',
                    'razon': 'tiempo',
                    'km_restantes': None,
                    'dias_restantes': dias_restantes
                })
        
        return jsonify({
            'vehiculo': {
                'id': vehiculo.id,
                'marca': vehiculo.marca,
                'modelo': vehiculo.modelo,
                'placa': vehiculo.placa,
                'kilometraje': vehiculo.kilometraje
            },
            'ultimos_mantenimientos': ultimos_mantenimientos,
            'proximos_mantenimientos': proximos_mantenimientos
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Rutas para Notificaciones
@mantenimiento_bp.route('/api/notificaciones', methods=['GET'])
@jwt_required()
def get_notificaciones():
    try:
        cliente_id = request.args.get('cliente_id')
        leidas = request.args.get('leidas')
        
        query = Notificacion.query
        
        if cliente_id:
            query = query.filter_by(cliente_id=cliente_id)
        if leidas is not None:
            query = query.filter_by(leida=leidas == 'true')
            
        notificaciones = query.order_by(Notificacion.fecha.desc()).all()
        
        return jsonify([{
            'id': n.id,
            'tipo': n.tipo,
            'mensaje': n.mensaje,
            'fecha': n.fecha.isoformat(),
            'leida': n.leida,
            'cliente_id': n.cliente_id,
            'cliente': {
                'id': n.cliente.id,
                'nombre': n.cliente.nombre,
                'email': n.cliente.email
            } if n.cliente else None,
            'vehiculo_id': n.vehiculo_id,
            'vehiculo': {
                'id': n.vehiculo.id,
                'marca': n.vehiculo.marca,
                'modelo': n.vehiculo.modelo,
                'placa': n.vehiculo.placa
            } if n.vehiculo else None
        } for n in notificaciones]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@mantenimiento_bp.route('/api/notificaciones/<int:id>', methods=['PUT'])
@jwt_required()
def marcar_notificacion_leida(id):
    try:
        notificacion = Notificacion.query.get_or_404(id)
        notificacion.leida = True
        db.session.commit()
        return jsonify({"mensaje": "Notificación marcada como leída"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Rutas para Programación de Mantenimiento
@mantenimiento_bp.route('/api/vehiculos/<int:vehiculo_id>/programar-mantenimiento', methods=['POST'])
@jwt_required()
def programar_mantenimiento(vehiculo_id):
    try:
        vehiculo = Vehiculo.query.get_or_404(vehiculo_id)
        data = request.get_json()
        
        # Crear notificación para el cliente
        notificacion = Notificacion(
            tipo='mantenimiento',
            mensaje=f"Se ha programado un mantenimiento de {data['tipo']} para su vehículo {vehiculo.marca} {vehiculo.modelo} ({vehiculo.placa})",
            fecha=datetime.now(timezone.utc),
            leida=False,
            cliente_id=vehiculo.cliente_id,
            vehiculo_id=vehiculo_id
        )
        
        db.session.add(notificacion)
        db.session.commit()
        return jsonify({"mensaje": "Mantenimiento programado exitosamente"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500 
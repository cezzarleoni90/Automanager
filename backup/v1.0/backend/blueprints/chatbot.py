from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from extensions import db
from models import Cliente, Vehiculo, Servicio, Notificacion
from datetime import datetime, timezone

chatbot_bp = Blueprint('chatbot', __name__)

# Rutas para el Chatbot
@chatbot_bp.route('/api/chatbot/consulta', methods=['POST'])
def procesar_consulta():
    try:
        data = request.get_json()
        consulta = data.get('consulta', '').lower()
        cliente_id = data.get('cliente_id')
        
        # Obtener información del cliente si está disponible
        cliente = None
        vehiculos = []
        servicios = []
        if cliente_id:
            cliente = Cliente.query.get(cliente_id)
            if cliente:
                vehiculos = Vehiculo.query.filter_by(cliente_id=cliente_id).all()
                servicios = Servicio.query.join(Vehiculo).filter(Vehiculo.cliente_id == cliente_id).all()
        
        # Procesar la consulta
        respuesta = {
            'mensaje': '',
            'tipo': 'texto',
            'datos': None
        }
        
        # Consultas sobre estado de servicios
        if 'estado' in consulta and 'servicio' in consulta:
            if not cliente_id:
                respuesta['mensaje'] = "Para consultar el estado de tus servicios, necesitas iniciar sesión."
            elif not servicios:
                respuesta['mensaje'] = "No tienes servicios registrados."
            else:
                servicio_actual = servicios[0]  # Tomar el servicio más reciente
                respuesta['mensaje'] = f"Tu servicio más reciente ({servicio_actual.descripcion}) está en estado: {servicio_actual.estado}"
                respuesta['datos'] = {
                    'servicio': {
                        'id': servicio_actual.id,
                        'descripcion': servicio_actual.descripcion,
                        'estado': servicio_actual.estado,
                        'fecha': servicio_actual.fecha.isoformat()
                    }
                }
        
        # Consultas sobre próximos mantenimientos
        elif 'mantenimiento' in consulta and ('próximo' in consulta or 'siguiente' in consulta):
            if not cliente_id:
                respuesta['mensaje'] = "Para consultar tus próximos mantenimientos, necesitas iniciar sesión."
            elif not vehiculos:
                respuesta['mensaje'] = "No tienes vehículos registrados."
            else:
                vehiculo = vehiculos[0]  # Tomar el primer vehículo
                respuesta['mensaje'] = f"Tu próximo mantenimiento para el vehículo {vehiculo.marca} {vehiculo.modelo} está programado para: [Fecha del próximo mantenimiento]"
                respuesta['datos'] = {
                    'vehiculo': {
                        'id': vehiculo.id,
                        'marca': vehiculo.marca,
                        'modelo': vehiculo.modelo,
                        'placa': vehiculo.placa
                    }
                }
        
        # Consultas sobre horarios de atención
        elif 'horario' in consulta or 'atención' in consulta:
            respuesta['mensaje'] = "Nuestro horario de atención es de lunes a viernes de 8:00 AM a 6:00 PM, y sábados de 9:00 AM a 1:00 PM."
        
        # Consultas sobre precios
        elif 'precio' in consulta or 'costo' in consulta:
            respuesta['mensaje'] = "Los precios varían según el servicio. Te recomiendo agendar una cita para una evaluación precisa. ¿Te gustaría programar una cita?"
            respuesta['tipo'] = 'opciones'
            respuesta['datos'] = {
                'opciones': [
                    {'texto': 'Sí, programar cita', 'accion': 'programar_cita'},
                    {'texto': 'No, gracias', 'accion': 'cerrar'}
                ]
            }
        
        # Consultas sobre ubicación
        elif 'ubicación' in consulta or 'dirección' in consulta or 'dónde' in consulta:
            respuesta['mensaje'] = "Nos encontramos en [Dirección del taller]. ¿Te gustaría que te envíe la ubicación en Google Maps?"
            respuesta['tipo'] = 'opciones'
            respuesta['datos'] = {
                'opciones': [
                    {'texto': 'Sí, enviar ubicación', 'accion': 'enviar_ubicacion'},
                    {'texto': 'No, gracias', 'accion': 'cerrar'}
                ]
            }
        
        # Consultas sobre contacto
        elif 'contacto' in consulta or 'teléfono' in consulta or 'llamar' in consulta:
            respuesta['mensaje'] = "Puedes contactarnos al teléfono [Número de teléfono] o por WhatsApp al [Número de WhatsApp]."
        
        # Respuesta por defecto
        else:
            respuesta['mensaje'] = "Lo siento, no entiendo tu consulta. ¿Podrías reformularla? También puedes preguntarme sobre:\n- Estado de servicios\n- Próximos mantenimientos\n- Horarios de atención\n- Precios\n- Ubicación\n- Contacto"
        
        return jsonify(respuesta), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Ruta para programar citas desde el chatbot
@chatbot_bp.route('/api/chatbot/programar-cita', methods=['POST'])
def programar_cita_chatbot():
    try:
        data = request.get_json()
        cliente_id = data.get('cliente_id')
        vehiculo_id = data.get('vehiculo_id')
        fecha = data.get('fecha')
        tipo_servicio = data.get('tipo_servicio')
        
        if not cliente_id or not vehiculo_id or not fecha or not tipo_servicio:
            return jsonify({"error": "Faltan datos requeridos"}), 400
        
        # Crear notificación para el cliente
        notificacion = Notificacion(
            tipo='cita',
            mensaje=f"Se ha programado una cita para {tipo_servicio} el día {fecha}",
            fecha=datetime.now(timezone.utc),
            leida=False,
            cliente_id=cliente_id,
            vehiculo_id=vehiculo_id
        )
        
        db.session.add(notificacion)
        db.session.commit()
        
        return jsonify({
            "mensaje": "Cita programada exitosamente",
            "datos": {
                "fecha": fecha,
                "tipo_servicio": tipo_servicio
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Ruta para obtener historial de conversaciones
@chatbot_bp.route('/api/chatbot/historial/<int:cliente_id>', methods=['GET'])
@jwt_required()
def get_historial_chatbot(cliente_id):
    try:
        notificaciones = Notificacion.query.filter_by(
            cliente_id=cliente_id,
            tipo='chatbot'
        ).order_by(Notificacion.fecha.desc()).all()
        
        return jsonify([{
            'id': n.id,
            'mensaje': n.mensaje,
            'fecha': n.fecha.isoformat(),
            'leida': n.leida
        } for n in notificaciones]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500 
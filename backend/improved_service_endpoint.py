from app import create_app
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Servicio, Cliente, Vehiculo, Mecanico, Usuario
from datetime import datetime
import traceback

def create_improved_service_endpoint():
    app = create_app()
    
    @app.route('/api/servicios/test', methods=['POST'])
    @jwt_required()
    def test_create_servicio():
        try:
            print("📝 Recibiendo solicitud para crear servicio")
            data = request.get_json()
            
            # Imprimir datos recibidos
            print(f"📊 Datos recibidos: {data}")
            
            # Validar campos requeridos
            required_fields = ['tipo_servicio', 'descripcion', 'vehiculo_id']
            for field in required_fields:
                if field not in data:
                    return jsonify({'error': f'Campo {field} es requerido'}), 400
            
            print(f"✅ Validación de campos requeridos exitosa")
            
            # Verificar que el vehículo existe
            vehiculo = Vehiculo.query.get(data['vehiculo_id'])
            if not vehiculo:
                return jsonify({'error': f'Vehículo con ID {data["vehiculo_id"]} no encontrado'}), 404
            
            print(f"✅ Vehículo encontrado: {vehiculo.marca} {vehiculo.modelo} ({vehiculo.placa})")
            
            # Verificar cliente (opcional, si no se proporciona tomar del vehículo)
            cliente_id = data.get('cliente_id') or vehiculo.cliente_id
            cliente = Cliente.query.get(cliente_id)
            if not cliente:
                return jsonify({'error': f'Cliente con ID {cliente_id} no encontrado'}), 404
            
            print(f"✅ Cliente encontrado: {cliente.nombre} {cliente.apellido}")
            
            # Verificar mecánico (opcional)
            mecanico = None
            if data.get('mecanico_id'):
                mecanico = Mecanico.query.get(data['mecanico_id'])
                if not mecanico:
                    return jsonify({'error': f'Mecánico con ID {data["mecanico_id"]} no encontrado'}), 404
                print(f"✅ Mecánico encontrado: {mecanico.nombre} {mecanico.apellido}")
            
            # Obtener usuario actual
            usuario_id = get_jwt_identity()
            usuario = Usuario.query.get(usuario_id)
            if not usuario:
                return jsonify({'error': f'Usuario con ID {usuario_id} no encontrado'}), 404
            
            print(f"✅ Usuario encontrado: {usuario.nombre} {usuario.apellido}")
            
            # Crear servicio con try/except detallado
            try:
                servicio = Servicio(
                    tipo_servicio=data['tipo_servicio'],
                    descripcion=data['descripcion'],
                    vehiculo_id=vehiculo.id,
                    cliente_id=cliente.id,
                    mecanico_id=mecanico.id if mecanico else None,
                    usuario_id=usuario.id,
                    prioridad=data.get('prioridad', 'normal'),
                    fecha_inicio=datetime.utcnow(),
                    estado='pendiente'
                )
                
                print("✅ Objeto servicio creado, intentando guardar en base de datos")
                db.session.add(servicio)
                db.session.flush()  # Para obtener el ID
                
                print(f"✅ Servicio guardado con ID: {servicio.id}")
                
                # Actualizar último servicio del vehículo
                vehiculo.ultimo_servicio = datetime.utcnow()
                if data.get('kilometraje_entrada'):
                    vehiculo.kilometraje = data['kilometraje_entrada']
                
                # Actualizar última visita del cliente
                cliente.ultima_visita = datetime.utcnow()
                
                db.session.commit()
                print("✅ Cambios confirmados en la base de datos")
                
                return jsonify({
                    'mensaje': 'Servicio creado exitosamente',
                    'servicio': {
                        'id': servicio.id,
                        'tipo_servicio': servicio.tipo_servicio,
                        'estado': servicio.estado,
                        'fecha_inicio': servicio.fecha_inicio.isoformat()
                    }
                }), 201
                
            except Exception as inner_e:
                db.session.rollback()
                print(f"❌ Error al crear servicio: {str(inner_e)}")
                print("Detalles técnicos:")
                traceback.print_exc()
                return jsonify({
                    'error': f'Error al guardar el servicio: {str(inner_e)}',
                    'detalles': traceback.format_exc()
                }), 500
                
        except Exception as e:
            print(f"❌ Error general: {str(e)}")
            traceback.print_exc()
            return jsonify({
                'error': f'Error en la solicitud: {str(e)}',
                'detalles': traceback.format_exc()
            }), 500
    
    return app

if __name__ == "__main__":
    app = create_improved_service_endpoint()
    app.run(debug=True, port=5000) 
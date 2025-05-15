from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from models import Usuario, db
from datetime import timedelta

auth_bp = Blueprint('auth', __name__)

# Iniciar sesión
@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        if 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Email y contraseña son requeridos'}), 400
        
        # Buscar usuario
        usuario = Usuario.query.filter_by(email=data['email']).first()
        if not usuario or not usuario.check_password(data['password']):
            return jsonify({'error': 'Credenciales inválidas'}), 401
        
        # Generar token
        access_token = create_access_token(
            identity=usuario.id,
            additional_claims={
                'nombre': usuario.nombre,
                'rol': usuario.rol
            },
            expires_delta=timedelta(days=1)
        )
        
        return jsonify({
            'access_token': access_token,
            'usuario': {
                'id': usuario.id,
                'nombre': usuario.nombre,
                'email': usuario.email,
                'rol': usuario.rol
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Registrar usuario
@auth_bp.route('/register', methods=['POST'])
@jwt_required()
def register():
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['nombre', 'apellido', 'email', 'password', 'rol']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo {field} es requerido'}), 400
        
        # Verificar que el email no existe
        if Usuario.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'El email ya está registrado'}), 400
        
        # Crear nuevo usuario
        nuevo_usuario = Usuario(
            nombre=data['nombre'],
            apellido=data['apellido'],
            email=data['email'],
            rol=data['rol']
        )
        nuevo_usuario.set_password(data['password'])
        
        db.session.add(nuevo_usuario)
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Usuario registrado exitosamente',
            'usuario': {
                'id': nuevo_usuario.id,
                'nombre': nuevo_usuario.nombre,
                'apellido': nuevo_usuario.apellido,
                'email': nuevo_usuario.email,
                'rol': nuevo_usuario.rol
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Obtener perfil de usuario
@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        # Obtener ID del usuario del token
        usuario_id = get_jwt_identity()
        
        # Buscar usuario
        usuario = Usuario.query.get_or_404(usuario_id)
        
        return jsonify({
            'id': usuario.id,
            'nombre': usuario.nombre,
            'apellido': usuario.apellido,
            'email': usuario.email,
            'rol': usuario.rol
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Actualizar perfil de usuario
@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        # Obtener ID del usuario del token
        usuario_id = get_jwt_identity()
        
        # Buscar usuario
        usuario = Usuario.query.get_or_404(usuario_id)
        data = request.get_json()
        
        # Actualizar campos permitidos
        if 'nombre' in data:
            usuario.nombre = data['nombre']
        if 'apellido' in data:
            usuario.apellido = data['apellido']
        if 'email' in data:
            # Verificar si el nuevo email ya existe
            existing = Usuario.query.filter_by(email=data['email']).first()
            if existing and existing.id != usuario_id:
                return jsonify({'error': 'El email ya está registrado'}), 400
            usuario.email = data['email']
        if 'password' in data:
            usuario.password = generate_password_hash(data['password'])
        
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Perfil actualizado exitosamente',
            'usuario': {
                'id': usuario.id,
                'nombre': usuario.nombre,
                'apellido': usuario.apellido,
                'email': usuario.email,
                'rol': usuario.rol
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Cambiar contraseña
@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    try:
        # Obtener ID del usuario del token
        usuario_id = get_jwt_identity()
        
        # Buscar usuario
        usuario = Usuario.query.get_or_404(usuario_id)
        data = request.get_json()
        
        # Validar datos requeridos
        if 'current_password' not in data or 'new_password' not in data:
            return jsonify({'error': 'Contraseña actual y nueva contraseña son requeridas'}), 400
        
        # Verificar contraseña actual
        if not check_password_hash(usuario.password, data['current_password']):
            return jsonify({'error': 'Contraseña actual incorrecta'}), 401
        
        # Actualizar contraseña
        usuario.password = generate_password_hash(data['new_password'])
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Contraseña actualizada exitosamente'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Obtener perfil del usuario actual
@auth_bp.route('/perfil', methods=['GET'])
@jwt_required()
def get_perfil():
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get_or_404(usuario_id)
        
        return jsonify({
            'id': usuario.id,
            'nombre': usuario.nombre,
            'apellido': usuario.apellido,
            'email': usuario.email,
            'rol': usuario.rol,
            'estado': usuario.estado
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Actualizar perfil del usuario actual
@auth_bp.route('/perfil', methods=['PUT'])
@jwt_required()
def update_perfil():
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get_or_404(usuario_id)
        
        data = request.get_json()
        
        # Actualizar campos permitidos
        if 'nombre' in data:
            usuario.nombre = data['nombre']
        if 'apellido' in data:
            usuario.apellido = data['apellido']
        if 'password' in data:
            usuario.password = generate_password_hash(data['password'])
        
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Perfil actualizado exitosamente',
            'usuario': {
                'id': usuario.id,
                'nombre': usuario.nombre,
                'apellido': usuario.apellido,
                'email': usuario.email,
                'rol': usuario.rol
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Cambiar estado de usuario (solo administradores)
@auth_bp.route('/usuarios/<int:id>/estado', methods=['PUT'])
@jwt_required()
def cambiar_estado_usuario(id):
    try:
        # Verificar que el usuario actual es administrador
        usuario_actual_id = get_jwt_identity()
        usuario_actual = Usuario.query.get_or_404(usuario_actual_id)
        
        if usuario_actual.rol != 'administrador':
            return jsonify({'error': 'No autorizado'}), 403
        
        # Obtener usuario a modificar
        usuario = Usuario.query.get_or_404(id)
        
        data = request.get_json()
        if 'estado' not in data:
            return jsonify({'error': 'Campo estado es requerido'}), 400
        
        # Validar estado
        if data['estado'] not in ['activo', 'inactivo']:
            return jsonify({'error': 'Estado inválido'}), 400
        
        # Actualizar estado
        usuario.estado = data['estado']
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Estado actualizado exitosamente',
            'usuario': {
                'id': usuario.id,
                'nombre': usuario.nombre,
                'apellido': usuario.apellido,
                'email': usuario.email,
                'rol': usuario.rol,
                'estado': usuario.estado
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Listar usuarios (solo administradores)
@auth_bp.route('/usuarios', methods=['GET'])
@jwt_required()
def listar_usuarios():
    try:
        # Verificar que el usuario actual es administrador
        usuario_actual_id = get_jwt_identity()
        usuario_actual = Usuario.query.get_or_404(usuario_actual_id)
        
        if usuario_actual.rol != 'administrador':
            return jsonify({'error': 'No autorizado'}), 403
        
        # Obtener parámetros de filtrado
        rol = request.args.get('rol')
        estado = request.args.get('estado')
        
        # Construir query
        query = Usuario.query
        
        if rol:
            query = query.filter_by(rol=rol)
        if estado:
            query = query.filter_by(estado=estado)
        
        usuarios = query.all()
        
        return jsonify({
            'usuarios': [{
                'id': u.id,
                'nombre': u.nombre,
                'apellido': u.apellido,
                'email': u.email,
                'rol': u.rol,
                'estado': u.estado
            } for u in usuarios]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500 
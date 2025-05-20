from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import Usuario, db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import or_
import os
from werkzeug.utils import secure_filename

usuarios_bp = Blueprint('usuarios', __name__)

# Obtener lista de usuarios
@usuarios_bp.route('/api/usuarios', methods=['GET'])
@jwt_required()
def listar_usuarios():
    try:
        # Obtener parámetros de filtrado
        rol = request.args.get('rol')
        busqueda = request.args.get('q')
        
        # Construir query base
        query = Usuario.query
        
        # Aplicar filtros
        if rol:
            query = query.filter_by(rol=rol)
        if busqueda:
            query = query.filter(
                or_(
                    Usuario.nombre.ilike(f'%{busqueda}%'),
                    Usuario.apellido.ilike(f'%{busqueda}%'),
                    Usuario.email.ilike(f'%{busqueda}%')
                )
            )
        
        usuarios = query.order_by(Usuario.apellido, Usuario.nombre).all()
        
        return jsonify({
            'usuarios': [{
                'id': u.id,
                'nombre': u.nombre,
                'apellido': u.apellido,
                'email': u.email,
                'rol': u.rol
            } for u in usuarios]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Obtener usuario por ID
@usuarios_bp.route('/api/usuarios/<int:id>', methods=['GET'])
@jwt_required()
def obtener_usuario(id):
    try:
        usuario = Usuario.query.get_or_404(id)
        
        return jsonify({
            'id': usuario.id,
            'nombre': usuario.nombre,
            'apellido': usuario.apellido,
            'email': usuario.email,
            'rol': usuario.rol
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Crear nuevo usuario
@usuarios_bp.route('/api/usuarios', methods=['POST'])
@jwt_required()
def crear_usuario():
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
            password=generate_password_hash(data['password']),
            rol=data['rol']
        )
        
        db.session.add(nuevo_usuario)
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Usuario creado exitosamente',
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

# Actualizar usuario
@usuarios_bp.route('/api/usuarios/<int:id>', methods=['PUT'])
@jwt_required()
def actualizar_usuario(id):
    try:
        usuario = Usuario.query.get_or_404(id)
        data = request.get_json()
        
        # Actualizar campos permitidos
        if 'nombre' in data:
            usuario.nombre = data['nombre']
        if 'apellido' in data:
            usuario.apellido = data['apellido']
        if 'email' in data:
            # Verificar si el nuevo email ya existe
            existing = Usuario.query.filter_by(email=data['email']).first()
            if existing and existing.id != id:
                return jsonify({'error': 'El email ya está registrado'}), 400
            usuario.email = data['email']
        if 'rol' in data:
            usuario.rol = data['rol']
        if 'password' in data:
            usuario.password = generate_password_hash(data['password'])
        
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Usuario actualizado exitosamente',
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

# Eliminar usuario
@usuarios_bp.route('/api/usuarios/<int:id>', methods=['DELETE'])
@jwt_required()
def eliminar_usuario(id):
    try:
        # Obtener ID del usuario actual
        usuario_actual_id = get_jwt_identity()
        
        # No permitir eliminar el propio usuario
        if id == usuario_actual_id:
            return jsonify({'error': 'No puedes eliminar tu propio usuario'}), 400
        
        # Buscar usuario
        usuario = Usuario.query.get_or_404(id)
        
        # Eliminar usuario
        db.session.delete(usuario)
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Usuario eliminado exitosamente'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Obtener perfil del usuario actual
@usuarios_bp.route('/api/usuarios/perfil', methods=['GET'])
@jwt_required()
def obtener_perfil():
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get_or_404(usuario_id)
        
        return jsonify({
            'perfil': {
                'id': usuario.id,
                'nombre': usuario.nombre,
                'apellido': usuario.apellido,
                'email': usuario.email,
                'telefono': usuario.telefono,
                'cargo': usuario.cargo,
                'departamento': usuario.departamento,
                'foto': usuario.foto,
                'preferencias': usuario.preferencias
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Actualizar perfil del usuario actual
@usuarios_bp.route('/api/usuarios/perfil', methods=['PUT'])
@jwt_required()
def actualizar_perfil():
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get_or_404(usuario_id)
        data = request.get_json()
        
        # Actualizar campos permitidos
        if 'nombre' in data:
            usuario.nombre = data['nombre']
        if 'apellido' in data:
            usuario.apellido = data['apellido']
        if 'telefono' in data:
            usuario.telefono = data['telefono']
        if 'cargo' in data:
            usuario.cargo = data['cargo']
        if 'departamento' in data:
            usuario.departamento = data['departamento']
        if 'preferencias' in data:
            usuario.preferencias = data['preferencias']
        
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Perfil actualizado exitosamente',
            'perfil': {
                'id': usuario.id,
                'nombre': usuario.nombre,
                'apellido': usuario.apellido,
                'email': usuario.email,
                'telefono': usuario.telefono,
                'cargo': usuario.cargo,
                'departamento': usuario.departamento,
                'foto': usuario.foto,
                'preferencias': usuario.preferencias
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Subir foto de perfil
@usuarios_bp.route('/api/usuarios/foto', methods=['POST'])
@jwt_required()
def subir_foto():
    try:
        if 'foto' not in request.files:
            return jsonify({'error': 'No se ha enviado ninguna foto'}), 400
        
        file = request.files['foto']
        if file.filename == '':
            return jsonify({'error': 'No se ha seleccionado ninguna foto'}), 400
        
        # Crear directorio si no existe
        upload_folder = os.path.join('static', 'uploads', 'perfiles')
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
        
        # Guardar archivo
        filename = secure_filename(file.filename)
        filepath = os.path.join(upload_folder, filename)
        file.save(filepath)
        
        # Actualizar usuario
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get_or_404(usuario_id)
        usuario.foto = f'/static/uploads/perfiles/{filename}'
        
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Foto actualizada exitosamente',
            'url': f'/static/uploads/perfiles/{filename}'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Cambiar contraseña
@usuarios_bp.route('/api/usuarios/cambiar-password', methods=['POST'])
@jwt_required()
def cambiar_password():
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get_or_404(usuario_id)
        data = request.get_json()
        
        # Validar datos requeridos
        if not all(k in data for k in ['actual', 'nueva', 'confirmar']):
            return jsonify({'error': 'Todos los campos son requeridos'}), 400
        
        # Validar contraseña actual
        if not check_password_hash(usuario.password, data['actual']):
            return jsonify({'error': 'Contraseña actual incorrecta'}), 400
        
        # Validar que las contraseñas nuevas coincidan
        if data['nueva'] != data['confirmar']:
            return jsonify({'error': 'Las contraseñas nuevas no coinciden'}), 400
        
        # Actualizar contraseña
        usuario.password = generate_password_hash(data['nueva'])
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Contraseña actualizada exitosamente'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500 
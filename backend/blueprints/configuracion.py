from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import Configuracion
from backend.extensions import db
import os
from werkzeug.utils import secure_filename

configuracion_bp = Blueprint('configuracion', __name__)

# Obtener configuración del sistema
@configuracion_bp.route('/api/configuracion/sistema', methods=['GET'])
@jwt_required()
def obtener_configuracion():
    try:
        config = Configuracion.query.first()
        if not config:
            # Crear configuración por defecto si no existe
            config = Configuracion(
                titulo='AutoManager',
                subtitulo='Sistema de Gestión de Taller',
                logo='',
                imagen_fondo='',
                colores={
                    'primario': '#1976d2',
                    'secundario': '#dc004e',
                    'fondo': '#ffffff'
                },
                etiquetas={
                    'clientes': 'Clientes',
                    'vehiculos': 'Vehículos',
                    'servicios': 'Servicios',
                    'inventario': 'Inventario',
                    'mecanicos': 'Mecánicos',
                    'calendario': 'Calendario',
                    'facturacion': 'Facturación'
                }
            )
            db.session.add(config)
            db.session.commit()

        return jsonify({
            'configuracion': {
                'titulo': config.titulo,
                'subtitulo': config.subtitulo,
                'logo': config.logo,
                'imagenFondo': config.imagen_fondo,
                'colores': config.colores,
                'etiquetas': config.etiquetas
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Actualizar configuración del sistema
@configuracion_bp.route('/api/configuracion/sistema', methods=['PUT'])
@jwt_required()
def actualizar_configuracion():
    try:
        data = request.get_json()
        config = Configuracion.query.first()
        
        if not config:
            config = Configuracion()
            db.session.add(config)
        
        # Actualizar campos
        if 'titulo' in data:
            config.titulo = data['titulo']
        if 'subtitulo' in data:
            config.subtitulo = data['subtitulo']
        if 'colores' in data:
            config.colores = data['colores']
        if 'etiquetas' in data:
            config.etiquetas = data['etiquetas']
        
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Configuración actualizada exitosamente',
            'configuracion': {
                'titulo': config.titulo,
                'subtitulo': config.subtitulo,
                'logo': config.logo,
                'imagenFondo': config.imagen_fondo,
                'colores': config.colores,
                'etiquetas': config.etiquetas
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Subir imagen (logo o fondo)
@configuracion_bp.route('/api/configuracion/<tipo>', methods=['POST'])
@jwt_required()
def subir_imagen(tipo):
    try:
        if 'imagen' not in request.files:
            return jsonify({'error': 'No se ha enviado ninguna imagen'}), 400
        
        file = request.files['imagen']
        if file.filename == '':
            return jsonify({'error': 'No se ha seleccionado ninguna imagen'}), 400
        
        if tipo not in ['logo', 'imagenFondo']:
            return jsonify({'error': 'Tipo de imagen no válido'}), 400
        
        # Crear directorio si no existe
        upload_folder = os.path.join('static', 'uploads')
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
        
        # Guardar archivo
        filename = secure_filename(file.filename)
        filepath = os.path.join(upload_folder, filename)
        file.save(filepath)
        
        # Actualizar configuración
        config = Configuracion.query.first()
        if not config:
            config = Configuracion()
            db.session.add(config)
        
        if tipo == 'logo':
            config.logo = f'/static/uploads/{filename}'
        else:
            config.imagen_fondo = f'/static/uploads/{filename}'
        
        db.session.commit()
        
        return jsonify({
            'mensaje': 'Imagen subida exitosamente',
            'url': f'/static/uploads/{filename}'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500 
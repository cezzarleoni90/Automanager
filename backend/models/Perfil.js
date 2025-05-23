const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./Usuario');

class Perfil extends Model {
    // Método para obtener permisos del perfil
    async getPermisos() {
        return this.permisos || [];
    }

    // Método para verificar si tiene un permiso específico
    async tienePermiso(permiso) {
        const permisos = await this.getPermisos();
        return permisos.includes(permiso);
    }

    // Método para actualizar permisos
    async actualizarPermisos(nuevosPermisos, usuario_id) {
        const permisosAnteriores = this.permisos;
        this.permisos = nuevosPermisos;
        await this.save();

        // Registrar cambio en historial
        const HistorialPerfil = require('./HistorialPerfil');
        await HistorialPerfil.create({
            perfil_id: this.id,
            permisos_anteriores: permisosAnteriores,
            permisos_nuevos: nuevosPermisos,
            usuario_id,
            tipo_cambio: 'actualizacion_permisos'
        });
    }

    // Método para obtener usuarios con este perfil
    async getUsuarios() {
        return await Usuario.findAll({
            where: { perfil_id: this.id }
        });
    }
}

Perfil.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    codigo: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    descripcion: {
        type: DataTypes.TEXT
    },
    permisos: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    nivel_acceso: {
        type: DataTypes.ENUM('basico', 'intermedio', 'avanzado', 'administrador'),
        defaultValue: 'basico'
    },
    estado: {
        type: DataTypes.ENUM('activo', 'inactivo'),
        defaultValue: 'activo'
    },
    es_sistema: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    configuracion_ui: {
        type: DataTypes.JSON,
        defaultValue: {
            tema: 'claro',
            menu_colapsado: false,
            notificaciones_activas: true
        }
    },
    restricciones: {
        type: DataTypes.JSON,
        defaultValue: {
            horario_acceso: {
                inicio: '08:00',
                fin: '18:00'
            },
            dias_acceso: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
            ip_permitidas: []
        }
    },
    notas: {
        type: DataTypes.TEXT
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'Perfil',
    tableName: 'perfiles',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeCreate: async (perfil) => {
            // Generar código único
            const count = await Perfil.count();
            perfil.codigo = `PRF${String(count + 1).padStart(6, '0')}`;
        },
        beforeUpdate: async (perfil) => {
            // Actualizar fecha de modificación
            perfil.updated_at = new Date();
        }
    }
});

// Relaciones
Perfil.hasMany(Usuario, { foreignKey: 'perfil_id' });

// Índices
Perfil.addIndex(['codigo']);
Perfil.addIndex(['nombre']);
Perfil.addIndex(['nivel_acceso']);
Perfil.addIndex(['estado']);

module.exports = Perfil; 
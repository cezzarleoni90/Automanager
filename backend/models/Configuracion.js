const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Configuracion extends Model {
    // Método para obtener configuración por categoría
    static async getConfiguracionPorCategoria(categoria) {
        return await Configuracion.findAll({
            where: { categoria },
            order: [['nombre', 'ASC']]
        });
    }

    // Método para obtener valor de configuración
    static async getValor(nombre) {
        const config = await Configuracion.findOne({
            where: { nombre }
        });
        return config ? config.valor : null;
    }

    // Método para actualizar valor
    async actualizarValor(nuevoValor, usuario_id) {
        const valorAnterior = this.valor;
        this.valor = nuevoValor;
        await this.save();

        // Registrar cambio en historial
        const HistorialConfiguracion = require('./HistorialConfiguracion');
        await HistorialConfiguracion.create({
            configuracion_id: this.id,
            valor_anterior: valorAnterior,
            valor_nuevo: nuevoValor,
            usuario_id,
            tipo_cambio: 'actualizacion'
        });
    }
}

Configuracion.init({
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
    valor: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT
    },
    tipo: {
        type: DataTypes.ENUM('sistema', 'negocio', 'usuario'),
        allowNull: false
    },
    categoria: {
        type: DataTypes.STRING,
        allowNull: false
    },
    estado: {
        type: DataTypes.ENUM('activo', 'inactivo'),
        defaultValue: 'activo'
    },
    es_editable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    es_visible: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    valor_default: {
        type: DataTypes.TEXT
    },
    opciones: {
        type: DataTypes.JSON,
        defaultValue: null
    },
    validacion: {
        type: DataTypes.JSON,
        defaultValue: null
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
    modelName: 'Configuracion',
    tableName: 'configuraciones',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeCreate: async (configuracion) => {
            // Generar código único
            const count = await Configuracion.count();
            configuracion.codigo = `CFG${String(count + 1).padStart(6, '0')}`;
        },
        beforeUpdate: async (configuracion) => {
            // Actualizar fecha de modificación
            configuracion.updated_at = new Date();
        }
    }
});

// Índices
Configuracion.addIndex(['codigo']);
Configuracion.addIndex(['nombre']);
Configuracion.addIndex(['tipo']);
Configuracion.addIndex(['categoria']);
Configuracion.addIndex(['estado']);

module.exports = Configuracion; 
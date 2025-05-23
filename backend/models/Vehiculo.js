const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Cliente = require('./Cliente');
const Servicio = require('./Servicio');

class Vehiculo extends Model {
    // Método para obtener el historial de servicios
    async getHistorial() {
        const servicios = await Servicio.findAll({
            where: { vehiculo_id: this.id },
            order: [['fecha_inicio', 'DESC']]
        });
        return servicios;
    }

    // Método para calcular el costo total de servicios
    async getCostoTotalServicios() {
        const servicios = await Servicio.findAll({
            where: { vehiculo_id: this.id }
        });
        return servicios.reduce((total, servicio) => total + servicio.costo_total, 0);
    }

    // Método para obtener el próximo mantenimiento recomendado
    async getProximoMantenimiento() {
        const ultimoServicio = await Servicio.findOne({
            where: { vehiculo_id: this.id },
            order: [['fecha_inicio', 'DESC']]
        });

        if (!ultimoServicio) return null;

        // Lógica para calcular próximo mantenimiento basado en:
        // - Kilometraje actual
        // - Tipo de vehículo
        // - Historial de servicios
        const kilometrajeProximo = this.kilometraje + 5000; // Ejemplo simplificado
        return {
            kilometraje: kilometrajeProximo,
            fecha_estimada: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
        };
    }
}

Vehiculo.init({
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
    marca: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    modelo: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    placa: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            is: /^[A-Z0-9-]+$/i
        }
    },
    color: {
        type: DataTypes.STRING,
        allowNull: false
    },
    anio: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1900,
            max: new Date().getFullYear()
        }
    },
    kilometraje: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    cliente_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Cliente,
            key: 'id'
        }
    },
    estado: {
        type: DataTypes.ENUM('activo', 'inactivo', 'en_mantenimiento'),
        defaultValue: 'activo'
    },
    tipo_combustible: {
        type: DataTypes.ENUM('gasolina', 'diesel', 'electrico', 'hibrido'),
        allowNull: false
    },
    capacidad_tanque: {
        type: DataTypes.FLOAT,
        validate: {
            min: 0
        }
    },
    ultima_revision: {
        type: DataTypes.DATE
    },
    proxima_revision: {
        type: DataTypes.DATE
    },
    observaciones: {
        type: DataTypes.TEXT
    },
    imagenes: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    documentos: {
        type: DataTypes.JSON,
        defaultValue: []
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
    modelName: 'Vehiculo',
    tableName: 'vehiculos',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeCreate: async (vehiculo) => {
            // Generar código único
            const count = await Vehiculo.count();
            vehiculo.codigo = `VH${String(count + 1).padStart(6, '0')}`;
        },
        beforeUpdate: async (vehiculo) => {
            // Actualizar fecha de modificación
            vehiculo.updated_at = new Date();
        }
    }
});

// Relaciones
Vehiculo.belongsTo(Cliente, { foreignKey: 'cliente_id' });
Vehiculo.hasMany(Servicio, { foreignKey: 'vehiculo_id' });

// Índices
Vehiculo.addIndex(['placa']);
Vehiculo.addIndex(['cliente_id']);
Vehiculo.addIndex(['estado']);

module.exports = Vehiculo; 
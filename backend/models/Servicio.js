const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Vehiculo = require('./Vehiculo');
const Mecanico = require('./Mecanico');
const Producto = require('./Producto');

class Servicio extends Model {
    // Método para calcular el costo total del servicio
    async calcularCostoTotal() {
        const productos = await this.getProductos();
        const costoProductos = productos.reduce((total, producto) => 
            total + (producto.precio * producto.ServicioProducto.cantidad), 0);
        
        const costoManoObra = this.horas_trabajo * this.tarifa_hora;
        
        return costoProductos + costoManoObra;
    }

    // Método para verificar disponibilidad de productos
    async verificarDisponibilidadProductos() {
        const productos = await this.getProductos();
        const productosNoDisponibles = [];

        for (const producto of productos) {
            if (producto.stock < producto.ServicioProducto.cantidad) {
                productosNoDisponibles.push({
                    producto: producto.nombre,
                    stock_disponible: producto.stock,
                    cantidad_requerida: producto.ServicioProducto.cantidad
                });
            }
        }

        return productosNoDisponibles;
    }

    // Método para actualizar el estado del servicio
    async actualizarEstado(nuevoEstado) {
        const estadosValidos = ['pendiente', 'en_proceso', 'completado', 'cancelado'];
        if (!estadosValidos.includes(nuevoEstado)) {
            throw new Error('Estado no válido');
        }

        this.estado = nuevoEstado;
        if (nuevoEstado === 'completado') {
            this.fecha_fin = new Date();
        }
        await this.save();
    }
}

Servicio.init({
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
    vehiculo_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Vehiculo,
            key: 'id'
        }
    },
    mecanico_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Mecanico,
            key: 'id'
        }
    },
    tipo_servicio: {
        type: DataTypes.ENUM('mantenimiento', 'reparacion', 'diagnostico', 'inspeccion'),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    estado: {
        type: DataTypes.ENUM('pendiente', 'en_proceso', 'completado', 'cancelado'),
        defaultValue: 'pendiente'
    },
    fecha_inicio: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    fecha_estimada: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fecha_fin: {
        type: DataTypes.DATE
    },
    horas_trabajo: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    tarifa_hora: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    costo_estimado: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    costo_total: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    diagnostico: {
        type: DataTypes.TEXT
    },
    solucion: {
        type: DataTypes.TEXT
    },
    recomendaciones: {
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
    prioridad: {
        type: DataTypes.ENUM('baja', 'media', 'alta', 'urgente'),
        defaultValue: 'media'
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
    modelName: 'Servicio',
    tableName: 'servicios',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeCreate: async (servicio) => {
            // Generar código único
            const count = await Servicio.count();
            servicio.codigo = `SV${String(count + 1).padStart(6, '0')}`;
        },
        beforeUpdate: async (servicio) => {
            // Actualizar fecha de modificación
            servicio.updated_at = new Date();
            
            // Si el estado cambia a completado, actualizar fecha_fin
            if (servicio.changed('estado') && servicio.estado === 'completado') {
                servicio.fecha_fin = new Date();
            }
        },
        afterCreate: async (servicio) => {
            // Actualizar estado del vehículo
            const vehiculo = await Vehiculo.findByPk(servicio.vehiculo_id);
            if (vehiculo) {
                vehiculo.estado = 'en_mantenimiento';
                await vehiculo.save();
            }
        },
        afterUpdate: async (servicio) => {
            // Si el servicio se completa o cancela, actualizar estado del vehículo
            if (servicio.changed('estado') && 
                (servicio.estado === 'completado' || servicio.estado === 'cancelado')) {
                const vehiculo = await Vehiculo.findByPk(servicio.vehiculo_id);
                if (vehiculo) {
                    vehiculo.estado = 'activo';
                    await vehiculo.save();
                }
            }
        }
    }
});

// Relaciones
Servicio.belongsTo(Vehiculo, { foreignKey: 'vehiculo_id' });
Servicio.belongsTo(Mecanico, { foreignKey: 'mecanico_id' });
Servicio.belongsToMany(Producto, { 
    through: 'servicio_productos',
    foreignKey: 'servicio_id',
    otherKey: 'producto_id'
});

// Índices
Servicio.addIndex(['codigo']);
Servicio.addIndex(['vehiculo_id']);
Servicio.addIndex(['mecanico_id']);
Servicio.addIndex(['estado']);
Servicio.addIndex(['fecha_inicio']);
Servicio.addIndex(['fecha_estimada']);

module.exports = Servicio; 
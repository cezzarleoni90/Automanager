const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Servicio = require('./Servicio');
const Categoria = require('./Categoria');

class Producto extends Model {
    // Método para verificar stock bajo
    async verificarStockBajo() {
        return this.stock <= this.stock_minimo;
    }

    // Método para registrar movimiento de inventario
    async registrarMovimiento(tipo, cantidad, motivo, usuario_id) {
        const Movimiento = require('./Movimiento');
        await Movimiento.create({
            producto_id: this.id,
            tipo,
            cantidad,
            motivo,
            usuario_id,
            stock_anterior: this.stock,
            stock_nuevo: tipo === 'entrada' ? 
                this.stock + cantidad : 
                this.stock - cantidad
        });

        // Actualizar stock
        this.stock = tipo === 'entrada' ? 
            this.stock + cantidad : 
            this.stock - cantidad;
        await this.save();
    }

    // Método para calcular valor total en inventario
    calcularValorTotal() {
        return this.stock * this.precio;
    }

    // Método para obtener historial de movimientos
    async getHistorialMovimientos() {
        const Movimiento = require('./Movimiento');
        return await Movimiento.findAll({
            where: { producto_id: this.id },
            order: [['fecha', 'DESC']]
        });
    }
}

Producto.init({
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
    categoria_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Categoria,
            key: 'id'
        }
    },
    marca: {
        type: DataTypes.STRING
    },
    modelo: {
        type: DataTypes.STRING
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    stock_minimo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
        validate: {
            min: 0
        }
    },
    precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    precio_compra: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    unidad_medida: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ubicacion: {
        type: DataTypes.STRING
    },
    proveedor_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'proveedores',
            key: 'id'
        }
    },
    estado: {
        type: DataTypes.ENUM('activo', 'inactivo', 'agotado'),
        defaultValue: 'activo'
    },
    fecha_ultima_compra: {
        type: DataTypes.DATE
    },
    fecha_ultima_venta: {
        type: DataTypes.DATE
    },
    imagenes: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    especificaciones: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    codigo_barras: {
        type: DataTypes.STRING,
        unique: true
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
    modelName: 'Producto',
    tableName: 'productos',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeCreate: async (producto) => {
            // Generar código único
            const count = await Producto.count();
            producto.codigo = `PR${String(count + 1).padStart(6, '0')}`;
        },
        beforeUpdate: async (producto) => {
            // Actualizar fecha de modificación
            producto.updated_at = new Date();

            // Actualizar estado basado en stock
            if (producto.changed('stock')) {
                if (producto.stock <= 0) {
                    producto.estado = 'agotado';
                } else if (producto.stock <= producto.stock_minimo) {
                    producto.estado = 'activo';
                    // Aquí se podría implementar una notificación de stock bajo
                }
            }
        }
    }
});

// Relaciones
Producto.belongsTo(Categoria, { foreignKey: 'categoria_id' });
Producto.belongsToMany(Servicio, { 
    through: 'servicio_productos',
    foreignKey: 'producto_id',
    otherKey: 'servicio_id'
});

// Índices
Producto.addIndex(['codigo']);
Producto.addIndex(['codigo_barras']);
Producto.addIndex(['categoria_id']);
Producto.addIndex(['estado']);
Producto.addIndex(['stock']);

module.exports = Producto; 
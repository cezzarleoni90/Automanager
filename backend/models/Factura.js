const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Cliente = require('./Cliente');
const Servicio = require('./Servicio');

class Factura extends Model {
    // Método para calcular totales
    async calcularTotales() {
        const servicios = await this.getServicios();
        const subtotal = servicios.reduce((total, servicio) => 
            total + servicio.costo_total, 0);
        
        const impuestos = subtotal * 0.16; // 16% IVA
        const total = subtotal + impuestos;

        return {
            subtotal,
            impuestos,
            total
        };
    }

    // Método para verificar estado de pago
    async verificarEstadoPago() {
        const pagos = await this.getPagos();
        const totalPagado = pagos.reduce((total, pago) => 
            total + pago.monto, 0);

        if (totalPagado >= this.total) {
            this.estado = 'pagada';
        } else if (new Date() > this.fecha_vencimiento) {
            this.estado = 'vencida';
        } else {
            this.estado = 'pendiente';
        }

        await this.save();
        return {
            estado: this.estado,
            total_pagado: totalPagado,
            saldo_pendiente: this.total - totalPagado
        };
    }

    // Método para registrar pago
    async registrarPago(monto, metodo_pago, referencia, usuario_id) {
        const Pago = require('./Pago');
        await Pago.create({
            factura_id: this.id,
            monto,
            metodo_pago,
            referencia,
            usuario_id
        });

        await this.verificarEstadoPago();
    }

    // Método para generar PDF
    async generarPDF() {
        // Aquí se implementaría la lógica para generar el PDF
        // usando una librería como PDFKit o similar
        return {
            url: `/facturas/${this.id}/pdf`,
            fecha_generacion: new Date()
        };
    }
}

Factura.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    numero: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    cliente_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Cliente,
            key: 'id'
        }
    },
    fecha: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    fecha_vencimiento: {
        type: DataTypes.DATE,
        allowNull: false
    },
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    impuestos: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    estado: {
        type: DataTypes.ENUM('pendiente', 'pagada', 'vencida', 'cancelada'),
        defaultValue: 'pendiente'
    },
    metodo_pago: {
        type: DataTypes.ENUM('efectivo', 'tarjeta', 'transferencia'),
        allowNull: false
    },
    concepto: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    notas: {
        type: DataTypes.TEXT
    },
    terminos_condiciones: {
        type: DataTypes.TEXT
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
    modelName: 'Factura',
    tableName: 'facturas',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeCreate: async (factura) => {
            // Generar número de factura
            const count = await Factura.count();
            const fecha = new Date();
            factura.numero = `F${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(count + 1).padStart(6, '0')}`;
        },
        beforeUpdate: async (factura) => {
            // Actualizar fecha de modificación
            factura.updated_at = new Date();
        }
    }
});

// Relaciones
Factura.belongsTo(Cliente, { foreignKey: 'cliente_id' });
Factura.belongsToMany(Servicio, { 
    through: 'factura_servicios',
    foreignKey: 'factura_id',
    otherKey: 'servicio_id'
});

// Índices
Factura.addIndex(['numero']);
Factura.addIndex(['cliente_id']);
Factura.addIndex(['estado']);
Factura.addIndex(['fecha']);
Factura.addIndex(['fecha_vencimiento']);

module.exports = Factura; 
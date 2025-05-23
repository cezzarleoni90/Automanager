const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Servicio = require('./Servicio');

class Mecanico extends Model {
    // Método para obtener servicios activos
    async getServiciosActivos() {
        return await Servicio.findAll({
            where: {
                mecanico_id: this.id,
                estado: ['pendiente', 'en_proceso']
            }
        });
    }

    // Método para calcular disponibilidad en una fecha
    async getDisponibilidad(fecha) {
        const servicios = await Servicio.findAll({
            where: {
                mecanico_id: this.id,
                estado: ['pendiente', 'en_proceso'],
                fecha_inicio: {
                    [Op.lte]: fecha
                },
                fecha_estimada: {
                    [Op.gte]: fecha
                }
            }
        });

        return {
            disponible: servicios.length < this.max_servicios_simultaneos,
            servicios_activos: servicios.length,
            max_servicios: this.max_servicios_simultaneos
        };
    }

    // Método para obtener estadísticas de rendimiento
    async getEstadisticasRendimiento() {
        const servicios = await Servicio.findAll({
            where: {
                mecanico_id: this.id,
                estado: 'completado',
                fecha_fin: {
                    [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
                }
            }
        });

        const totalServicios = servicios.length;
        const serviciosATiempo = servicios.filter(s => 
            new Date(s.fecha_fin) <= new Date(s.fecha_estimada)
        ).length;

        return {
            total_servicios: totalServicios,
            servicios_a_tiempo: serviciosATiempo,
            porcentaje_eficiencia: totalServicios > 0 ? 
                (serviciosATiempo / totalServicios) * 100 : 0
        };
    }
}

Mecanico.init({
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
    apellido: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    especialidad: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    telefono: {
        type: DataTypes.STRING,
        allowNull: false
    },
    estado: {
        type: DataTypes.ENUM('activo', 'inactivo', 'vacaciones', 'licencia'),
        defaultValue: 'activo'
    },
    horario: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
            lunes: { inicio: '08:00', fin: '17:00' },
            martes: { inicio: '08:00', fin: '17:00' },
            miercoles: { inicio: '08:00', fin: '17:00' },
            jueves: { inicio: '08:00', fin: '17:00' },
            viernes: { inicio: '08:00', fin: '17:00' }
        }
    },
    max_servicios_simultaneos: {
        type: DataTypes.INTEGER,
        defaultValue: 3,
        validate: {
            min: 1,
            max: 5
        }
    },
    nivel_experiencia: {
        type: DataTypes.ENUM('junior', 'intermedio', 'senior', 'especialista'),
        defaultValue: 'intermedio'
    },
    certificaciones: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    habilidades: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    tarifa_hora: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    fecha_contratacion: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fecha_termino: {
        type: DataTypes.DATE
    },
    documentos: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    observaciones: {
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
    modelName: 'Mecanico',
    tableName: 'mecanicos',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeCreate: async (mecanico) => {
            // Generar código único
            const count = await Mecanico.count();
            mecanico.codigo = `MC${String(count + 1).padStart(6, '0')}`;
        },
        beforeUpdate: async (mecanico) => {
            // Actualizar fecha de modificación
            mecanico.updated_at = new Date();
        }
    }
});

// Relaciones
Mecanico.hasMany(Servicio, { foreignKey: 'mecanico_id' });

// Índices
Mecanico.addIndex(['codigo']);
Mecanico.addIndex(['email']);
Mecanico.addIndex(['estado']);
Mecanico.addIndex(['especialidad']);

module.exports = Mecanico; 
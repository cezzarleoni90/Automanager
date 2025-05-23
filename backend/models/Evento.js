const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Mecanico = require('./Mecanico');
const Servicio = require('./Servicio');

class Evento extends Model {
    // Método para verificar disponibilidad
    static async verificarDisponibilidad(mecanico_id, fecha_inicio, fecha_fin, evento_id = null) {
        const where = {
            mecanico_id,
            estado: ['pendiente', 'en_proceso'],
            [Op.or]: [
                {
                    fecha_inicio: {
                        [Op.between]: [fecha_inicio, fecha_fin]
                    }
                },
                {
                    fecha_fin: {
                        [Op.between]: [fecha_inicio, fecha_fin]
                    }
                }
            ]
        };

        if (evento_id) {
            where.id = { [Op.ne]: evento_id };
        }

        const eventosExistentes = await Evento.findAll({ where });
        return eventosExistentes.length === 0;
    }

    // Método para obtener eventos por rango de fechas
    static async getEventosPorRango(fecha_inicio, fecha_fin, mecanico_id = null) {
        const where = {
            fecha_inicio: {
                [Op.between]: [fecha_inicio, fecha_fin]
            }
        };

        if (mecanico_id) {
            where.mecanico_id = mecanico_id;
        }

        return await Evento.findAll({
            where,
            include: [
                {
                    model: Mecanico,
                    attributes: ['nombre', 'apellido', 'especialidad']
                },
                {
                    model: Servicio,
                    attributes: ['codigo', 'descripcion', 'estado']
                }
            ],
            order: [['fecha_inicio', 'ASC']]
        });
    }

    // Método para obtener eventos del día
    static async getEventosDelDia(fecha, mecanico_id = null) {
        const inicioDia = new Date(fecha);
        inicioDia.setHours(0, 0, 0, 0);
        
        const finDia = new Date(fecha);
        finDia.setHours(23, 59, 59, 999);

        return await this.getEventosPorRango(inicioDia, finDia, mecanico_id);
    }

    // Método para obtener eventos de la semana
    static async getEventosDeLaSemana(fecha, mecanico_id = null) {
        const inicioSemana = new Date(fecha);
        inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
        inicioSemana.setHours(0, 0, 0, 0);
        
        const finSemana = new Date(inicioSemana);
        finSemana.setDate(finSemana.getDate() + 6);
        finSemana.setHours(23, 59, 59, 999);

        return await this.getEventosPorRango(inicioSemana, finSemana, mecanico_id);
    }
}

Evento.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    titulo: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    tipo: {
        type: DataTypes.ENUM('servicio', 'mantenimiento', 'reunion', 'otro'),
        allowNull: false
    },
    mecanico_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Mecanico,
            key: 'id'
        }
    },
    servicio_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Servicio,
            key: 'id'
        }
    },
    fecha_inicio: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fecha_fin: {
        type: DataTypes.DATE,
        allowNull: false
    },
    estado: {
        type: DataTypes.ENUM('pendiente', 'en_proceso', 'completado', 'cancelado'),
        defaultValue: 'pendiente'
    },
    descripcion: {
        type: DataTypes.TEXT
    },
    ubicacion: {
        type: DataTypes.STRING
    },
    prioridad: {
        type: DataTypes.ENUM('baja', 'media', 'alta', 'urgente'),
        defaultValue: 'media'
    },
    color: {
        type: DataTypes.STRING,
        defaultValue: '#2196F3'
    },
    recordatorio: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    tiempo_recordatorio: {
        type: DataTypes.INTEGER, // minutos antes del evento
        defaultValue: 30
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
    modelName: 'Evento',
    tableName: 'eventos',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeCreate: async (evento) => {
            // Verificar disponibilidad
            const disponible = await Evento.verificarDisponibilidad(
                evento.mecanico_id,
                evento.fecha_inicio,
                evento.fecha_fin
            );

            if (!disponible) {
                throw new Error('El mecánico no está disponible en el horario seleccionado');
            }
        },
        beforeUpdate: async (evento) => {
            // Actualizar fecha de modificación
            evento.updated_at = new Date();

            // Si se modifican las fechas, verificar disponibilidad
            if (evento.changed('fecha_inicio') || evento.changed('fecha_fin')) {
                const disponible = await Evento.verificarDisponibilidad(
                    evento.mecanico_id,
                    evento.fecha_inicio,
                    evento.fecha_fin,
                    evento.id
                );

                if (!disponible) {
                    throw new Error('El mecánico no está disponible en el horario seleccionado');
                }
            }
        }
    }
});

// Relaciones
Evento.belongsTo(Mecanico, { foreignKey: 'mecanico_id' });
Evento.belongsTo(Servicio, { foreignKey: 'servicio_id' });

// Índices
Evento.addIndex(['mecanico_id']);
Evento.addIndex(['servicio_id']);
Evento.addIndex(['fecha_inicio']);
Evento.addIndex(['fecha_fin']);
Evento.addIndex(['estado']);
Evento.addIndex(['tipo']);

module.exports = Evento; 
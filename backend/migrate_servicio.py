from app import create_app
from extensions import db
import sqlite3
from datetime import datetime, timezone

def migrate_servicio():
    app = create_app()
    with app.app_context():
        try:
            # Conectar a la base de datos
            conn = sqlite3.connect('instance/automanager.db')
            cursor = conn.cursor()
            
            # Crear una tabla temporal con la nueva estructura
            cursor.execute('''
                CREATE TABLE servicio_temp (
                    id INTEGER PRIMARY KEY,
                    tipo_servicio VARCHAR(50) NOT NULL,
                    descripcion TEXT NOT NULL,
                    fecha_inicio DATETIME NOT NULL,
                    fecha_fin DATETIME,
                    fecha_estimada_fin DATETIME,
                    estado VARCHAR(20) NOT NULL,
                    prioridad VARCHAR(10),
                    notas TEXT,
                    diagnostico TEXT,
                    recomendaciones TEXT,
                    costo_estimado FLOAT,
                    costo_real FLOAT,
                    kilometraje_entrada FLOAT,
                    kilometraje_salida FLOAT,
                    nivel_combustible_entrada FLOAT,
                    nivel_combustible_salida FLOAT,
                    fecha_aprobacion_cliente DATETIME,
                    motivo_cancelacion TEXT,
                    vehiculo_id INTEGER NOT NULL,
                    mecanico_id INTEGER,
                    cliente_id INTEGER,
                    usuario_id INTEGER NOT NULL,
                    FOREIGN KEY (vehiculo_id) REFERENCES vehiculo (id),
                    FOREIGN KEY (mecanico_id) REFERENCES mecanico (id),
                    FOREIGN KEY (cliente_id) REFERENCES cliente (id),
                    FOREIGN KEY (usuario_id) REFERENCES usuario (id)
                )
            ''')
            
            # Copiar los datos existentes a la tabla temporal
            cursor.execute('''
                INSERT INTO servicio_temp (
                    id, tipo_servicio, descripcion, fecha_inicio, fecha_fin,
                    estado, vehiculo_id, mecanico_id, cliente_id, usuario_id
                )
                SELECT 
                    id, tipo_servicio, descripcion, fecha_inicio, fecha_fin,
                    estado, vehiculo_id, mecanico_id, cliente_id, usuario_id
                FROM servicio
            ''')
            
            # Eliminar la tabla original
            cursor.execute('DROP TABLE servicio')
            
            # Renombrar la tabla temporal
            cursor.execute('ALTER TABLE servicio_temp RENAME TO servicio')
            
            # Actualizar los registros existentes con valores por defecto
            cursor.execute('''
                UPDATE servicio SET
                    prioridad = 'normal',
                    fecha_estimada_fin = fecha_inicio,
                    costo_estimado = 0,
                    costo_real = 0,
                    kilometraje_entrada = 0,
                    kilometraje_salida = 0,
                    nivel_combustible_entrada = 0,
                    nivel_combustible_salida = 0
            ''')
            
            conn.commit()
            print("Migración completada exitosamente")
            
        except Exception as e:
            print(f"Error durante la migración: {str(e)}")
            conn.rollback()
            raise e
        finally:
            conn.close()

if __name__ == '__main__':
    try:
        migrate_servicio()
        print("Proceso completado exitosamente")
    except Exception as e:
        print(f"Error en el proceso: {str(e)}") 
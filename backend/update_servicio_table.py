from app import app
from extensions import db
import sqlite3

def update_servicio_table():
    with app.app_context():
        try:
            # Conectar directamente a la base de datos SQLite
            conn = sqlite3.connect('instance/automanager.db')
            cursor = conn.cursor()
            
            # Agregar las nuevas columnas si no existen
            new_columns = [
                'fecha_estimada_fin DATETIME',
                'prioridad VARCHAR(10)',
                'notas TEXT',
                'diagnostico TEXT',
                'recomendaciones TEXT',
                'costo_estimado FLOAT',
                'costo_real FLOAT',
                'kilometraje_entrada FLOAT',
                'kilometraje_salida FLOAT',
                'nivel_combustible_entrada FLOAT',
                'nivel_combustible_salida FLOAT',
                'fecha_aprobacion_cliente DATETIME',
                'motivo_cancelacion TEXT'
            ]
            
            for column in new_columns:
                try:
                    column_name = column.split()[0]
                    cursor.execute(f'ALTER TABLE servicio ADD COLUMN {column}')
                    print(f"Columna {column_name} agregada exitosamente")
                except sqlite3.OperationalError as e:
                    if "duplicate column name" in str(e):
                        print(f"La columna {column_name} ya existe")
                    else:
                        raise e
            
            conn.commit()
            print("Tabla servicio actualizada exitosamente")
            
        except Exception as e:
            print(f"Error al actualizar la tabla servicio: {str(e)}")
            conn.rollback()
            raise e
        finally:
            conn.close()

if __name__ == '__main__':
    try:
        update_servicio_table()
        print("Proceso completado exitosamente")
    except Exception as e:
        print(f"Error en el proceso: {str(e)}") 
from app import app
from extensions import db
import sqlite3

def check_servicio_table():
    with app.app_context():
        try:
            # Conectar directamente a la base de datos SQLite
            conn = sqlite3.connect('instance/automanager.db')
            cursor = conn.cursor()
            
            # Obtener la estructura de la tabla servicio
            cursor.execute("PRAGMA table_info(servicio)")
            columns = cursor.fetchall()
            
            print("\nEstructura de la tabla servicio:")
            print("-" * 50)
            for column in columns:
                print(f"Columna: {column[1]}, Tipo: {column[2]}")
            print("-" * 50)
            
            # Verificar si existen los registros
            cursor.execute("SELECT COUNT(*) FROM servicio")
            count = cursor.fetchone()[0]
            print(f"\nNúmero de registros en la tabla: {count}")
            
            if count > 0:
                # Mostrar un ejemplo de registro
                cursor.execute("SELECT * FROM servicio LIMIT 1")
                record = cursor.fetchone()
                print("\nEjemplo de registro:")
                print("-" * 50)
                for i, column in enumerate(columns):
                    print(f"{column[1]}: {record[i]}")
                print("-" * 50)
            
        except Exception as e:
            print(f"Error al verificar la tabla servicio: {str(e)}")
            raise e
        finally:
            conn.close()

if __name__ == '__main__':
    try:
        check_servicio_table()
        print("\nVerificación completada exitosamente")
    except Exception as e:
        print(f"Error en el proceso: {str(e)}") 
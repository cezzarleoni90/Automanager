import sqlite3
from app import create_app

def manual_migration():
    app = create_app()
    
    # Conectar directamente a la base de datos
    conn = sqlite3.connect('automanager.db')
    cursor = conn.cursor()
    
    try:
        # Verificar si la columna existe
        cursor.execute("PRAGMA table_info(mecanico)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'tarifa_hora' in columns:
            print("✅ La columna tarifa_hora ya existe")
        else:
            # Agregar la columna
            cursor.execute("ALTER TABLE mecanico ADD COLUMN tarifa_hora REAL DEFAULT 0.0")
            print("✅ Columna tarifa_hora agregada")
            
            # Actualizar registros existentes
            cursor.execute("UPDATE mecanico SET tarifa_hora = 25.0 WHERE tarifa_hora IS NULL")
            print("✅ Registros existentes actualizados")
            
        conn.commit()
        print("✅ Migración completada exitosamente")
        
    except Exception as e:
        print(f"❌ Error en migración: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    manual_migration() 
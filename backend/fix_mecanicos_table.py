import sqlite3
import os
from app import create_app

def fix_mecanicos_table():
    app = create_app()
    
    # Ruta completa a la base de datos
    db_path = os.path.join(os.path.dirname(__file__), 'automanager.db')
    
    # Verificar que el archivo existe
    if not os.path.exists(db_path):
        print(f"❌ No se encuentra la base de datos en: {db_path}")
        return
    
    print(f"📂 Usando base de datos: {db_path}")
    
    # Conectar directamente a la base de datos
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Verificar la estructura actual de la tabla
        cursor.execute("PRAGMA table_info(mecanico)")
        columns = cursor.fetchall()
        
        print("\n📋 Estructura actual de la tabla mecanico:")
        column_names = []
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
            column_names.append(col[1])
        
        # Verificar si tarifa_hora existe
        if 'tarifa_hora' in column_names:
            print("\n✅ La columna tarifa_hora ya existe")
            
            # Verificar valores
            cursor.execute("SELECT id, nombre, apellido, tarifa_hora FROM mecanico")
            mecanicos = cursor.fetchall()
            print(f"\n👥 Mecánicos encontrados ({len(mecanicos)}):")
            for m in mecanicos:
                print(f"  - {m[1]} {m[2]}: ${m[3] or 0}/hora")
        else:
            print("\n⚠️ La columna tarifa_hora NO existe, agregándola...")
            
            # Agregar la columna
            cursor.execute("ALTER TABLE mecanico ADD COLUMN tarifa_hora REAL DEFAULT 0.0")
            print("✅ Columna tarifa_hora agregada")
            
            # Actualizar registros existentes con una tarifa por defecto
            cursor.execute("UPDATE mecanico SET tarifa_hora = 25.0 WHERE tarifa_hora IS NULL OR tarifa_hora = 0")
            rows_updated = cursor.rowcount
            print(f"✅ {rows_updated} registros actualizados con tarifa por defecto")
            
            conn.commit()
            print("✅ Migración completada exitosamente")
            
            # Verificar resultado
            cursor.execute("SELECT id, nombre, apellido, tarifa_hora FROM mecanico")
            mecanicos = cursor.fetchall()
            print(f"\n👥 Mecánicos después de la migración:")
            for m in mecanicos:
                print(f"  - {m[1]} {m[2]}: ${m[3]}/hora")
        
    except Exception as e:
        print(f"❌ Error en migración: {e}")
        print(f"Tipo de error: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    fix_mecanicos_table() 
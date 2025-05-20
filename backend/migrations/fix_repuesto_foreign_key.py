from backend.app import create_app
from backend.extensions import db
from sqlalchemy import text

app = create_app()

def migrate():
    with app.app_context():
        try:
            with db.engine.connect() as conn:
                # Verificar si la columna proveedor_id existe
                inspector = db.inspect(db.engine)
                columns = [col['name'] for col in inspector.get_columns('repuesto')]
                
                if 'proveedor_id' not in columns:
                    # Agregar columna proveedor_id
                    conn.execute(text("""
                        ALTER TABLE repuesto 
                        ADD COLUMN proveedor_id INTEGER 
                        REFERENCES proveedor(id)
                    """))
                    print("Columna proveedor_id agregada a la tabla repuesto")
                else:
                    # Verificar y corregir la restricción de clave foránea
                    conn.execute(text("PRAGMA foreign_keys = OFF"))
                    
                    # Crear tabla temporal
                    conn.execute(text("""
                        CREATE TABLE repuesto_temp (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            nombre TEXT NOT NULL,
                            codigo TEXT UNIQUE NOT NULL,
                            descripcion TEXT,
                            stock INTEGER DEFAULT 0,
                            stock_minimo INTEGER DEFAULT 5,
                            precio_compra REAL NOT NULL,
                            precio_venta REAL NOT NULL,
                            categoria TEXT,
                            estado TEXT DEFAULT 'activo',
                            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            proveedor_id INTEGER REFERENCES proveedor(id)
                        )
                    """))
                    
                    # Copiar datos
                    conn.execute(text("""
                        INSERT INTO repuesto_temp 
                        SELECT * FROM repuesto
                    """))
                    
                    # Eliminar tabla original
                    conn.execute(text("DROP TABLE repuesto"))
                    
                    # Renombrar tabla temporal
                    conn.execute(text("ALTER TABLE repuesto_temp RENAME TO repuesto"))
                    
                    # Activar claves foráneas
                    conn.execute(text("PRAGMA foreign_keys = ON"))
                    
                    print("Restricción de clave foránea corregida en la tabla repuesto")
                
                conn.commit()
            
        except Exception as e:
            print(f"Error durante la migración: {e}")
            raise

if __name__ == '__main__':
    migrate() 
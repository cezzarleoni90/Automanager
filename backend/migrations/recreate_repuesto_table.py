from backend.app import create_app
from backend.extensions import db
from sqlalchemy import text

app = create_app()

def migrate():
    with app.app_context():
        try:
            with db.engine.connect() as conn:
                # Crear tabla temporal con la estructura correcta
                conn.execute(text("""
                    CREATE TABLE repuesto_temp (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        nombre TEXT NOT NULL,
                        codigo TEXT UNIQUE,
                        descripcion TEXT,
                        stock INTEGER DEFAULT 0,
                        stock_minimo INTEGER DEFAULT 0,
                        precio_compra REAL,
                        precio_venta REAL,
                        categoria TEXT,
                        estado TEXT DEFAULT 'activo',
                        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        proveedor_id INTEGER REFERENCES proveedor(id)
                    )
                """))
                
                # Copiar datos de la tabla original a la temporal
                conn.execute(text("""
                    INSERT INTO repuesto_temp (
                        id, nombre, codigo, descripcion, stock, stock_minimo,
                        precio_compra, precio_venta, categoria, estado,
                        fecha_creacion, fecha_actualizacion
                    )
                    SELECT 
                        id, nombre, codigo, descripcion, stock, stock_minimo,
                        precio_compra, precio_venta, categoria, estado,
                        fecha_creacion, fecha_actualizacion
                    FROM repuesto
                """))
                
                # Eliminar tabla original
                conn.execute(text("DROP TABLE repuesto"))
                
                # Renombrar tabla temporal a original
                conn.execute(text("ALTER TABLE repuesto_temp RENAME TO repuesto"))
                
                conn.commit()
                print("Tabla repuesto recreada exitosamente con la estructura correcta")
            
        except Exception as e:
            print(f"Error durante la migración: {e}")
            raise

if __name__ == '__main__':
    migrate() 
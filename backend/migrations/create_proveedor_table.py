from backend.app import create_app
from backend.extensions import db
from sqlalchemy import text

app = create_app()

def migrate():
    with app.app_context():
        try:
            with db.engine.connect() as conn:
                # Crear tabla proveedor
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS proveedor (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        nombre TEXT NOT NULL,
                        contacto TEXT,
                        telefono TEXT,
                        email TEXT,
                        direccion TEXT,
                        estado TEXT DEFAULT 'activo',
                        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        notas TEXT
                    )
                """))
                
                # Crear algunos proveedores de ejemplo
                conn.execute(text("""
                    INSERT INTO proveedor (nombre, contacto, telefono, email, direccion, estado)
                    VALUES 
                    ('Distribuidor XYZ', 'Juan Pérez', '123-456-7890', 'juan@xyz.com', 'Calle Principal 123', 'activo'),
                    ('Auto Parts SA', 'María García', '987-654-3210', 'maria@autoparts.com', 'Av. Industrial 456', 'activo')
                """))
                
                conn.commit()
                print("Tabla proveedor creada exitosamente con datos de ejemplo")
            
        except Exception as e:
            print(f"Error durante la migración: {e}")
            raise

if __name__ == '__main__':
    migrate() 
from app import create_app
from models import db
from sqlalchemy import text

app = create_app()

def migrate():
    with app.app_context():
        try:
            # Agregar columna proveedor_id a la tabla repuesto
            with db.engine.connect() as conn:
                conn.execute(text("""
                    ALTER TABLE repuesto 
                    ADD COLUMN proveedor_id INTEGER 
                    REFERENCES proveedor(id)
                """))
                conn.commit()
            
            print("Columna proveedor_id agregada exitosamente a la tabla repuesto")
            
        except Exception as e:
            print(f"Error durante la migración: {e}")

if __name__ == '__main__':
    migrate() 
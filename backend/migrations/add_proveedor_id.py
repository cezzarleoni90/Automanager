from backend.app import create_app
from backend.models import db
from sqlalchemy import text, inspect

app = create_app()

def migrate():
    with app.app_context():
        try:
            # Verificar si la columna ya existe
            inspector = inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('repuesto')]
            
            if 'proveedor_id' not in columns:
                # Agregar columna proveedor_id a la tabla repuesto
                with db.engine.connect() as conn:
                    conn.execute(text("""
                        ALTER TABLE repuesto 
                        ADD COLUMN proveedor_id INTEGER 
                        REFERENCES proveedor(id)
                    """))
                    conn.commit()
                print("Columna proveedor_id agregada exitosamente a la tabla repuesto")
            else:
                print("La columna proveedor_id ya existe en la tabla repuesto")
            
        except Exception as e:
            print(f"Error durante la migración: {e}")
            raise

if __name__ == '__main__':
    migrate() 
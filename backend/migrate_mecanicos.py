from models import db, Mecanico
from app import create_app

def migrate_mecanicos():
    app = create_app()  # Crear la instancia de la app
    with app.app_context():
        # Verificar si la columna tarifa_hora ya existe
        try:
            # Intentar acceder a la columna
            test_mecanico = Mecanico.query.first()
            if test_mecanico:
                _ = test_mecanico.tarifa_hora
                print("✅ La columna tarifa_hora ya existe")
                return
        except Exception as e:
            print(f"La columna tarifa_hora no existe: {e}")
        
        # Agregar la columna tarifa_hora a la tabla mecanico
        with db.engine.connect() as conn:
            try:
                conn.execute(db.text("ALTER TABLE mecanico ADD COLUMN tarifa_hora FLOAT DEFAULT 0.0"))
                conn.commit()
                print("✅ Columna tarifa_hora agregada a la tabla mecanico")
            except Exception as e:
                print(f"❌ Error al agregar columna: {e}")
                # Si la columna ya existe, SQLite lanzará un error, pero podemos continuar
                if "duplicate column" in str(e).lower():
                    print("✅ La columna ya existía")
                else:
                    return
        
        # Actualizar mecánicos existentes con tarifa por defecto
        try:
            mecanicos = Mecanico.query.all()
            for mecanico in mecanicos:
                if not hasattr(mecanico, 'tarifa_hora') or mecanico.tarifa_hora is None:
                    mecanico.tarifa_hora = 25.0  # Tarifa por defecto
            db.session.commit()
            print(f"✅ {len(mecanicos)} mecánicos actualizados con tarifa por defecto")
        except Exception as e:
            print(f"❌ Error al actualizar mecánicos: {e}")
            db.session.rollback()

if __name__ == "__main__":
    migrate_mecanicos() 
import sqlite3
import logging
import os
from app import create_app
from models import HoraTrabajo, Mecanico, Servicio, db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('app')

def fix_horas_trabajo():
    """Corrige la estructura y datos de la tabla hora_trabajo."""
    app = create_app()
    with app.app_context():
        # Obtener la ruta de la base de datos
        db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        if not os.path.isabs(db_path):
            db_path = os.path.join(os.path.dirname(__file__), db_path)
        
        logger.info(f"📂 Usando base de datos: {db_path}")
        
        # Conectar directamente a la base de datos SQLite
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        try:
            # Verificar si la tabla existe
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='hora_trabajo'")
            if not cursor.fetchone():
                logger.error("❌ La tabla hora_trabajo no existe en la base de datos.")
                logger.info("🔄 Creando la tabla hora_trabajo...")
                
                # Crear la tabla desde cero
                cursor.execute('''
                CREATE TABLE hora_trabajo (
                    id INTEGER PRIMARY KEY,
                    mecanico_id INTEGER NOT NULL,
                    fecha DATE NOT NULL,
                    horas_trabajadas REAL NOT NULL,
                    tipo_trabajo VARCHAR(50),
                    servicio_id INTEGER,
                    notas TEXT,
                    FOREIGN KEY(mecanico_id) REFERENCES mecanico(id),
                    FOREIGN KEY(servicio_id) REFERENCES servicio(id)
                )
                ''')
                conn.commit()
                logger.info("✅ Tabla hora_trabajo creada correctamente")
                return True
            
            # Obtener información sobre la estructura actual
            cursor.execute("PRAGMA table_info(hora_trabajo)")
            columns = cursor.fetchall()
            column_names = [col[1] for col in columns]
            
            logger.info(f"📋 Estructura actual de la tabla hora_trabajo:")
            for col in columns:
                logger.info(f"  - {col[1]}: {col[2]}")
            
            # Verificar y corregir campo horas_trabajadas
            if 'horas_trabajadas' not in column_names:
                logger.warning("❌ El campo horas_trabajadas NO existe en la tabla")
                
                # Verificar si existe un campo horas en su lugar
                if 'horas' in column_names:
                    logger.info("ℹ️ El campo horas existe en la tabla en lugar de horas_trabajadas")
                    
                    try:
                        logger.info("🔄 Intentando agregar un campo horas_trabajadas...")
                        cursor.execute("ALTER TABLE hora_trabajo ADD COLUMN horas_trabajadas REAL DEFAULT 0.0")
                        logger.info("✅ Campo horas_trabajadas agregado exitosamente")
                        
                        # Migrar datos de horas a horas_trabajadas
                        logger.info("🔄 Migrando datos de 'horas' a 'horas_trabajadas'...")
                        cursor.execute("UPDATE hora_trabajo SET horas_trabajadas = horas")
                        conn.commit()
                        logger.info(f"✅ Se actualizaron {cursor.rowcount} registros")
                        
                    except sqlite3.Error as e:
                        logger.error(f"❌ Error al modificar la tabla: {e}")
                        conn.rollback()
                else:
                    # Si no existe ninguno de los dos campos, crear horas_trabajadas
                    try:
                        logger.info("🔄 Intentando agregar el campo horas_trabajadas...")
                        cursor.execute("ALTER TABLE hora_trabajo ADD COLUMN horas_trabajadas REAL DEFAULT 0.0")
                        conn.commit()
                        logger.info("✅ Campo horas_trabajadas agregado exitosamente")
                    except sqlite3.Error as e:
                        logger.error(f"❌ Error al agregar el campo horas_trabajadas: {e}")
                        conn.rollback()
            
            # Verificar y corregir campo notas
            if 'notas' not in column_names:
                logger.warning("❌ El campo notas NO existe en la tabla")
                
                # Verificar si existe un campo descripcion en su lugar
                if 'descripcion' in column_names:
                    logger.info("ℹ️ El campo descripcion existe en la tabla en lugar de notas")
                    
                    try:
                        logger.info("🔄 Intentando agregar un campo notas...")
                        cursor.execute("ALTER TABLE hora_trabajo ADD COLUMN notas TEXT")
                        logger.info("✅ Campo notas agregado exitosamente")
                        
                        # Migrar datos de descripcion a notas
                        logger.info("🔄 Migrando datos de 'descripcion' a 'notas'...")
                        cursor.execute("UPDATE hora_trabajo SET notas = descripcion")
                        conn.commit()
                        logger.info(f"✅ Se actualizaron {cursor.rowcount} registros")
                        
                    except sqlite3.Error as e:
                        logger.error(f"❌ Error al modificar la tabla: {e}")
                        conn.rollback()
                else:
                    # Si no existe ninguno de los dos campos, crear notas
                    try:
                        logger.info("🔄 Intentando agregar el campo notas...")
                        cursor.execute("ALTER TABLE hora_trabajo ADD COLUMN notas TEXT")
                        conn.commit()
                        logger.info("✅ Campo notas agregado exitosamente")
                    except sqlite3.Error as e:
                        logger.error(f"❌ Error al agregar el campo notas: {e}")
                        conn.rollback()
            
            # Verificar y agregar el campo tipo_trabajo si no existe
            if 'tipo_trabajo' not in column_names:
                logger.warning("❌ El campo tipo_trabajo NO existe en la tabla")
                try:
                    logger.info("🔄 Intentando agregar el campo tipo_trabajo...")
                    cursor.execute("ALTER TABLE hora_trabajo ADD COLUMN tipo_trabajo VARCHAR(50) DEFAULT 'general'")
                    conn.commit()
                    logger.info("✅ Campo tipo_trabajo agregado exitosamente")
                except sqlite3.Error as e:
                    logger.error(f"❌ Error al agregar el campo tipo_trabajo: {e}")
                    conn.rollback()
            
            # Mostrar la estructura actualizada
            cursor.execute("PRAGMA table_info(hora_trabajo)")
            columns = cursor.fetchall()
            logger.info(f"📋 Estructura final de la tabla hora_trabajo:")
            for col in columns:
                logger.info(f"  - {col[1]}: {col[2]}")
            
            # Verificar datos
            cursor.execute("SELECT COUNT(*) FROM hora_trabajo")
            count = cursor.fetchone()[0]
            logger.info(f"✅ La tabla tiene {count} registros de horas de trabajo")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error general: {str(e)}")
            conn.rollback()
            return False
        finally:
            conn.close()

def crear_registro_prueba():
    """Crea un registro de prueba en la tabla HoraTrabajo si no hay ninguno."""
    app = create_app()
    with app.app_context():
        try:
            # Verificar si hay registros
            count = HoraTrabajo.query.count()
            if count == 0:
                # Buscar un mecánico y un servicio para asociar
                mecanico = Mecanico.query.first()
                servicio = Servicio.query.first()
                
                if mecanico and servicio:
                    logger.info(f"🔄 Creando registro de prueba para mecánico: {mecanico.nombre} {mecanico.apellido}")
                    
                    # Crear hora de trabajo
                    from datetime import datetime
                    hora = HoraTrabajo(
                        mecanico_id=mecanico.id,
                        servicio_id=servicio.id,
                        fecha=datetime.now().date(),
                        horas_trabajadas=2.5,
                        tipo_trabajo="prueba",
                        notas="Registro de prueba creado por script de migración"
                    )
                    
                    db.session.add(hora)
                    db.session.commit()
                    
                    logger.info(f"✅ Registro de prueba creado exitosamente con ID: {hora.id}")
                else:
                    logger.warning("⚠️ No se encontraron mecánicos o servicios para crear el registro de prueba")
            else:
                logger.info(f"✅ Ya existen {count} registros de horas de trabajo")
            
            return True
        except Exception as e:
            logger.error(f"❌ Error al crear registro de prueba: {str(e)}")
            db.session.rollback()
            return False

if __name__ == "__main__":
    logger.info("🔧 Iniciando corrección de la tabla hora_trabajo...")
    if fix_horas_trabajo():
        logger.info("✅ Corrección de la estructura completada")
        if crear_registro_prueba():
            logger.info("✅ Registro de prueba creado o verificado")
        logger.info("✅ Proceso completado exitosamente")
    else:
        logger.error("❌ No se pudo completar la corrección de la tabla hora_trabajo") 
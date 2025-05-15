from models import db, Mecanico, HoraTrabajo, Servicio
from app import create_app
import sqlite3
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('app')

def verify_migration():
    app = create_app()
    with app.app_context():
        # Verificar estructura de la tabla
        conn = sqlite3.connect('automanager.db')
        cursor = conn.cursor()
        
        cursor.execute("PRAGMA table_info(mecanico)")
        columns = cursor.fetchall()
        
        print("📋 Estructura de la tabla mecanico:")
        for column in columns:
            print(f"  - {column[1]} ({column[2]})")
        
        # Verificar si tarifa_hora existe
        has_tarifa_hora = any(col[1] == 'tarifa_hora' for col in columns)
        
        if has_tarifa_hora:
            print("✅ La columna tarifa_hora existe")
            
            # Verificar mecánicos existentes
            mecanicos = Mecanico.query.all()
            print(f"\n👥 Mecánicos encontrados: {len(mecanicos)}")
            
            for mecanico in mecanicos:
                tarifa = getattr(mecanico, 'tarifa_hora', 0)
                print(f"  - {mecanico.nombre} {mecanico.apellido}: ${tarifa}/hora")
        else:
            print("❌ La columna tarifa_hora NO existe")
        
        conn.close()

def verificar_campo_horas_trabajo():
    """Verifica que la estructura del modelo HoraTrabajo coincida con la tabla en la base de datos."""
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
        
        # Obtener información sobre la tabla hora_trabajo
        cursor.execute("PRAGMA table_info(hora_trabajo)")
        columns = cursor.fetchall()
        
        if not columns:
            logger.error("❌ La tabla hora_trabajo no existe en la base de datos.")
            return False
        
        # Verificar que exista el campo horas_trabajadas
        column_names = [col[1] for col in columns]
        logger.info(f"📋 Estructura actual de la tabla hora_trabajo:")
        for col in columns:
            logger.info(f"  - {col[1]}: {col[2]}")
        
        if 'horas_trabajadas' in column_names:
            logger.info("✅ El campo horas_trabajadas existe en la tabla")
        else:
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
        
        # Verificar que exista el campo notas
        if 'notas' in column_names:
            logger.info("✅ El campo notas existe en la tabla")
        else:
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
        
        # Cerrar conexión
        conn.close()
        
        return True

def verificar_relaciones_hora_trabajo():
    """Verifica que las relaciones del modelo HoraTrabajo funcionen correctamente."""
    app = create_app()
    with app.app_context():
        try:
            # Obtener el primer mecánico
            mecanico = Mecanico.query.first()
            if mecanico:
                logger.info(f"✅ Mecánico encontrado: {mecanico.nombre} {mecanico.apellido}")
                horas = HoraTrabajo.query.filter_by(mecanico_id=mecanico.id).first()
                if horas:
                    logger.info(f"✅ Relación mecanico -> horas_trabajo funciona correctamente")
                    logger.info(f"   Horas trabajadas: {getattr(horas, 'horas_trabajadas', getattr(horas, 'horas', 'N/A'))}")
                else:
                    logger.warning("⚠️ No se encontraron horas de trabajo para este mecánico")
            else:
                logger.warning("⚠️ No se encontraron mecánicos en la base de datos")
            
            # Obtener el primer servicio
            servicio = Servicio.query.first()
            if servicio:
                logger.info(f"✅ Servicio encontrado: {servicio.tipo_servicio}")
                horas = HoraTrabajo.query.filter_by(servicio_id=servicio.id).first()
                if horas:
                    logger.info(f"✅ Relación servicio -> horas_trabajo funciona correctamente")
                else:
                    logger.warning("⚠️ No se encontraron horas de trabajo para este servicio")
            else:
                logger.warning("⚠️ No se encontraron servicios en la base de datos")
            
            return True
        except Exception as e:
            logger.error(f"❌ Error al verificar relaciones: {str(e)}")
            return False

def verificar_hora_trabajo():
    """Función principal para ejecutar todas las verificaciones."""
    campo_ok = verificar_campo_horas_trabajo()
    relaciones_ok = verificar_relaciones_hora_trabajo()
    
    if campo_ok and relaciones_ok:
        logger.info("✅ Verificación completa de horas_trabajo finalizada exitosamente")
    else:
        logger.warning("⚠️ Se encontraron problemas en la verificación de horas_trabajo")
    
if __name__ == "__main__":
    verify_migration()
    verificar_hora_trabajo() 
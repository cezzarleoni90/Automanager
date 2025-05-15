from app import create_app
from models import db, Servicio, HistorialEstado
from datetime import datetime

def fix_servicio_model():
    app = create_app()
    
    with app.app_context():
        # Obtener el código fuente actual del método
        print(f"Método original registrar_cambio_estado:")
        print(Servicio.registrar_cambio_estado.__code__)
        
        # Crear una nueva versión del método registrar_cambio_estado
        def new_method(self, nuevo_estado, comentario):
            if not hasattr(self, 'id') or self.id is None:
                # Si el servicio aún no tiene ID, esperar hasta después de flush/commit
                self.estado = nuevo_estado
                return
                
            if nuevo_estado not in self.ESTADOS:
                raise ValueError(f"Estado inválido: {nuevo_estado}")
                
            historial = HistorialEstado(
                servicio_id=self.id,
                estado_anterior=self.estado,
                estado_nuevo=nuevo_estado,
                comentario=comentario,
                fecha=datetime.utcnow()
            )
            self.estado = nuevo_estado
            db.session.add(historial)
            
            # Actualizar fechas según el estado
            if nuevo_estado == 'completado':
                self.fecha_fin = datetime.utcnow()
            elif nuevo_estado == 'aprobado':
                self.fecha_aprobacion_cliente = datetime.utcnow()
        
        # Reemplazar el método
        Servicio.registrar_cambio_estado = new_method
        
        print("✅ Método registrar_cambio_estado actualizado")
        
        # Verificar que funciona creando un servicio
        try:
            # Intentar crear un servicio de prueba para el diagnóstico
            print("\nProbando creación de servicio...")
            servicio = Servicio(
                tipo_servicio="Prueba",
                descripcion="Servicio de diagnóstico",
                estado="pendiente",
                vehiculo_id=1,
                cliente_id=1,
                usuario_id=1,
                fecha_inicio=datetime.utcnow()
            )
            db.session.add(servicio)
            db.session.commit()
            print(f"✅ Servicio creado exitosamente con ID: {servicio.id}")
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error al crear servicio: {e}")
            
            # Sugerir solución
            print("\n🔧 Recomendación: Reiniciar el servidor para que los cambios surtan efecto.")
            print("   O considerar recrear la base de datos con: python recreate_database.py")

if __name__ == "__main__":
    fix_servicio_model() 
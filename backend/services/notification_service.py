from backend.models import db, Notificacion, Usuario
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from sqlalchemy import and_, or_
from backend.utils.logger import log_activity, metrics, measure_time
import json

class NotificationService:
    def __init__(self):
        self.notification_types = {
            'stock_bajo': {
                'title': 'Stock Bajo',
                'priority': 'high',
                'icon': 'warning'
            },
            'stock_critico': {
                'title': 'Stock Crítico',
                'priority': 'urgent',
                'icon': 'error'
            },
            'sync_error': {
                'title': 'Error de Sincronización',
                'priority': 'high',
                'icon': 'sync_problem'
            },
            'sync_success': {
                'title': 'Sincronización Exitosa',
                'priority': 'normal',
                'icon': 'check_circle'
            },
            'precio_actualizado': {
                'title': 'Precio Actualizado',
                'priority': 'normal',
                'icon': 'attach_money'
            }
        }
    
    @measure_time('create_notification')
    def create_notification(
        self,
        tipo: str,
        mensaje: str,
        usuario_id: Optional[int] = None,
        datos: Optional[Dict] = None
    ) -> Dict:
        """Crea una nueva notificación"""
        try:
            if tipo not in self.notification_types:
                raise ValueError(f"Tipo de notificación no válido: {tipo}")
            
            notificacion = Notificacion(
                tipo=tipo,
                mensaje=mensaje,
                usuario_id=usuario_id,
                datos=json.dumps(datos) if datos else None,
                fecha_creacion=datetime.utcnow(),
                leida=False,
                prioridad=self.notification_types[tipo]['priority']
            )
            
            db.session.add(notificacion)
            db.session.commit()
            
            # Registrar actividad
            log_activity(
                'notification_created',
                f"Nueva notificación creada: {tipo}",
                {
                    'tipo': tipo,
                    'usuario_id': usuario_id,
                    'datos': datos
                }
            )
            
            # Actualizar métricas
            metrics.increment('notifications_total', 1, {'tipo': tipo})
            
            return {
                'status': 'success',
                'data': {
                    'id': notificacion.id,
                    'tipo': notificacion.tipo,
                    'mensaje': notificacion.mensaje,
                    'fecha': notificacion.fecha_creacion.isoformat()
                }
            }
            
        except Exception as e:
            log_activity('notification_error', f"Error creando notificación: {str(e)}")
            raise ValueError(f"Error creando notificación: {str(e)}")
    
    @measure_time('get_notifications')
    def get_notifications(
        self,
        usuario_id: Optional[int] = None,
        tipo: Optional[str] = None,
        leida: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict:
        """Obtiene notificaciones con filtros"""
        try:
            query = Notificacion.query
            
            if usuario_id:
                query = query.filter(Notificacion.usuario_id == usuario_id)
            if tipo:
                query = query.filter(Notificacion.tipo == tipo)
            if leida is not None:
                query = query.filter(Notificacion.leida == leida)
            
            total = query.count()
            notificaciones = query.order_by(
                Notificacion.fecha_creacion.desc()
            ).offset(offset).limit(limit).all()
            
            return {
                'status': 'success',
                'data': {
                    'total': total,
                    'notificaciones': [{
                        'id': n.id,
                        'tipo': n.tipo,
                        'mensaje': n.mensaje,
                        'datos': json.loads(n.datos) if n.datos else None,
                        'fecha': n.fecha_creacion.isoformat(),
                        'leida': n.leida
                    } for n in notificaciones]
                }
            }
            
        except Exception as e:
            log_activity('notification_error', f"Error obteniendo notificaciones: {str(e)}")
            raise ValueError(f"Error obteniendo notificaciones: {str(e)}")
    
    @measure_time('mark_as_read')
    def mark_as_read(
        self,
        notificacion_id: Optional[int] = None,
        usuario_id: Optional[int] = None,
        todas: bool = False
    ) -> Dict:
        """Marca notificaciones como leídas"""
        try:
            query = Notificacion.query.filter(Notificacion.leida == False)
            
            if notificacion_id:
                query = query.filter(Notificacion.id == notificacion_id)
            if usuario_id:
                query = query.filter(Notificacion.usuario_id == usuario_id)
            
            if not todas and not notificacion_id:
                raise ValueError("Se requiere notificacion_id o todas=True")
            
            notificaciones = query.all()
            for n in notificaciones:
                n.leida = True
                n.fecha_lectura = datetime.utcnow()
            
            db.session.commit()
            
            # Actualizar métricas
            metrics.increment('notifications_read', 1, {'tipo': notificaciones[0].tipo})
            
            return {
                'status': 'success',
                'data': {
                    'actualizadas': len(notificaciones)
                }
            }
            
        except Exception as e:
            log_activity('notification_error', f"Error marcando notificaciones: {str(e)}")
            raise ValueError(f"Error marcando notificaciones: {str(e)}")
    
    @measure_time('delete_old_notifications')
    def delete_old_notifications(self, dias: int = 30) -> Dict:
        """Elimina notificaciones antiguas"""
        try:
            fecha_limite = datetime.utcnow() - timedelta(days=dias)
            
            # Eliminar notificaciones leídas antiguas
            eliminadas = Notificacion.query.filter(
                and_(
                    Notificacion.leida == True,
                    Notificacion.fecha_creacion < fecha_limite
                )
            ).delete()
            
            db.session.commit()
            
            # Actualizar métricas
            metrics.increment('notifications_bulk_read', eliminadas)
            
            return {
                'status': 'success',
                'data': {
                    'eliminadas': eliminadas
                }
            }
            
        except Exception as e:
            log_activity('notification_error', f"Error eliminando notificaciones: {str(e)}")
            raise ValueError(f"Error eliminando notificaciones: {str(e)}")
    
    @measure_time('get_unread_count')
    def get_unread_count(self, usuario_id: Optional[int] = None) -> Dict:
        """Obtiene el conteo de notificaciones no leídas"""
        try:
            query = Notificacion.query.filter(Notificacion.leida == False)
            
            if usuario_id:
                query = query.filter(Notificacion.usuario_id == usuario_id)
            
            total = query.count()
            
            return {
                'status': 'success',
                'data': {
                    'total': total
                }
            }
            
        except Exception as e:
            log_activity('notification_error', f"Error contando notificaciones: {str(e)}")
            raise ValueError(f"Error contando notificaciones: {str(e)}")
    
    def get_user_notifications(
        self,
        usuario_id: int,
        no_leidas: bool = False,
        limit: int = 50
    ) -> List[Notificacion]:
        """Obtiene las notificaciones de un usuario"""
        query = Notificacion.query.filter_by(usuario_id=usuario_id)
        
        if no_leidas:
            query = query.filter_by(leida=False)
        
        return query.order_by(Notificacion.fecha_creacion.desc()).limit(limit).all()
    
    def mark_all_as_read(self, usuario_id: int) -> int:
        """Marca todas las notificaciones de un usuario como leídas"""
        try:
            result = Notificacion.query.filter_by(
                usuario_id=usuario_id,
                leida=False
            ).update({
                'leida': True,
                'fecha_lectura': datetime.utcnow()
            })
            
            db.session.commit()
            
            # Actualizar métricas
            metrics.increment('notifications_bulk_read', result)
            
            return result
            
        except Exception as e:
            log_activity('notification_error', f"Error marcando notificaciones como leídas: {str(e)}")
            return 0
    
    def delete_notification(self, notification_id: int, usuario_id: int) -> bool:
        """Elimina una notificación"""
        try:
            notification = Notificacion.query.filter_by(
                id=notification_id,
                usuario_id=usuario_id
            ).first()
            
            if not notification:
                return False
            
            db.session.delete(notification)
            db.session.commit()
            
            # Actualizar métricas
            metrics.increment('notifications_deleted', 1, {'tipo': notification.tipo})
            
            return True
            
        except Exception as e:
            log_activity('notification_error', f"Error eliminando notificación: {str(e)}")
            return False 
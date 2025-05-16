from models import db, Usuario, Repuesto, MovimientoInventario, Proveedor
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from sqlalchemy import func, and_, desc
from utils.logger import log_activity, metrics, measure_time
import psutil
import json

class MetricsService:
    @measure_time('get_system_metrics')
    def get_system_metrics(self) -> Dict:
        """Obtiene métricas del sistema"""
        try:
            # CPU
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            # Memoria
            memory = psutil.virtual_memory()
            
            # Disco
            disk = psutil.disk_usage('/')
            
            # Red
            net_io = psutil.net_io_counters()
            
            return {
                'status': 'success',
                'data': {
                    'cpu': {
                        'percent': cpu_percent,
                        'cores': cpu_count
                    },
                    'memory': {
                        'total': memory.total,
                        'available': memory.available,
                        'percent': memory.percent
                    },
                    'disk': {
                        'total': disk.total,
                        'used': disk.used,
                        'free': disk.free,
                        'percent': disk.percent
                    },
                    'network': {
                        'bytes_sent': net_io.bytes_sent,
                        'bytes_recv': net_io.bytes_recv,
                        'packets_sent': net_io.packets_sent,
                        'packets_recv': net_io.packets_recv
                    }
                }
            }
            
        except Exception as e:
            log_activity('metrics_error', f"Error obteniendo métricas del sistema: {str(e)}")
            raise ValueError(f"Error obteniendo métricas del sistema: {str(e)}")
    
    @measure_time('get_business_metrics')
    def get_business_metrics(
        self,
        fecha_inicio: Optional[datetime] = None,
        fecha_fin: Optional[datetime] = None
    ) -> Dict:
        """Obtiene métricas de negocio"""
        try:
            if not fecha_inicio:
                fecha_inicio = datetime.utcnow() - timedelta(days=30)
            if not fecha_fin:
                fecha_fin = datetime.utcnow()
            
            # Total de repuestos
            total_repuestos = Repuesto.query.count()
            
            # Repuestos con stock bajo
            stock_bajo = Repuesto.query.filter(
                Repuesto.stock_actual <= Repuesto.stock_minimo
            ).count()
            
            # Movimientos por tipo
            movimientos = db.session.query(
                MovimientoInventario.tipo,
                func.count(MovimientoInventario.id).label('total'),
                func.sum(MovimientoInventario.cantidad).label('cantidad_total'),
                func.sum(MovimientoInventario.cantidad * MovimientoInventario.precio_unitario).label('valor_total')
            ).filter(
                MovimientoInventario.fecha.between(fecha_inicio, fecha_fin)
            ).group_by(
                MovimientoInventario.tipo
            ).all()
            
            # Proveedores activos
            proveedores_activos = Proveedor.query.filter_by(activo=True).count()
            
            # Valor total del inventario
            valor_inventario = db.session.query(
                func.sum(Repuesto.stock_actual * Repuesto.precio_compra)
            ).scalar() or 0
            
            return {
                'status': 'success',
                'data': {
                    'periodo': {
                        'inicio': fecha_inicio.isoformat(),
                        'fin': fecha_fin.isoformat()
                    },
                    'inventario': {
                        'total_repuestos': total_repuestos,
                        'stock_bajo': stock_bajo,
                        'valor_total': valor_inventario
                    },
                    'movimientos': [{
                        'tipo': m.tipo,
                        'total': m.total,
                        'cantidad_total': m.cantidad_total,
                        'valor_total': m.valor_total
                    } for m in movimientos],
                    'proveedores': {
                        'activos': proveedores_activos
                    }
                }
            }
            
        except Exception as e:
            log_activity('metrics_error', f"Error obteniendo métricas de negocio: {str(e)}")
            raise ValueError(f"Error obteniendo métricas de negocio: {str(e)}")
    
    @measure_time('get_user_metrics')
    def get_user_metrics(
        self,
        usuario_id: Optional[int] = None,
        fecha_inicio: Optional[datetime] = None,
        fecha_fin: Optional[datetime] = None
    ) -> Dict:
        """Obtiene métricas de usuario"""
        try:
            if not fecha_inicio:
                fecha_inicio = datetime.utcnow() - timedelta(days=30)
            if not fecha_fin:
                fecha_fin = datetime.utcnow()
            
            # Actividad de usuario
            query = db.session.query(
                func.date(MovimientoInventario.fecha).label('fecha'),
                func.count(MovimientoInventario.id).label('total_movimientos'),
                func.sum(MovimientoInventario.cantidad).label('cantidad_total')
            ).filter(
                MovimientoInventario.fecha.between(fecha_inicio, fecha_fin)
            )
            
            if usuario_id:
                query = query.filter(MovimientoInventario.usuario_id == usuario_id)
            
            actividad = query.group_by(
                func.date(MovimientoInventario.fecha)
            ).order_by(
                func.date(MovimientoInventario.fecha)
            ).all()
            
            return {
                'status': 'success',
                'data': {
                    'periodo': {
                        'inicio': fecha_inicio.isoformat(),
                        'fin': fecha_fin.isoformat()
                    },
                    'actividad': [{
                        'fecha': a.fecha.isoformat(),
                        'total_movimientos': a.total_movimientos,
                        'cantidad_total': a.cantidad_total
                    } for a in actividad]
                }
            }
            
        except Exception as e:
            log_activity('metrics_error', f"Error obteniendo métricas de usuario: {str(e)}")
            raise ValueError(f"Error obteniendo métricas de usuario: {str(e)}")
    
    @measure_time('get_performance_metrics')
    def get_performance_metrics(self) -> Dict:
        """Obtiene métricas de rendimiento"""
        try:
            # Obtener métricas del logger
            performance_metrics = metrics.get_all()
            
            # Agregar métricas de base de datos
            db_metrics = {
                'total_queries': db.session.query(func.count('*')).scalar(),
                'active_connections': db.engine.pool.size(),
                'available_connections': db.engine.pool.checkedin()
            }
            
            return {
                'status': 'success',
                'data': {
                    'performance': performance_metrics,
                    'database': db_metrics
                }
            }
            
        except Exception as e:
            log_activity('metrics_error', f"Error obteniendo métricas de rendimiento: {str(e)}")
            raise ValueError(f"Error obteniendo métricas de rendimiento: {str(e)}") 
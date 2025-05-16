from models import db, Repuesto, MovimientoInventario, Proveedor
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from sqlalchemy import func, and_, desc
from utils.logger import log_activity, metrics, measure_time
import pandas as pd
import json

class ReportService:
    @measure_time('report_inventory_value')
    def get_inventory_value_report(self, fecha_inicio: Optional[datetime] = None, fecha_fin: Optional[datetime] = None) -> Dict:
        """Genera reporte del valor total del inventario"""
        try:
            query = db.session.query(
                Repuesto.codigo,
                Repuesto.nombre,
                Repuesto.stock_actual,
                Repuesto.precio_compra,
                Repuesto.precio_venta,
                func.sum(Repuesto.stock_actual * Repuesto.precio_compra).label('valor_total')
            ).group_by(Repuesto.id)
            
            if fecha_inicio and fecha_fin:
                query = query.filter(
                    Repuesto.fecha_actualizacion.between(fecha_inicio, fecha_fin)
                )
            
            resultados = query.all()
            
            total_valor = sum(r.valor_total for r in resultados)
            
            return {
                'status': 'success',
                'data': {
                    'total_valor': total_valor,
                    'items': [{
                        'codigo': r.codigo,
                        'nombre': r.nombre,
                        'stock': r.stock_actual,
                        'precio_compra': r.precio_compra,
                        'precio_venta': r.precio_venta,
                        'valor_total': r.valor_total
                    } for r in resultados]
                }
            }
            
        except Exception as e:
            log_activity('report_error', f"Error generando reporte de valor: {str(e)}")
            raise ValueError(f"Error generando reporte: {str(e)}")
    
    @measure_time('report_movements')
    def get_movements_report(
        self,
        tipo: Optional[str] = None,
        fecha_inicio: Optional[datetime] = None,
        fecha_fin: Optional[datetime] = None
    ) -> Dict:
        """Genera reporte de movimientos de inventario"""
        try:
            query = db.session.query(
                MovimientoInventario,
                Repuesto.codigo,
                Repuesto.nombre,
                Proveedor.nombre.label('proveedor_nombre')
            ).join(
                Repuesto,
                MovimientoInventario.repuesto_id == Repuesto.id
            ).outerjoin(
                Proveedor,
                MovimientoInventario.proveedor_id == Proveedor.id
            )
            
            if tipo:
                query = query.filter(MovimientoInventario.tipo == tipo)
            
            if fecha_inicio and fecha_fin:
                query = query.filter(
                    MovimientoInventario.fecha.between(fecha_inicio, fecha_fin)
                )
            
            resultados = query.order_by(desc(MovimientoInventario.fecha)).all()
            
            return {
                'status': 'success',
                'data': [{
                    'id': r.MovimientoInventario.id,
                    'fecha': r.MovimientoInventario.fecha.isoformat(),
                    'tipo': r.MovimientoInventario.tipo,
                    'cantidad': r.MovimientoInventario.cantidad,
                    'precio_unitario': r.MovimientoInventario.precio_unitario,
                    'repuesto_codigo': r.codigo,
                    'repuesto_nombre': r.nombre,
                    'proveedor': r.proveedor_nombre
                } for r in resultados]
            }
            
        except Exception as e:
            log_activity('report_error', f"Error generando reporte de movimientos: {str(e)}")
            raise ValueError(f"Error generando reporte: {str(e)}")
    
    @measure_time('report_stock_alerts')
    def get_stock_alerts_report(self) -> Dict:
        """Genera reporte de alertas de stock"""
        try:
            resultados = db.session.query(
                Repuesto.codigo,
                Repuesto.nombre,
                Repuesto.stock_actual,
                Repuesto.stock_minimo,
                Proveedor.nombre.label('proveedor_nombre')
            ).outerjoin(
                Proveedor,
                Repuesto.proveedor_id == Proveedor.id
            ).filter(
                Repuesto.stock_actual <= Repuesto.stock_minimo
            ).all()
            
            return {
                'status': 'success',
                'data': [{
                    'codigo': r.codigo,
                    'nombre': r.nombre,
                    'stock_actual': r.stock_actual,
                    'stock_minimo': r.stock_minimo,
                    'proveedor': r.proveedor_nombre,
                    'estado': 'crítico' if r.stock_actual == 0 else 'bajo'
                } for r in resultados]
            }
            
        except Exception as e:
            log_activity('report_error', f"Error generando reporte de alertas: {str(e)}")
            raise ValueError(f"Error generando reporte: {str(e)}")
    
    @measure_time('report_turnover')
    def get_turnover_report(
        self,
        fecha_inicio: Optional[datetime] = None,
        fecha_fin: Optional[datetime] = None
    ) -> Dict:
        """Genera reporte de rotación de inventario"""
        try:
            if not fecha_inicio:
                fecha_inicio = datetime.utcnow() - timedelta(days=30)
            if not fecha_fin:
                fecha_fin = datetime.utcnow()
            
            # Calcular rotación por repuesto
            resultados = db.session.query(
                Repuesto.codigo,
                Repuesto.nombre,
                func.sum(
                    case(
                        (MovimientoInventario.tipo == 'salida', MovimientoInventario.cantidad),
                        else_=0
                    )
                ).label('unidades_vendidas'),
                func.avg(Repuesto.stock_actual).label('stock_promedio')
            ).join(
                MovimientoInventario,
                Repuesto.id == MovimientoInventario.repuesto_id
            ).filter(
                MovimientoInventario.fecha.between(fecha_inicio, fecha_fin)
            ).group_by(
                Repuesto.id
            ).all()
            
            # Calcular días del período
            dias_periodo = (fecha_fin - fecha_inicio).days
            
            return {
                'status': 'success',
                'data': {
                    'periodo': {
                        'inicio': fecha_inicio.isoformat(),
                        'fin': fecha_fin.isoformat(),
                        'dias': dias_periodo
                    },
                    'items': [{
                        'codigo': r.codigo,
                        'nombre': r.nombre,
                        'unidades_vendidas': r.unidades_vendidas or 0,
                        'stock_promedio': r.stock_promedio or 0,
                        'rotacion': (r.unidades_vendidas or 0) / (r.stock_promedio or 1) * (365 / dias_periodo)
                    } for r in resultados]
                }
            }
            
        except Exception as e:
            log_activity('report_error', f"Error generando reporte de rotación: {str(e)}")
            raise ValueError(f"Error generando reporte: {str(e)}")
    
    @measure_time('report_export')
    def export_report(self, report_data: Dict, format: str = 'csv') -> bytes:
        """Exporta un reporte en el formato especificado"""
        try:
            df = pd.DataFrame(report_data['data'])
            
            if format == 'csv':
                return df.to_csv(index=False).encode('utf-8')
            elif format == 'excel':
                output = BytesIO()
                df.to_excel(output, index=False)
                return output.getvalue()
            else:
                raise ValueError(f"Formato no soportado: {format}")
                
        except Exception as e:
            log_activity('report_error', f"Error exportando reporte: {str(e)}")
            raise ValueError(f"Error exportando reporte: {str(e)}") 
from celery import shared_task
from backend.utils.logger import log_activity
from backend.models import Servicio, Factura, Repuesto, MovimientoInventario, Proveedor
from backend.extensions import db
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from backend.utils.cache import cache_with_args
import pandas as pd
import os
import io

@shared_task(name='tasks.generate_inventory_report')
def generate_inventory_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    format: str = 'xlsx'
) -> Dict:
    """Genera reporte de inventario"""
    try:
        # Convertir fechas
        start = datetime.fromisoformat(start_date) if start_date else datetime.now() - timedelta(days=30)
        end = datetime.fromisoformat(end_date) if end_date else datetime.now()
        
        # Obtener datos
        query = MovimientoInventario.query.filter(
            MovimientoInventario.fecha.between(start, end)
        ).order_by(MovimientoInventario.fecha)
        
        # Convertir a DataFrame
        data = []
        for movement in query:
            data.append({
                'fecha': movement.fecha,
                'tipo': movement.tipo,
                'repuesto': movement.repuesto.nombre,
                'cantidad': movement.cantidad,
                'precio': movement.precio,
                'total': movement.cantidad * movement.precio
            })
        
        df = pd.DataFrame(data)
        
        # Generar reporte
        report_dir = os.path.join(os.getcwd(), 'reports')
        os.makedirs(report_dir, exist_ok=True)
        
        filename = f"inventory_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{format}"
        filepath = os.path.join(report_dir, filename)
        
        if format == 'xlsx':
            df.to_excel(filepath, index=False)
        else:
            df.to_csv(filepath, index=False)
        
        log_activity(
            'report_generation',
            f"Reporte de inventario generado: {filename}"
        )
        
        return {
            'status': 'success',
            'message': 'Reporte generado',
            'file': filename
        }
        
    except Exception as e:
        log_activity('report_error', f"Error generando reporte: {str(e)}")
        raise

@shared_task(name='tasks.generate_supplier_report')
def generate_supplier_report(supplier_id: Optional[int] = None) -> Dict:
    """Genera reporte de proveedores"""
    try:
        # Obtener datos
        query = Repuesto.query
        if supplier_id:
            query = query.filter(Repuesto.proveedor_id == supplier_id)
        
        # Convertir a DataFrame
        data = []
        for part in query:
            data.append({
                'proveedor': part.proveedor.nombre if part.proveedor else 'N/A',
                'codigo': part.codigo,
                'nombre': part.nombre,
                'categoria': part.categoria,
                'stock': part.stock,
                'stock_minimo': part.stock_minimo,
                'precio': part.precio
            })
        
        df = pd.DataFrame(data)
        
        # Generar reporte
        report_dir = os.path.join(os.getcwd(), 'reports')
        os.makedirs(report_dir, exist_ok=True)
        
        filename = f"supplier_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        filepath = os.path.join(report_dir, filename)
        
        df.to_excel(filepath, index=False)
        
        log_activity(
            'report_generation',
            f"Reporte de proveedores generado: {filename}"
        )
        
        return {
            'status': 'success',
            'message': 'Reporte generado',
            'file': filename
        }
        
    except Exception as e:
        log_activity('report_error', f"Error generando reporte: {str(e)}")
        raise

@shared_task(name='tasks.generate_stock_alerts_report')
def generate_stock_alerts_report() -> Dict:
    """Genera reporte de alertas de stock"""
    try:
        # Obtener repuestos con stock bajo
        low_stock = Repuesto.query.filter(
            Repuesto.stock <= Repuesto.stock_minimo
        ).all()
        
        # Convertir a DataFrame
        data = []
        for part in low_stock:
            data.append({
                'codigo': part.codigo,
                'nombre': part.nombre,
                'categoria': part.categoria,
                'stock_actual': part.stock,
                'stock_minimo': part.stock_minimo,
                'diferencia': part.stock_minimo - part.stock,
                'proveedor': part.proveedor.nombre if part.proveedor else 'N/A'
            })
        
        df = pd.DataFrame(data)
        
        # Generar reporte
        report_dir = os.path.join(os.getcwd(), 'reports')
        os.makedirs(report_dir, exist_ok=True)
        
        filename = f"stock_alerts_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        filepath = os.path.join(report_dir, filename)
        
        df.to_excel(filepath, index=False)
        
        log_activity(
            'report_generation',
            f"Reporte de alertas de stock generado: {filename}"
        )
        
        return {
            'status': 'success',
            'message': 'Reporte generado',
            'file': filename,
            'alerts_count': len(data)
        }
        
    except Exception as e:
        log_activity('report_error', f"Error generando reporte: {str(e)}")
        raise 
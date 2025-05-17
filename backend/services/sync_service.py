from backend.models import db, Repuesto, Proveedor, MovimientoInventario
from datetime import datetime, timedelta
from sqlalchemy import and_
from backend.utils.logger import log_activity, measure_time, metrics
from backend.utils.cache import cache_decorator
from typing import Dict, List, Any, Optional
import json
import os
import threading
import time
import requests
from backend.config import Config

class SyncService:
    """Servicio para manejar la sincronización de datos"""
    
    def __init__(self):
        self.session = requests.Session()
        self.config = Config()
        self.offline_data_path = 'offline_data'
        os.makedirs(self.offline_data_path, exist_ok=True)
    
    @measure_time('sync_proveedor')
    def sync_proveedor(self, proveedor_id: int) -> Dict:
        """Sincroniza datos con un proveedor específico"""
        try:
            proveedor = Proveedor.query.get_or_404(proveedor_id)
            
            if not proveedor.api_url:
                raise ValueError("El proveedor no tiene URL de API configurada")
            
            # Obtener datos del proveedor
            response = requests.get(
                f"{proveedor.api_url}/inventory",
                headers={
                    'Authorization': f'Bearer {proveedor.api_key}',
                    'Content-Type': 'application/json'
                },
                timeout=30
            )
            
            if response.status_code != 200:
                raise ValueError(f"Error en API del proveedor: {response.text}")
            
            datos = response.json()
            
            # Actualizar repuestos
            actualizados = 0
            for item in datos.get('items', []):
                repuesto = Repuesto.query.filter_by(
                    codigo=item['codigo'],
                    proveedor_id=proveedor_id
                ).first()
                
                if repuesto:
                    # Actualizar existente
                    repuesto.precio_compra = item['precio_compra']
                    repuesto.precio_venta = item['precio_venta']
                    repuesto.stock_disponible = item['stock_disponible']
                    repuesto.fecha_actualizacion = datetime.utcnow()
                    actualizados += 1
                else:
                    # Crear nuevo
                    nuevo_repuesto = Repuesto(
                        codigo=item['codigo'],
                        nombre=item['nombre'],
                        descripcion=item.get('descripcion'),
                        precio_compra=item['precio_compra'],
                        precio_venta=item['precio_venta'],
                        stock_actual=0,
                        stock_minimo=item.get('stock_minimo', 5),
                        proveedor_id=proveedor_id,
                        fecha_actualizacion=datetime.utcnow()
                    )
                    db.session.add(nuevo_repuesto)
            
            db.session.commit()
            
            # Registrar actividad
            log_activity(
                'sync_proveedor',
                f"Sincronización exitosa con {proveedor.nombre}",
                {
                    'proveedor_id': proveedor_id,
                    'items_actualizados': actualizados,
                    'items_nuevos': len(datos.get('items', [])) - actualizados
                }
            )
            
            return {
                'status': 'success',
                'message': 'Sincronización completada',
                'data': {
                    'proveedor': proveedor.nombre,
                    'items_actualizados': actualizados,
                    'items_nuevos': len(datos.get('items', [])) - actualizados
                }
            }
            
        except Exception as e:
            log_activity('sync_error', f"Error en sincronización: {str(e)}")
            raise ValueError(f"Error en sincronización: {str(e)}")
    
    @measure_time('sync_all')
    def sync_all_proveedores(self) -> Dict:
        """Sincroniza datos con todos los proveedores activos"""
        try:
            proveedores = Proveedor.query.filter_by(activo=True).all()
            resultados = []
            
            for proveedor in proveedores:
                try:
                    resultado = self.sync_proveedor(proveedor.id)
                    resultados.append({
                        'proveedor': proveedor.nombre,
                        'status': 'success',
                        'data': resultado['data']
                    })
                except Exception as e:
                    resultados.append({
                        'proveedor': proveedor.nombre,
                        'status': 'error',
                        'error': str(e)
                    })
            
            return {
                'status': 'success',
                'data': resultados
            }
            
        except Exception as e:
            log_activity('sync_error', f"Error en sincronización general: {str(e)}")
            raise ValueError(f"Error en sincronización general: {str(e)}")
    
    @measure_time('check_sync_status')
    @cache_decorator(ttl=300)  # Cache por 5 minutos
    def check_sync_status(self, proveedor_id: Optional[int] = None) -> Dict:
        """Verifica el estado de sincronización"""
        try:
            if proveedor_id:
                proveedor = Proveedor.query.get_or_404(proveedor_id)
                ultima_sync = proveedor.ultima_sincronizacion
                repuestos = Repuesto.query.filter_by(proveedor_id=proveedor_id).count()
                
                return {
                    'status': 'success',
                    'data': {
                        'proveedor': proveedor.nombre,
                        'ultima_sincronizacion': ultima_sync.isoformat() if ultima_sync else None,
                        'total_repuestos': repuestos,
                        'estado': 'actualizado' if ultima_sync and (datetime.utcnow() - ultima_sync).total_seconds() < 3600 else 'desactualizado'
                    }
                }
            else:
                proveedores = Proveedor.query.filter_by(activo=True).all()
                resultados = []
                
                for p in proveedores:
                    ultima_sync = p.ultima_sincronizacion
                    repuestos = Repuesto.query.filter_by(proveedor_id=p.id).count()
                    
                    resultados.append({
                        'proveedor': p.nombre,
                        'ultima_sincronizacion': ultima_sync.isoformat() if ultima_sync else None,
                        'total_repuestos': repuestos,
                        'estado': 'actualizado' if ultima_sync and (datetime.utcnow() - ultima_sync).total_seconds() < 3600 else 'desactualizado'
                    })
                
                return {
                    'status': 'success',
                    'data': resultados
                }
                
        except Exception as e:
            log_activity('sync_error', f"Error verificando estado: {str(e)}")
            raise ValueError(f"Error verificando estado: {str(e)}")
    
    def sync_inventory(self, supplier_id: Optional[int] = None) -> Dict[str, Any]:
        """Sincroniza el inventario con los proveedores"""
        try:
            # Obtener datos de proveedores
            suppliers = Proveedor.query.filter_by(activo=True)
            if supplier_id:
                suppliers = suppliers.filter_by(id=supplier_id)
            
            sync_results = []
            for supplier in suppliers:
                # Obtener datos del proveedor
                response = requests.get(
                    f"{supplier.api_url}/inventory",
                    headers={'Authorization': f"Bearer {supplier.api_key}"},
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self._update_inventory(supplier, data)
                    sync_results.append({
                        'supplier': supplier.nombre,
                        'status': 'success',
                        'items_updated': len(data)
                    })
                else:
                    sync_results.append({
                        'supplier': supplier.nombre,
                        'status': 'error',
                        'error': response.text
                    })
            
            log_activity('sync', f"Sincronización de inventario completada: {sync_results}")
            return {'status': 'success', 'results': sync_results}
            
        except Exception as e:
            log_activity('sync_error', f"Error en sincronización: {str(e)}")
            return {'status': 'error', 'error': str(e)}
    
    def _update_inventory(self, supplier: Proveedor, data: List[Dict[str, Any]]) -> None:
        """Actualiza el inventario con datos del proveedor"""
        for item in data:
            repuesto = Repuesto.query.filter_by(
                codigo=item['codigo'],
                proveedor_id=supplier.id
            ).first()
            
            if repuesto:
                # Actualizar existente
                repuesto.nombre = item['nombre']
                repuesto.precio = item['precio']
                repuesto.stock = item['stock']
                repuesto.ultima_actualizacion = datetime.utcnow()
            else:
                # Crear nuevo
                repuesto = Repuesto(
                    codigo=item['codigo'],
                    nombre=item['nombre'],
                    precio=item['precio'],
                    stock=item['stock'],
                    proveedor_id=supplier.id,
                    ultima_actualizacion=datetime.utcnow()
                )
                db.session.add(repuesto)
        
        db.session.commit()
    
    def save_offline_data(self, data: Dict[str, Any], entity_type: str) -> None:
        """Guarda datos para uso offline"""
        try:
            # Crear archivo con timestamp
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            filename = f"{self.offline_data_path}/{entity_type}_{timestamp}.json"
            
            with open(filename, 'w') as f:
                json.dump(data, f)
            
            # Limpiar archivos antiguos
            self._cleanup_old_offline_data()
            
            log_activity('offline', f"Datos guardados para offline: {filename}")
            
        except Exception as e:
            log_activity('offline_error', f"Error guardando datos offline: {str(e)}")
    
    def _cleanup_old_offline_data(self) -> None:
        """Limpia archivos offline antiguos"""
        try:
            max_days = self.config.MAX_OFFLINE_DAYS
            cutoff_date = datetime.utcnow() - timedelta(days=max_days)
            
            for filename in os.listdir(self.offline_data_path):
                filepath = os.path.join(self.offline_data_path, filename)
                if os.path.getmtime(filepath) < cutoff_date.timestamp():
                    os.remove(filepath)
                    log_activity('offline', f"Archivo offline eliminado: {filename}")
            
        except Exception as e:
            log_activity('offline_error', f"Error limpiando datos offline: {str(e)}")
    
    @cache_decorator(ttl=300)  # Cache por 5 minutos
    def get_sync_status(self) -> Dict[str, Any]:
        """Obtiene el estado de sincronización"""
        try:
            # Obtener última sincronización
            last_sync = MovimientoInventario.query.order_by(
                MovimientoInventario.fecha.desc()
            ).first()
            
            # Obtener estadísticas
            stats = {
                'total_repuestos': Repuesto.query.count(),
                'total_movimientos': MovimientoInventario.query.count(),
                'total_proveedores': Proveedor.query.filter_by(activo=True).count(),
                'ultima_sincronizacion': last_sync.fecha if last_sync else None
            }
            
            return {
                'status': 'success',
                'offline_mode': self.config.OFFLINE_MODE_ENABLED,
                'stats': stats
            }
            
        except Exception as e:
            log_activity('sync_error', f"Error obteniendo estado de sincronización: {str(e)}")
            return {'status': 'error', 'error': str(e)}
    
    def check_storage_limits(self) -> bool:
        """Verifica límites de almacenamiento"""
        try:
            total_size = 0
            for filename in os.listdir(self.offline_data_path):
                filepath = os.path.join(self.offline_data_path, filename)
                total_size += os.path.getsize(filepath)
            
            # Convertir a MB
            total_size_mb = total_size / (1024 * 1024)
            
            return total_size_mb <= self.config.MAX_LOCAL_STORAGE_MB
            
        except Exception as e:
            log_activity('storage_error', f"Error verificando límites de almacenamiento: {str(e)}")
            return False 
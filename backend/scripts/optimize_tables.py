from backend.app import create_app
from backend.utils.query_optimizer import QueryOptimizer
from backend.utils.logger import log_activity
from backend.extensions import db
from typing import Dict, Any
from models import Repuesto, MovimientoInventario, Proveedor, Cliente, Vehiculo, Servicio

def optimize_tables():
    """Aplica optimizaciones a las tablas de la base de datos"""
    app = create_app()
    
    with app.app_context():
        try:
            # Optimizar tabla Repuesto
            QueryOptimizer.add_indexes(Repuesto, [
                {'columns': ['codigo'], 'unique': True},
                {'columns': ['nombre']},
                {'columns': ['categoria']},
                {'columns': ['proveedor_id']},
                {'columns': ['stock']}
            ])
            
            # Optimizar tabla MovimientoInventario
            QueryOptimizer.add_indexes(MovimientoInventario, [
                {'columns': ['fecha']},
                {'columns': ['tipo']},
                {'columns': ['repuesto_id']},
                {'columns': ['cantidad']}
            ])
            
            # Optimizar tabla Proveedor
            QueryOptimizer.add_indexes(Proveedor, [
                {'columns': ['nombre']},
                {'columns': ['email'], 'unique': True},
                {'columns': ['telefono']}
            ])
            
            # Optimizar tabla Cliente
            QueryOptimizer.add_indexes(Cliente, [
                {'columns': ['nombre']},
                {'columns': ['email'], 'unique': True},
                {'columns': ['telefono']},
                {'columns': ['dni'], 'unique': True}
            ])
            
            # Optimizar tabla Vehiculo
            QueryOptimizer.add_indexes(Vehiculo, [
                {'columns': ['placa'], 'unique': True},
                {'columns': ['marca']},
                {'columns': ['modelo']},
                {'columns': ['cliente_id']}
            ])
            
            # Optimizar tabla Servicio
            QueryOptimizer.add_indexes(Servicio, [
                {'columns': ['fecha']},
                {'columns': ['estado']},
                {'columns': ['vehiculo_id']},
                {'columns': ['mecanico_id']}
            ])
            
            # Analizar y optimizar consultas comunes
            optimize_common_queries()
            
            log_activity('optimization', "Optimización de tablas completada")
            print("✅ Optimización de tablas completada")
            
        except Exception as e:
            log_activity('optimization_error', f"Error en optimización: {str(e)}")
            print(f"❌ Error en optimización: {str(e)}")

def optimize_common_queries():
    """Optimiza consultas comunes"""
    try:
        # Optimizar consulta de repuestos con stock bajo
        query = Repuesto.query.filter(Repuesto.stock <= Repuesto.stock_minimo)
        stats = QueryOptimizer.analyze_query(query)
        log_activity('query_optimization', f"Análisis de consulta de stock bajo: {stats}")
        
        # Optimizar consulta de movimientos recientes
        query = MovimientoInventario.query.order_by(MovimientoInventario.fecha.desc())
        stats = QueryOptimizer.analyze_query(query)
        log_activity('query_optimization', f"Análisis de consulta de movimientos: {stats}")
        
        # Optimizar consulta de servicios activos
        query = Servicio.query.filter(Servicio.estado == 'en_proceso')
        stats = QueryOptimizer.analyze_query(query)
        log_activity('query_optimization', f"Análisis de consulta de servicios: {stats}")
        
    except Exception as e:
        log_activity('query_optimization_error', f"Error optimizando consultas: {str(e)}")

if __name__ == '__main__':
    optimize_tables() 
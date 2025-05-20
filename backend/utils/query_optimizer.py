from sqlalchemy import inspect, text
from sqlalchemy.orm import joinedload, selectinload, subqueryload
from backend.models import db
from backend.utils.logger import log_activity
from backend.utils.cache import cache_with_args
from typing import List, Dict, Any, Optional
import time
from sqlalchemy.engine import Engine

class QueryOptimizer:
    """Clase para optimizar y analizar consultas SQL"""
    
    @staticmethod
    @cache_with_args(ttl=3600)
    def analyze_query(query: Any) -> Dict[str, Any]:
        """Analiza una consulta SQL y devuelve estadísticas
        
        Args:
            query: Consulta SQL a analizar
            
        Returns:
            Diccionario con estadísticas de la consulta
        """
        start_time = time.time()
        
        # Obtener plan de ejecución
        if hasattr(query, 'statement'):
            statement = query.statement
        else:
            statement = query
        
        # Convertir a texto SQL
        sql = str(statement.compile(compile_kwargs={"literal_binds": True}))
        
        # Ejecutar EXPLAIN ANALYZE
        engine = query.session.get_bind()
        with engine.connect() as conn:
            result = conn.execute(text(f"EXPLAIN ANALYZE {sql}"))
            plan = "\n".join(row[0] for row in result)
        
        # Calcular tiempo de ejecución
        execution_time = time.time() - start_time
        
        return {
            'sql': sql,
            'plan': plan,
            'execution_time': execution_time,
            'estimated_rows': QueryOptimizer._extract_estimated_rows(plan),
            'actual_rows': QueryOptimizer._extract_actual_rows(plan),
            'cache_hits': QueryOptimizer._extract_cache_hits(plan),
            'cache_misses': QueryOptimizer._extract_cache_misses(plan)
        }
    
    @staticmethod
    def _extract_estimated_rows(plan: str) -> Optional[int]:
        """Extrae el número estimado de filas del plan"""
        try:
            for line in plan.split('\n'):
                if 'rows=' in line:
                    return int(line.split('rows=')[1].split()[0])
        except:
            pass
        return None
    
    @staticmethod
    def _extract_actual_rows(plan: str) -> Optional[int]:
        """Extrae el número real de filas del plan"""
        try:
            for line in plan.split('\n'):
                if 'actual rows=' in line:
                    return int(line.split('actual rows=')[1].split()[0])
        except:
            pass
        return None
    
    @staticmethod
    def _extract_cache_hits(plan: str) -> Optional[int]:
        """Extrae el número de hits de caché del plan"""
        try:
            for line in plan.split('\n'):
                if 'cache hits=' in line:
                    return int(line.split('cache hits=')[1].split()[0])
        except:
            pass
        return None
    
    @staticmethod
    def _extract_cache_misses(plan: str) -> Optional[int]:
        """Extrae el número de misses de caché del plan"""
        try:
            for line in plan.split('\n'):
                if 'cache misses=' in line:
                    return int(line.split('cache misses=')[1].split()[0])
        except:
            pass
        return None
    
    @staticmethod
    def suggest_indexes(query: Any) -> List[Dict[str, Any]]:
        """Sugiere índices para una consulta
        
        Args:
            query: Consulta SQL a analizar
            
        Returns:
            Lista de sugerencias de índices
        """
        analysis = QueryOptimizer.analyze_query(query)
        suggestions = []
        
        # Analizar plan para sugerir índices
        if 'Seq Scan' in analysis['plan']:
            # Buscar columnas en WHERE
            sql = analysis['sql'].lower()
            if 'where' in sql:
                where_clause = sql.split('where')[1].split(';')[0]
                columns = [col.strip() for col in where_clause.split('and')]
                
                for column in columns:
                    if '=' in column or '<' in column or '>' in column:
                        col_name = column.split('=')[0].split('<')[0].split('>')[0].strip()
                        suggestions.append({
                            'type': 'btree',
                            'columns': [col_name],
                            'reason': f'Columna {col_name} usada en filtro WHERE'
                        })
        
        return suggestions
    
    @staticmethod
    def optimize_query(query: Any) -> Dict[str, Any]:
        """Optimiza una consulta SQL
        
        Args:
            query: Consulta SQL a optimizar
            
        Returns:
            Diccionario con la consulta optimizada y sugerencias
        """
        analysis = QueryOptimizer.analyze_query(query)
        suggestions = QueryOptimizer.suggest_indexes(query)
        
        return {
            'original_query': analysis['sql'],
            'execution_time': analysis['execution_time'],
            'suggested_indexes': suggestions,
            'estimated_rows': analysis['estimated_rows'],
            'actual_rows': analysis['actual_rows'],
            'cache_stats': {
                'hits': analysis['cache_hits'],
                'misses': analysis['cache_misses']
            }
        }
    
    @staticmethod
    def optimize_joins(query, model, relations: List[str]) -> Any:
        """Optimiza los joins de una consulta usando eager loading"""
        try:
            # Configurar eager loading según el tipo de relación
            for relation in relations:
                if relation in inspect(model).relationships:
                    rel = inspect(model).relationships[relation]
                    
                    # Seleccionar estrategia de carga según el tipo de relación
                    if rel.uselist:
                        if rel.lazy == 'select':
                            query = query.options(selectinload(getattr(model, relation)))
                        else:
                            query = query.options(joinedload(getattr(model, relation)))
                    else:
                        query = query.options(joinedload(getattr(model, relation)))
            
            return query
            
        except Exception as e:
            log_activity('join_optimization_error', f"Error optimizando joins: {str(e)}")
            return query
    
    @staticmethod
    def add_indexes(model, indexes: List[Dict[str, Any]]) -> None:
        """Agrega índices a una tabla"""
        try:
            for index in indexes:
                columns = [getattr(model, col) for col in index['columns']]
                name = index.get('name', f"ix_{model.__tablename__}_{'_'.join(index['columns'])}")
                
                # Crear índice
                db.Index(
                    name,
                    *columns,
                    unique=index.get('unique', False)
                ).create(db.engine)
                
            log_activity('index_creation', f"Índices creados para {model.__tablename__}")
            
        except Exception as e:
            log_activity('index_creation_error', f"Error creando índices: {str(e)}")
    
    @staticmethod
    def paginate_query(query, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Paginación eficiente de consultas"""
        try:
            # Calcular total de registros
            total = query.count()
            
            # Obtener página
            items = query.offset((page - 1) * per_page).limit(per_page).all()
            
            return {
                'items': items,
                'total': total,
                'pages': (total + per_page - 1) // per_page,
                'current_page': page
            }
            
        except Exception as e:
            log_activity('pagination_error', f"Error en paginación: {str(e)}")
            return {
                'items': [],
                'total': 0,
                'pages': 0,
                'current_page': page
            }
    
    @staticmethod
    @cache_with_args(ttl=300)  # Cache por 5 minutos
    def cached_query(query, cache_key: str) -> List[Any]:
        """Ejecuta una consulta con caché"""
        try:
            return query.all()
        except Exception as e:
            log_activity('cached_query_error', f"Error en consulta cacheada: {str(e)}")
            return []
    
    @staticmethod
    def optimize_filters(query, filters: Dict[str, Any]) -> Any:
        """Optimiza los filtros de una consulta"""
        try:
            for field, value in filters.items():
                if hasattr(query._entity_zero().class_, field):
                    if isinstance(value, (list, tuple)):
                        query = query.filter(getattr(query._entity_zero().class_, field).in_(value))
                    else:
                        query = query.filter(getattr(query._entity_zero().class_, field) == value)
            
            return query
            
        except Exception as e:
            log_activity('filter_optimization_error', f"Error optimizando filtros: {str(e)}")
            return query 
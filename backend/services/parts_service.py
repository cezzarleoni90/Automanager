from backend.models import db, Repuesto
from backend.utils.logger import log_activity
from backend.utils.cache import cache_with_args, invalidate_cache_pattern
from typing import List, Dict, Optional
from sqlalchemy import or_

class PartsService:
    @staticmethod
    @cache_with_args(timeout=300, key_prefix='parts')
    def get_parts(
        search: Optional[str] = None,
        category: Optional[str] = None,
        supplier: Optional[int] = None,
        page: int = 1,
        per_page: int = 20
    ) -> Dict:
        """Obtiene lista de repuestos con filtros y caché"""
        try:
            query = Repuesto.query
            
            if search:
                query = query.filter(
                    or_(
                        Repuesto.nombre.ilike(f'%{search}%'),
                        Repuesto.codigo.ilike(f'%{search}%'),
                        Repuesto.descripcion.ilike(f'%{search}%')
                    )
                )
            
            if category:
                query = query.filter(Repuesto.categoria == category)
                
            if supplier:
                query = query.filter(Repuesto.proveedor_id == supplier)
            
            # Ordenar por nombre
            query = query.order_by(Repuesto.nombre)
            
            # Paginación
            pagination = query.paginate(page=page, per_page=per_page)
            
            return {
                'items': [part.to_dict() for part in pagination.items],
                'total': pagination.total,
                'pages': pagination.pages,
                'current_page': page
            }
            
        except Exception as e:
            log_activity('parts_error', f"Error obteniendo repuestos: {str(e)}")
            raise
    
    @staticmethod
    @cache_with_args(timeout=3600, key_prefix='part')
    def get_part(part_id: int) -> Dict:
        """Obtiene un repuesto específico con caché"""
        try:
            part = Repuesto.query.get_or_404(part_id)
            return part.to_dict()
            
        except Exception as e:
            log_activity('part_error', f"Error obteniendo repuesto {part_id}: {str(e)}")
            raise
    
    @staticmethod
    def create_part(data: Dict) -> Dict:
        """Crea un nuevo repuesto e invalida caché"""
        try:
            part = Repuesto(**data)
            db.session.add(part)
            db.session.commit()
            
            # Invalidar caché relacionada
            invalidate_cache_pattern('parts')
            
            log_activity('part_create', f"Repuesto creado: {part.nombre}")
            return part.to_dict()
            
        except Exception as e:
            db.session.rollback()
            log_activity('part_error', f"Error creando repuesto: {str(e)}")
            raise
    
    @staticmethod
    def update_part(part_id: int, data: Dict) -> Dict:
        """Actualiza un repuesto e invalida caché"""
        try:
            part = Repuesto.query.get_or_404(part_id)
            
            for key, value in data.items():
                setattr(part, key, value)
            
            db.session.commit()
            
            # Invalidar caché relacionada
            invalidate_cache_pattern('parts')
            invalidate_cache_pattern(f'part:{part_id}')
            
            log_activity('part_update', f"Repuesto actualizado: {part.nombre}")
            return part.to_dict()
            
        except Exception as e:
            db.session.rollback()
            log_activity('part_error', f"Error actualizando repuesto {part_id}: {str(e)}")
            raise
    
    @staticmethod
    def delete_part(part_id: int) -> bool:
        """Elimina un repuesto e invalida caché"""
        try:
            part = Repuesto.query.get_or_404(part_id)
            db.session.delete(part)
            db.session.commit()
            
            # Invalidar caché relacionada
            invalidate_cache_pattern('parts')
            invalidate_cache_pattern(f'part:{part_id}')
            
            log_activity('part_delete', f"Repuesto eliminado: {part.nombre}")
            return True
            
        except Exception as e:
            db.session.rollback()
            log_activity('part_error', f"Error eliminando repuesto {part_id}: {str(e)}")
            raise
    
    @staticmethod
    @cache_with_args(timeout=3600, key_prefix='part_categories')
    def get_categories() -> List[str]:
        """Obtiene lista de categorías con caché"""
        try:
            categories = db.session.query(Repuesto.categoria).distinct().all()
            return [cat[0] for cat in categories if cat[0]]
            
        except Exception as e:
            log_activity('categories_error', f"Error obteniendo categorías: {str(e)}")
            raise
    
    @staticmethod
    @cache_with_args(timeout=300, key_prefix='part_stats')
    def get_stats() -> Dict:
        """Obtiene estadísticas de repuestos con caché"""
        try:
            total = Repuesto.query.count()
            low_stock = Repuesto.query.filter(Repuesto.stock <= Repuesto.stock_minimo).count()
            categories = db.session.query(
                Repuesto.categoria,
                db.func.count(Repuesto.id)
            ).group_by(Repuesto.categoria).all()
            
            return {
                'total': total,
                'low_stock': low_stock,
                'categories': dict(categories)
            }
            
        except Exception as e:
            log_activity('stats_error', f"Error obteniendo estadísticas: {str(e)}")
            raise 
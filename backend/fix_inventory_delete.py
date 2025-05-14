from app import create_app
from extensions import db
from models import Repuesto, MovimientoInventario

app = create_app()

with app.app_context():
    print("=== VERIFICACIÓN DE REPUESTOS Y MOVIMIENTOS ===\n")
    
    # Verificar repuestos
    repuestos = Repuesto.query.all()
    print(f"Total de repuestos: {len(repuestos)}")
    
    # Verificar movimientos
    movimientos = MovimientoInventario.query.all()
    print(f"Total de movimientos: {len(movimientos)}")
    
    # Verificar relaciones
    for repuesto in repuestos:
        try:
            movs = MovimientoInventario.query.filter_by(repuesto_id=repuesto.id).count()
            print(f"Repuesto {repuesto.codigo}: {movs} movimientos")
            
            # Intentar acceder a la relación
            movs_rel = len(repuesto.movimientos) if hasattr(repuesto, 'movimientos') else 'Sin relación'
            print(f"  - Vía relación: {movs_rel}")
            
        except Exception as e:
            print(f"ERROR en repuesto {repuesto.codigo}: {e}")
    
    print("\n=== FIN VERIFICACIÓN ===") 
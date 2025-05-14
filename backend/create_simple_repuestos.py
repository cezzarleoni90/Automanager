from app import create_app
from models import db, Repuesto

app = create_app()

with app.app_context():
    # Intentar crear un repuesto simple
    try:
        # Verificar qué columnas tiene realmente el modelo
        print("Columnas del modelo Repuesto:")
        for column in Repuesto.__table__.columns:
            print(f"  - {column.name}: {column.type}")
        
        # Crear repuesto básico usando solo las columnas que sabemos que existen
        repuesto_test = Repuesto(
            codigo='TEST001',
            nombre='Repuesto de Prueba'
        )
        
        # Intentar configurar atributos opcionales si existen
        if hasattr(repuesto_test, 'categoria'):
            repuesto_test.categoria = 'Prueba'
        if hasattr(repuesto_test, 'estado'):
            repuesto_test.estado = 'activo'
        if hasattr(repuesto_test, 'stock'):
            repuesto_test.stock = 10
        
        db.session.add(repuesto_test)
        db.session.commit()
        print("Repuesto de prueba creado exitosamente")
        
    except Exception as e:
        print(f"Error: {e}")
        db.session.rollback() 
# Script para mostrar los campos requeridos del endpoint POST repuestos

import inspect
from blueprints.inventario import create_repuesto

# Leer el código fuente del endpoint
source = inspect.getsource(create_repuesto)
print("=== CÓDIGO DEL ENDPOINT POST REPUESTOS ===\n")
print(source)

# También ver qué campos requiere el modelo Repuesto
from models import Repuesto
print("\n=== CAMPOS DEL MODELO REPUESTO ===")
for column in Repuesto.__table__.columns:
    nullable = "Opcional" if column.nullable else "Requerido"
    default = f" (Default: {column.default.arg if column.default else 'None'})" if column.default else ""
    print(f"- {column.name}: {column.type} - {nullable}{default}") 
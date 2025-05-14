#!/usr/bin/env python3

import re

def fix_servicios_file():
    # Leer el archivo actual
    with open('blueprints/servicios.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Reemplazos necesarios
    replacements = [
        # Cambiar activo por estado == 'activo'
        (r"'activo': m\.activo", "'activo': m.estado == 'activo'"),
        (r"mecanico\.activo", "mecanico.estado == 'activo'"),
        # Otros posibles patrones
        (r"\.activo", ".estado == 'activo'"),
    ]
    
    # Aplicar reemplazos
    original_content = content
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)
    
    # Solo escribir si hay cambios
    if content != original_content:
        with open('blueprints/servicios.py', 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ Archivo servicios.py corregido")
        print("Cambios realizados:")
        for pattern, replacement in replacements:
            if re.search(pattern, original_content):
                print(f"  - Cambiado: {pattern} → {replacement}")
    else:
        print("❌ No se encontraron patrones para corregir")

if __name__ == "__main__":
    fix_servicios_file() 
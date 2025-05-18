import random
from typing import List, Optional

# Colores pastel organizados por categorías para mejor personalización
COLORES_PASTEL = {
    'azules': ['#B0E0E6', '#ADD8E6', '#87CEEB', '#B0C4DE', '#E0FFFF', '#F0F8FF', '#F0FFFF', '#E6E6FA'],
    'verdes': ['#98FB98', '#90EE90', '#8FBC8F', '#9ACD32', '#7CFC00', '#7FFF00', '#ADFF2F', '#BDFCC9'],
    'rosados': ['#FFB6C1', '#FFC0CB', '#FFE4E1', '#FFE4E1', '#FFB3BA', '#FFDFBA', '#FFBAED', '#F7CAC9'],
    'amarillos': ['#FFFACD', '#FAFAD2', '#FFFFE0', '#FFFFF0', '#FFF8DC', '#FFEFD5', '#FFE4B5', '#FFDAB9'],
    'morados': ['#E6E6FA', '#D8BFD8', '#DDA0DD', '#EE82EE', '#D7BAFF', '#B39EB5', '#B284BE', '#D6CADD'],
    'naranjas': ['#FFA07A', '#FA8072', '#E9967A', '#F08080', '#CD5C5C', '#DC143C', '#B22222', '#FF6347'],
    'grises': ['#D3D3D3', '#DCDCDC', '#E8E8E8', '#F5F5F5', '#FAFAFA', '#F0F0F0', '#E0E0E0', '#D8D8D8']
}

def obtener_color_pastel_disponible(
    colores_usados: List[str],
    preferencia: Optional[str] = None,
    evitar_colores: Optional[List[str]] = None
) -> str:
    """
    Obtiene un color pastel disponible que no esté en uso.
    
    Args:
        colores_usados: Lista de colores ya asignados
        preferencia: Categoría de color preferida ('azules', 'verdes', etc.)
        evitar_colores: Lista de colores a evitar
        
    Returns:
        str: Color pastel en formato hexadecimal
    """
    # Si hay preferencia, usar esa categoría primero
    if preferencia and preferencia in COLORES_PASTEL:
        colores_disponibles = [c for c in COLORES_PASTEL[preferencia] 
                             if c not in colores_usados and 
                             (not evitar_colores or c not in evitar_colores)]
        if colores_disponibles:
            return random.choice(colores_disponibles)
    
    # Si no hay preferencia o no hay colores disponibles en la preferencia,
    # buscar en todas las categorías
    todos_colores = [color for categoria in COLORES_PASTEL.values() for color in categoria]
    colores_disponibles = [c for c in todos_colores 
                          if c not in colores_usados and 
                          (not evitar_colores or c not in evitar_colores)]
    
    if colores_disponibles:
        return random.choice(colores_disponibles)
    
    # Si todos los colores están usados, retornar uno aleatorio
    return random.choice(todos_colores)

def obtener_categoria_color(color: str) -> Optional[str]:
    """
    Obtiene la categoría de un color pastel.
    
    Args:
        color: Color en formato hexadecimal
        
    Returns:
        str: Nombre de la categoría o None si no se encuentra
    """
    for categoria, colores in COLORES_PASTEL.items():
        if color in colores:
            return categoria
    return None 
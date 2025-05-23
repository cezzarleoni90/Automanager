"""
Documentación de la API de Inventario
====================================

Este módulo contiene la documentación de los endpoints de la API de inventario.
"""

INVENTARIO_API_DOCS = {
    "version": "1.0",
    "base_url": "/api/inventario",
    "endpoints": {
        "repuestos": {
            "GET /repuestos": {
                "description": "Obtiene la lista de repuestos",
                "parameters": {
                    "page": "Número de página (opcional)",
                    "per_page": "Elementos por página (opcional)",
                    "categoria": "Filtrar por categoría (opcional)",
                    "stock_bajo": "Filtrar por stock bajo (opcional)",
                    "busqueda": "Término de búsqueda (opcional)"
                },
                "response": {
                    "success": "boolean",
                    "data": {
                        "repuestos": "array",
                        "total": "integer",
                        "page": "integer",
                        "per_page": "integer",
                        "total_pages": "integer"
                    },
                    "message": "string",
                    "errors": "array"
                }
            },
            "GET /repuestos/{id}": {
                "description": "Obtiene un repuesto específico",
                "parameters": {
                    "id": "ID del repuesto"
                },
                "response": {
                    "success": "boolean",
                    "data": {
                        "repuesto": "object"
                    },
                    "message": "string",
                    "errors": "array"
                }
            },
            "POST /repuestos": {
                "description": "Crea un nuevo repuesto",
                "body": {
                    "codigo": "string (requerido)",
                    "nombre": "string (requerido)",
                    "categoria": "string (requerido)",
                    "precio_compra": "number (requerido)",
                    "precio_venta": "number (requerido)",
                    "stock": "number (opcional)",
                    "stock_minimo": "number (opcional)",
                    "descripcion": "string (opcional)",
                    "proveedor": "string (opcional)"
                },
                "response": {
                    "success": "boolean",
                    "data": {
                        "repuesto": "object"
                    },
                    "message": "string",
                    "errors": "array"
                }
            },
            "PUT /repuestos/{id}": {
                "description": "Actualiza un repuesto existente",
                "parameters": {
                    "id": "ID del repuesto"
                },
                "body": {
                    "codigo": "string (opcional)",
                    "nombre": "string (opcional)",
                    "categoria": "string (opcional)",
                    "precio_compra": "number (opcional)",
                    "precio_venta": "number (opcional)",
                    "stock": "number (opcional)",
                    "stock_minimo": "number (opcional)",
                    "descripcion": "string (opcional)",
                    "proveedor": "string (opcional)",
                    "estado": "string (opcional)"
                },
                "response": {
                    "success": "boolean",
                    "data": {
                        "repuesto": "object"
                    },
                    "message": "string",
                    "errors": "array"
                }
            },
            "DELETE /repuestos/{id}": {
                "description": "Elimina un repuesto",
                "parameters": {
                    "id": "ID del repuesto"
                },
                "response": {
                    "success": "boolean",
                    "message": "string",
                    "errors": "array"
                }
            }
        },
        "movimientos": {
            "GET /repuestos/{id}/movimientos": {
                "description": "Obtiene el historial de movimientos de un repuesto",
                "parameters": {
                    "id": "ID del repuesto",
                    "page": "Número de página (opcional)",
                    "per_page": "Elementos por página (opcional)",
                    "tipo": "Filtrar por tipo (entrada/salida) (opcional)",
                    "fecha_inicio": "Filtrar por fecha inicial (opcional)",
                    "fecha_fin": "Filtrar por fecha final (opcional)"
                },
                "response": {
                    "success": "boolean",
                    "data": {
                        "movimientos": "array",
                        "total": "integer",
                        "page": "integer",
                        "per_page": "integer",
                        "total_pages": "integer"
                    },
                    "message": "string",
                    "errors": "array"
                }
            },
            "POST /movimientos": {
                "description": "Registra un nuevo movimiento de inventario",
                "body": {
                    "repuesto_id": "integer (requerido)",
                    "tipo": "string (requerido, entrada/salida)",
                    "cantidad": "number (requerido)",
                    "motivo": "string (opcional)",
                    "servicio_id": "integer (opcional)",
                    "usuario_id": "integer (opcional)"
                },
                "response": {
                    "success": "boolean",
                    "data": {
                        "movimiento": "object"
                    },
                    "message": "string",
                    "errors": "array"
                }
            }
        }
    }
} 
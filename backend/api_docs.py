from flask_restx import Api, Resource, fields, reqparse
from flask import Blueprint
from datetime import datetime

# Crear Blueprint para la documentación
api_bp = Blueprint('api', __name__, url_prefix='/api')
api = Api(api_bp,
    title='AutoManager API',
    version='1.0',
    description='API para el sistema de gestión de taller automotriz',
    doc='/docs',
    authorizations={
        'apikey': {
            'type': 'apiKey',
            'in': 'header',
            'name': 'Authorization',
            'description': 'Ingrese su token JWT en el formato: Bearer <token>'
        }
    },
    security='apikey'
)

# ========== PARSERS PARA VALIDACIÓN ==========

# Parser para filtros de búsqueda
search_parser = reqparse.RequestParser()
search_parser.add_argument('q', type=str, help='Término de búsqueda')
search_parser.add_argument('page', type=int, default=1, help='Número de página')
search_parser.add_argument('per_page', type=int, default=10, help='Elementos por página')
search_parser.add_argument('sort_by', type=str, help='Campo para ordenar')
search_parser.add_argument('order', type=str, choices=['asc', 'desc'], help='Orden de clasificación')

# Parser para filtros de fechas
date_parser = reqparse.RequestParser()
date_parser.add_argument('fecha_inicio', type=str, help='Fecha de inicio (YYYY-MM-DD)')
date_parser.add_argument('fecha_fin', type=str, help='Fecha de fin (YYYY-MM-DD)')

# ========== MODELOS DE DATOS ==========

# Modelo de Proveedor
proveedor_model = api.model('Proveedor', {
    'id': fields.Integer(readonly=True, description='ID único del proveedor'),
    'nombre': fields.String(required=True, description='Nombre del proveedor', min_length=3, max_length=100),
    'contacto': fields.String(required=True, description='Persona de contacto', min_length=3, max_length=100),
    'telefono': fields.String(required=True, description='Teléfono de contacto', pattern=r'^\+?[0-9]{7,15}$'),
    'email': fields.String(description='Correo electrónico', pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
    'direccion': fields.String(description='Dirección física', min_length=5, max_length=200),
    'notas': fields.String(description='Notas adicionales', max_length=500),
    'estado': fields.String(description='Estado del proveedor', enum=['activo', 'inactivo']),
    'fecha_creacion': fields.DateTime(readonly=True, description='Fecha de creación del registro'),
    'fecha_actualizacion': fields.DateTime(readonly=True, description='Fecha de última actualización')
})

# Modelo de Repuesto
repuesto_model = api.model('Repuesto', {
    'id': fields.Integer(readonly=True, description='ID único del repuesto'),
    'codigo': fields.String(required=True, description='Código único del repuesto', min_length=3, max_length=50),
    'nombre': fields.String(required=True, description='Nombre del repuesto', min_length=3, max_length=100),
    'descripcion': fields.String(description='Descripción detallada', max_length=500),
    'precio_compra': fields.Float(required=True, description='Precio de compra', min=0),
    'precio_venta': fields.Float(required=True, description='Precio de venta', min=0),
    'stock': fields.Integer(description='Cantidad en inventario', min=0),
    'stock_minimo': fields.Integer(description='Stock mínimo para alertas', min=0),
    'proveedor_id': fields.Integer(description='ID del proveedor asociado'),
    'estado': fields.String(description='Estado del repuesto', enum=['activo', 'inactivo', 'agotado']),
    'fecha_creacion': fields.DateTime(readonly=True, description='Fecha de creación del registro'),
    'fecha_actualizacion': fields.DateTime(readonly=True, description='Fecha de última actualización')
})

# Modelo de Movimiento
movimiento_model = api.model('Movimiento', {
    'id': fields.Integer(readonly=True, description='ID único del movimiento'),
    'repuesto_id': fields.Integer(required=True, description='ID del repuesto'),
    'tipo': fields.String(required=True, description='Tipo de movimiento', enum=['entrada', 'salida']),
    'cantidad': fields.Integer(required=True, description='Cantidad movida', min=1),
    'notas': fields.String(description='Notas del movimiento', max_length=500),
    'servicio_id': fields.Integer(description='ID del servicio relacionado'),
    'usuario_id': fields.Integer(description='ID del usuario que realizó el movimiento'),
    'fecha': fields.DateTime(readonly=True, description='Fecha y hora del movimiento')
})

# Modelo de Respuesta de Error
error_model = api.model('Error', {
    'error': fields.String(description='Mensaje de error'),
    'code': fields.Integer(description='Código de error'),
    'details': fields.Raw(description='Detalles adicionales del error')
})

# ========== ESPECIFICACIONES DE ENDPOINTS ==========

# Proveedores
proveedor_ns = api.namespace('proveedores', description='Operaciones con proveedores')

@proveedor_ns.route('/')
class ProveedorList(Resource):
    @proveedor_ns.doc('list_proveedores',
        params={
            'q': 'Término de búsqueda',
            'page': 'Número de página',
            'per_page': 'Elementos por página',
            'sort_by': 'Campo para ordenar',
            'order': 'Orden de clasificación (asc/desc)'
        }
    )
    @proveedor_ns.marshal_list_with(proveedor_model)
    @proveedor_ns.response(200, 'Lista de proveedores obtenida exitosamente')
    @proveedor_ns.response(400, 'Parámetros de búsqueda inválidos', error_model)
    def get(self):
        """
        Lista todos los proveedores con paginación y filtros
        
        Ejemplo de respuesta:
        ```json
        {
            "items": [
                {
                    "id": 1,
                    "nombre": "Proveedor A",
                    "contacto": "Juan Pérez",
                    "telefono": "+1234567890",
                    "email": "contacto@proveedora.com",
                    "estado": "activo"
                }
            ],
            "total": 1,
            "page": 1,
            "per_page": 10
        }
        ```
        """
        pass

    @proveedor_ns.doc('create_proveedor')
    @proveedor_ns.expect(proveedor_model)
    @proveedor_ns.marshal_with(proveedor_model, code=201)
    @proveedor_ns.response(201, 'Proveedor creado exitosamente')
    @proveedor_ns.response(400, 'Datos de proveedor inválidos', error_model)
    @proveedor_ns.response(409, 'Proveedor ya existe', error_model)
    def post(self):
        """
        Crea un nuevo proveedor
        
        Ejemplo de solicitud:
        ```json
        {
            "nombre": "Proveedor A",
            "contacto": "Juan Pérez",
            "telefono": "+1234567890",
            "email": "contacto@proveedora.com",
            "direccion": "Calle Principal 123",
            "estado": "activo"
        }
        ```
        """
        pass

@proveedor_ns.route('/<int:id>')
@proveedor_ns.param('id', 'ID del proveedor')
class ProveedorResource(Resource):
    @proveedor_ns.doc('get_proveedor')
    @proveedor_ns.marshal_with(proveedor_model)
    @proveedor_ns.response(200, 'Proveedor encontrado')
    @proveedor_ns.response(404, 'Proveedor no encontrado', error_model)
    def get(self, id):
        """
        Obtiene un proveedor por su ID
        
        Ejemplo de respuesta:
        ```json
        {
            "id": 1,
            "nombre": "Proveedor A",
            "contacto": "Juan Pérez",
            "telefono": "+1234567890",
            "email": "contacto@proveedora.com",
            "direccion": "Calle Principal 123",
            "estado": "activo",
            "fecha_creacion": "2024-01-01T00:00:00Z",
            "fecha_actualizacion": "2024-01-01T00:00:00Z"
        }
        ```
        """
        pass

    @proveedor_ns.doc('update_proveedor')
    @proveedor_ns.expect(proveedor_model)
    @proveedor_ns.marshal_with(proveedor_model)
    @proveedor_ns.response(200, 'Proveedor actualizado exitosamente')
    @proveedor_ns.response(400, 'Datos de proveedor inválidos', error_model)
    @proveedor_ns.response(404, 'Proveedor no encontrado', error_model)
    def put(self, id):
        """
        Actualiza un proveedor existente
        
        Ejemplo de solicitud:
        ```json
        {
            "nombre": "Proveedor A Actualizado",
            "contacto": "Juan Pérez",
            "telefono": "+1234567890",
            "email": "nuevo@proveedora.com",
            "estado": "activo"
        }
        ```
        """
        pass

    @proveedor_ns.doc('delete_proveedor')
    @proveedor_ns.response(204, 'Proveedor eliminado exitosamente')
    @proveedor_ns.response(404, 'Proveedor no encontrado', error_model)
    @proveedor_ns.response(409, 'No se puede eliminar el proveedor porque tiene repuestos asociados', error_model)
    def delete(self, id):
        """
        Elimina un proveedor
        
        Notas:
        - No se puede eliminar un proveedor que tenga repuestos asociados
        - La eliminación es permanente
        """
        pass

# Repuestos
repuesto_ns = api.namespace('repuestos', description='Operaciones con repuestos')

@repuesto_ns.route('/')
class RepuestoList(Resource):
    @repuesto_ns.doc('list_repuestos',
        params={
            'q': 'Término de búsqueda',
            'page': 'Número de página',
            'per_page': 'Elementos por página',
            'sort_by': 'Campo para ordenar',
            'order': 'Orden de clasificación (asc/desc)',
            'estado': 'Filtrar por estado',
            'proveedor_id': 'Filtrar por proveedor'
        }
    )
    @repuesto_ns.marshal_list_with(repuesto_model)
    @repuesto_ns.response(200, 'Lista de repuestos obtenida exitosamente')
    @repuesto_ns.response(400, 'Parámetros de búsqueda inválidos', error_model)
    def get(self):
        """
        Lista todos los repuestos con paginación y filtros
        
        Ejemplo de respuesta:
        ```json
        {
            "items": [
                {
                    "id": 1,
                    "codigo": "REP001",
                    "nombre": "Filtro de aceite",
                    "precio_compra": 10.50,
                    "precio_venta": 15.00,
                    "stock": 50,
                    "stock_minimo": 10,
                    "estado": "activo"
                }
            ],
            "total": 1,
            "page": 1,
            "per_page": 10
        }
        ```
        """
        pass

    @repuesto_ns.doc('create_repuesto')
    @repuesto_ns.expect(repuesto_model)
    @repuesto_ns.marshal_with(repuesto_model, code=201)
    @repuesto_ns.response(201, 'Repuesto creado exitosamente')
    @repuesto_ns.response(400, 'Datos de repuesto inválidos', error_model)
    @repuesto_ns.response(409, 'Código de repuesto ya existe', error_model)
    def post(self):
        """
        Crea un nuevo repuesto
        
        Ejemplo de solicitud:
        ```json
        {
            "codigo": "REP001",
            "nombre": "Filtro de aceite",
            "descripcion": "Filtro de aceite para motor",
            "precio_compra": 10.50,
            "precio_venta": 15.00,
            "stock": 50,
            "stock_minimo": 10,
            "proveedor_id": 1,
            "estado": "activo"
        }
        ```
        """
        pass

@repuesto_ns.route('/<int:id>')
@repuesto_ns.param('id', 'ID del repuesto')
class RepuestoResource(Resource):
    @repuesto_ns.doc('get_repuesto')
    @repuesto_ns.marshal_with(repuesto_model)
    @repuesto_ns.response(200, 'Repuesto encontrado')
    @repuesto_ns.response(404, 'Repuesto no encontrado', error_model)
    def get(self, id):
        """
        Obtiene un repuesto por su ID
        
        Ejemplo de respuesta:
        ```json
        {
            "id": 1,
            "codigo": "REP001",
            "nombre": "Filtro de aceite",
            "descripcion": "Filtro de aceite para motor",
            "precio_compra": 10.50,
            "precio_venta": 15.00,
            "stock": 50,
            "stock_minimo": 10,
            "proveedor_id": 1,
            "estado": "activo",
            "fecha_creacion": "2024-01-01T00:00:00Z",
            "fecha_actualizacion": "2024-01-01T00:00:00Z"
        }
        ```
        """
        pass

    @repuesto_ns.doc('update_repuesto')
    @repuesto_ns.expect(repuesto_model)
    @repuesto_ns.marshal_with(repuesto_model)
    @repuesto_ns.response(200, 'Repuesto actualizado exitosamente')
    @repuesto_ns.response(400, 'Datos de repuesto inválidos', error_model)
    @repuesto_ns.response(404, 'Repuesto no encontrado', error_model)
    @repuesto_ns.response(409, 'Código de repuesto ya existe', error_model)
    def put(self, id):
        """
        Actualiza un repuesto existente
        
        Ejemplo de solicitud:
        ```json
        {
            "nombre": "Filtro de aceite premium",
            "precio_compra": 12.50,
            "precio_venta": 18.00,
            "stock_minimo": 15,
            "estado": "activo"
        }
        ```
        """
        pass

    @repuesto_ns.doc('delete_repuesto')
    @repuesto_ns.response(204, 'Repuesto eliminado exitosamente')
    @repuesto_ns.response(404, 'Repuesto no encontrado', error_model)
    @repuesto_ns.response(409, 'No se puede eliminar el repuesto porque tiene movimientos asociados', error_model)
    def delete(self, id):
        """
        Elimina un repuesto
        
        Notas:
        - No se puede eliminar un repuesto que tenga movimientos asociados
        - La eliminación es permanente
        """
        pass

# Movimientos
movimiento_ns = api.namespace('movimientos', description='Operaciones con movimientos de inventario')

@movimiento_ns.route('/')
class MovimientoList(Resource):
    @movimiento_ns.doc('list_movimientos',
        params={
            'fecha_inicio': 'Fecha de inicio (YYYY-MM-DD)',
            'fecha_fin': 'Fecha de fin (YYYY-MM-DD)',
            'tipo': 'Tipo de movimiento (entrada/salida)',
            'repuesto_id': 'ID del repuesto',
            'page': 'Número de página',
            'per_page': 'Elementos por página'
        }
    )
    @movimiento_ns.marshal_list_with(movimiento_model)
    @repuesto_ns.response(200, 'Lista de movimientos obtenida exitosamente')
    @repuesto_ns.response(400, 'Parámetros de búsqueda inválidos', error_model)
    def get(self):
        """
        Lista todos los movimientos con paginación y filtros
        
        Ejemplo de respuesta:
        ```json
        {
            "items": [
                {
                    "id": 1,
                    "repuesto_id": 1,
                    "tipo": "entrada",
                    "cantidad": 10,
                    "notas": "Compra inicial",
                    "fecha": "2024-01-01T00:00:00Z"
                }
            ],
            "total": 1,
            "page": 1,
            "per_page": 10
        }
        ```
        """
        pass

    @movimiento_ns.doc('create_movimiento')
    @movimiento_ns.expect(movimiento_model)
    @movimiento_ns.marshal_with(movimiento_model, code=201)
    @movimiento_ns.response(201, 'Movimiento creado exitosamente')
    @movimiento_ns.response(400, 'Datos de movimiento inválidos', error_model)
    @movimiento_ns.response(404, 'Repuesto no encontrado', error_model)
    @movimiento_ns.response(409, 'Stock insuficiente para salida', error_model)
    def post(self):
        """
        Crea un nuevo movimiento de inventario
        
        Ejemplo de solicitud:
        ```json
        {
            "repuesto_id": 1,
            "tipo": "entrada",
            "cantidad": 10,
            "notas": "Compra inicial",
            "servicio_id": null,
            "usuario_id": 1
        }
        ```
        """
        pass

@movimiento_ns.route('/batch')
class MovimientoBatch(Resource):
    @movimiento_ns.doc('create_movimientos_batch')
    @movimiento_ns.expect([movimiento_model])
    @movimiento_ns.response(201, 'Movimientos creados exitosamente')
    @movimiento_ns.response(400, 'Datos de movimientos inválidos', error_model)
    @movimiento_ns.response(409, 'Error en algunos movimientos', error_model)
    def post(self):
        """
        Crea múltiples movimientos en lote
        
        Ejemplo de solicitud:
        ```json
        [
            {
                "repuesto_id": 1,
                "tipo": "entrada",
                "cantidad": 10,
                "notas": "Compra inicial"
            },
            {
                "repuesto_id": 2,
                "tipo": "entrada",
                "cantidad": 5,
                "notas": "Compra inicial"
            }
        ]
        ```
        
        Notas:
        - Los movimientos se procesan en una transacción
        - Si un movimiento falla, se revierten todos los cambios
        """
        pass

# Reportes
reporte_ns = api.namespace('reportes', description='Reportes de inventario')

@reporte_ns.route('/valor-inventario')
class ValorInventario(Resource):
    @reporte_ns.doc('get_valor_inventario')
    @reporte_ns.response(200, 'Reporte generado exitosamente')
    def get(self):
        """
        Obtiene el valor total del inventario
        
        Ejemplo de respuesta:
        ```json
        {
            "valor_total_compra": 15000.00,
            "valor_total_venta": 22500.00,
            "margen_bruto": 7500.00,
            "total_repuestos": 100,
            "repuestos_stock_bajo": 5
        }
        ```
        """
        pass

@reporte_ns.route('/movimientos')
class ReporteMovimientos(Resource):
    @reporte_ns.doc('get_reportes_movimientos',
        params={
            'fecha_inicio': 'Fecha de inicio (YYYY-MM-DD)',
            'fecha_fin': 'Fecha de fin (YYYY-MM-DD)',
            'tipo': 'Tipo de movimiento (entrada/salida)',
            'repuesto_id': 'ID del repuesto'
        }
    )
    @reporte_ns.response(200, 'Reporte generado exitosamente')
    @reporte_ns.response(400, 'Parámetros de búsqueda inválidos', error_model)
    def get(self):
        """
        Obtiene reporte de movimientos
        
        Ejemplo de respuesta:
        ```json
        {
            "total_entradas": 50,
            "total_salidas": 30,
            "valor_entradas": 5000.00,
            "valor_salidas": 7500.00,
            "movimientos": [
                {
                    "fecha": "2024-01-01",
                    "entradas": 10,
                    "salidas": 5,
                    "valor_entradas": 1000.00,
                    "valor_salidas": 1500.00
                }
            ]
        }
        ```
        """
        pass 
# Soluciones y Problemas Comunes - AutoManager

## Problemas de Formularios React

### 1. Componentes Select de Material-UI
**Problema**: Valores undefined y cambios de componentes no controlados a controlados.

**Solución**:
```javascript
// Estado inicial correcto
const [estado, setEstado] = useState({
  campo_select: '',  // Inicializar con string vacío, no undefined
});

// Componente Select correcto
<Select
  value={estado.campo_select || ''}  // Asegurar que nunca sea undefined
  onChange={handleChange}
>
  <MenuItem value="">Seleccione una opción</MenuItem>
  <MenuItem value="opcion1">Opción 1</MenuItem>
  <MenuItem value="opcion2">Opción 2</MenuItem>
</Select>
```

### 2. Manejo de Campos Numéricos
**Problema**: Conversión de strings a números en formularios.

**Solución**:
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  const datos = {
    ...formData,
    campo_numero: formData.campo_numero ? parseInt(formData.campo_numero) : null,
    campo_decimal: formData.campo_decimal ? parseFloat(formData.campo_decimal) : null,
    // Convertir strings vacíos a null para campos opcionales
    campo_opcional: formData.campo_opcional || null
  };
};
```

## Problemas de Backend

### 1. Relaciones en Modelos SQLAlchemy
**Problema**: Conflictos en backref y back_populates.

**Solución**:
```python
# Modelo Cliente
class Cliente(db.Model):
    vehiculos = db.relationship('Vehiculo', back_populates='cliente', lazy=True)

# Modelo Vehiculo
class Vehiculo(db.Model):
    cliente = db.relationship('Cliente', back_populates='vehiculos')
```

### 2. Manejo de Errores en API
**Problema**: Errores 500 en endpoints.

**Solución**:
```python
@app.route('/api/endpoint', methods=['POST'])
def handle_request():
    try:
        # Validar datos requeridos
        if not request.json.get('campo_requerido'):
            return jsonify({'error': 'Campo requerido'}), 400
            
        # Procesar datos
        datos = {
            'campo': request.json.get('campo'),
            'campo_opcional': request.json.get('campo_opcional') or None
        }
        
        return jsonify({'mensaje': 'Éxito', 'datos': datos}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

## Problemas de PowerShell

### 1. Ejecución de Scripts
**Problema**: Error de políticas de ejecución.

**Solución**:
1. Abrir PowerShell como administrador
2. Ejecutar: `Set-ExecutionPolicy RemoteSigned`
3. Confirmar con 'S' o 'Y'

### 2. Rutas de Archivos
**Problema**: No se encuentra el archivo app.py.

**Solución**:
```powershell
# Navegar al directorio correcto
cd AutoManager/backend

# Ejecutar la aplicación
python app.py
```

## Buenas Prácticas

1. **Frontend**:
   - Inicializar todos los campos de formulario con valores válidos
   - Usar valores por defecto para campos opcionales
   - Validar datos antes de enviar al backend
   - Manejar estados de carga y error

2. **Backend**:
   - Validar datos de entrada
   - Usar try/catch para manejar errores
   - Devolver respuestas consistentes
   - Documentar endpoints

3. **Base de Datos**:
   - Definir relaciones claras entre modelos
   - Usar back_populates en lugar de backref
   - Manejar valores nulos apropiadamente

## Notas Adicionales

- Siempre verificar que el servidor backend esté corriendo antes de probar el frontend
- Mantener las versiones de las dependencias actualizadas
- Usar herramientas de desarrollo como React DevTools
- Implementar logging para debugging 
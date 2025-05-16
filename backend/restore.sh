#!/bin/bash

# Activar entorno virtual si existe
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Cargar variables de entorno
source .env

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [opciones]"
    echo "Opciones:"
    echo "  -f, --file FILE        Archivo de backup específico"
    echo "  -s, --s3              Restaurar desde S3"
    echo "  -l, --list            Listar backups disponibles"
    echo "  -t, --time TIME       Restaurar al punto en el tiempo especificado (ISO format)"
    echo "  --tables T1,T2,...    Restaurar solo las tablas especificadas"
    echo "  --verify              Solo verificar el backup sin restaurar"
    echo "  --dry-run             Simular la restauración sin ejecutarla"
    echo "  -h, --help            Mostrar esta ayuda"
}

# Función para listar backups
list_backups() {
    if [ "$1" = "s3" ]; then
        celery -A tasks call tasks.list_available_backups --args="[true]"
    else
        celery -A tasks call tasks.list_available_backups --args="[false]"
    fi
}

# Variables por defecto
BACKUP_FILE=""
FROM_S3=false
POINT_IN_TIME=""
TABLES=""
VERIFY_ONLY=false
DRY_RUN=false

# Procesar argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--file)
            BACKUP_FILE="$2"
            shift 2
            ;;
        -s|--s3)
            FROM_S3=true
            shift
            ;;
        -l|--list)
            list_backups ${FROM_S3:+s3}
            exit 0
            ;;
        -t|--time)
            POINT_IN_TIME="$2"
            shift 2
            ;;
        --tables)
            TABLES="$2"
            shift 2
            ;;
        --verify)
            VERIFY_ONLY=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Opción desconocida: $1"
            show_help
            exit 1
            ;;
    esac
done

# Verificar que existe el directorio de backups
if [ ! -d "$BACKUP_DIR" ]; then
    echo "Error: Directorio de backups no encontrado"
    exit 1
fi

# Construir argumentos para la tarea
ARGS="["
if [ ! -z "$BACKUP_FILE" ]; then
    ARGS+="'$BACKUP_FILE',"
else
    ARGS+="null,"
fi
ARGS+="$FROM_S3,"
if [ ! -z "$POINT_IN_TIME" ]; then
    ARGS+="'$POINT_IN_TIME',"
else
    ARGS+="null,"
fi
if [ ! -z "$TABLES" ]; then
    ARGS+="['${TABLES//,/\',\'}'],"
else
    ARGS+="null,"
fi
ARGS+="$VERIFY_ONLY,$DRY_RUN]"

# Ejecutar restauración
celery -A tasks call tasks.restore_database --args="$ARGS"

# Verificar resultado
if [ $? -eq 0 ]; then
    if [ "$VERIFY_ONLY" = true ]; then
        echo "Verificación completada exitosamente"
    elif [ "$DRY_RUN" = true ]; then
        echo "Simulación de restauración completada exitosamente"
    else
        echo "Restauración completada exitosamente"
    fi
else
    echo "Error durante la operación"
    exit 1
fi
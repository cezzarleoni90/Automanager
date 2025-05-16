#!/bin/bash

# Activar entorno virtual si existe
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Configurar variables de entorno
export CELERY_BROKER_URL=redis://localhost:6379/0
export CELERY_RESULT_BACKEND=redis://localhost:6379/0
export SENTRY_DSN=tu_dsn_de_sentry
export BACKUP_DIR=backups
export BACKUP_RETENTION_DAYS=30
export BACKUP_S3_BUCKET=tu_bucket_s3
export AWS_ACCESS_KEY_ID=tu_access_key
export AWS_SECRET_ACCESS_KEY=tu_secret_key

# Crear directorio de backups si no existe
mkdir -p $BACKUP_DIR

# Iniciar Redis si no está corriendo
redis-cli ping > /dev/null 2>&1 || redis-server &

# Iniciar Celery worker
celery -A tasks worker --loglevel=info --concurrency=4 &

# Iniciar Celery beat
celery -A tasks beat --loglevel=info &

# Iniciar Flower (monitor de Celery)
celery -A tasks flower --port=5555 &

# Iniciar Gunicorn
gunicorn --workers=4 --bind=0.0.0.0:5000 --worker-class=gevent --log-level=info "app:create_app()"

chmod +x run_prod.sh

./run_prod.sh

# PostgreSQL
pg_restore -d tu_base_de_datos backup_file.sql

# SQLite
sqlite3 tu_base_de_datos ".restore backup_file.sql"
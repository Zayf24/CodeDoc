#!/usr/bin/env bash
# Start script for Render deployment
# Runs both Gunicorn (Django) and Celery worker in the same process

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Exit on error after directory change
set -e

echo "Working directory: $(pwd)"
echo "Python version: $(python --version)"
echo "Port: ${PORT:-8000}"
echo "Checking if Django is accessible..."
python -c "import django; print(f'Django version: {django.get_version()}')" || echo "Warning: Django check failed"

# Function to handle shutdown gracefully
cleanup() {
    echo "Shutting down..."
    if [ ! -z "$GUNICORN_PID" ]; then
        kill -TERM "$GUNICORN_PID" 2>/dev/null || true
    fi
    if [ ! -z "$CELERY_PID" ]; then
        kill -TERM "$CELERY_PID" 2>/dev/null || true
    fi
    exit 0
}

# Trap signals for graceful shutdown
trap cleanup SIGTERM SIGINT

# Start Celery worker in the background
echo "Starting Celery worker..."
celery -A codedoc_main worker --loglevel=info &
CELERY_PID=$!
echo "Celery worker started with PID: $CELERY_PID"

# Give Celery a moment to start
sleep 2

# Start Gunicorn in the background
echo "Starting Gunicorn server on port ${PORT:-8000}..."
gunicorn codedoc_main.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --timeout 120 \
    --workers 2 \
    --access-logfile - \
    --error-logfile - &
GUNICORN_PID=$!
echo "Gunicorn started with PID: $GUNICORN_PID"

# Wait for both processes (this keeps the script running)
echo "Both services started. Monitoring processes..."
echo "Gunicorn PID: $GUNICORN_PID, Celery PID: $CELERY_PID"

# Wait for both processes - if either exits, the script will exit
wait "$GUNICORN_PID" "$CELERY_PID"

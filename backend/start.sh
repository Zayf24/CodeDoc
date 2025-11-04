#!/usr/bin/env bash
# Exit on error
set -o errexit

# Start script for Render deployment
# Runs both Gunicorn (Django) and Celery worker in the same process

# Function to handle shutdown gracefully
cleanup() {
    echo "Shutting down..."
    kill -TERM "$GUNICORN_PID" 2>/dev/null || true
    kill -TERM "$CELERY_PID" 2>/dev/null || true
    wait "$GUNICORN_PID" "$CELERY_PID" 2>/dev/null || true
    exit 0
}

# Trap signals for graceful shutdown
trap cleanup SIGTERM SIGINT

# Start Celery worker in the background
echo "Starting Celery worker..."
celery -A codedoc_main worker --loglevel=info &
CELERY_PID=$!

# Start Gunicorn in the background
echo "Starting Gunicorn server on port ${PORT:-8000}..."
gunicorn codedoc_main.wsgi:application --bind 0.0.0.0:${PORT:-8000} --timeout 120 --workers 2 --access-logfile - --error-logfile - &
GUNICORN_PID=$!

# Wait for both processes (this keeps the script running)
echo "Both services started. Gunicorn PID: $GUNICORN_PID, Celery PID: $CELERY_PID"
wait "$GUNICORN_PID" "$CELERY_PID"

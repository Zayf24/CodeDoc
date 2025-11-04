#!/usr/bin/env bash
# Exit on error
set -o errexit

# Build script for Render deployment
# This script is executed during the build phase

echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "Build completed successfully!"

# Celery configuration for CodeDoc project
import os
from celery import Celery
from decouple import config

# Set default Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'codedoc_main.settings')

app = Celery('documentation_generator')

# Load task modules from all registered Django apps
app.config_from_object('django.conf:settings', namespace='CELERY')

# Use environment variable for Redis URL, fallback to localhost for development
REDIS_URL = config('REDIS_URL', default='redis://localhost:6379/0')
app.conf.update(
    broker_url=REDIS_URL,
    result_backend=REDIS_URL,
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    """Debug task for testing Celery configuration"""
    print(f'Request: {self.request!r}')

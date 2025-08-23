# Celery configuration for CodeDoc project
import os
from celery import Celery

# Set default Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'codedoc_main.settings')

app = Celery('documentation_generator')

# Load task modules from all registered Django apps
app.config_from_object('django.conf:settings', namespace='CELERY')
app.conf.update(
    broker_transport='redis',
    broker_host='localhost',
    broker_port=6379,
    broker_db=0,
    result_backend='redis://localhost:6379/0',
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

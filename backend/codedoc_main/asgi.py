# ASGI configuration for CodeDoc project

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'codedoc_main.settings')

application = get_asgi_application()

# WSGI configuration for CodeDoc project

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'codedoc_main.settings')

application = get_wsgi_application()

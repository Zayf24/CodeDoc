# Django app configuration for user authentication
from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        """Register signals when the app is ready"""
        try:
            from . import signals
            signals.register_signals()
        except Exception as e:
            print(f"Failed to register signals: {e}")

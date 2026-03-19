# core/celery.py

import os
from celery import Celery
from celery.signals import setup_logging

# Set the default Django settings module for celery
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

# Load the celery app
app = Celery("core")

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

# Disable the retry on startup
app.conf.broker_connection_retry_on_startup = False


# Add logging to celery
@setup_logging.connect
def config_loggers(*args, **kwargs):
    from logging.config import dictConfig
    from django.conf import settings

    dictConfig(settings.LOGGING)

import logging
from django.apps import AppConfig

logger = logging.getLogger(__name__)


class SentimentEngineConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "sentiment_engine"

    def ready(self):
        # Register signals only — models are no longer loaded at startup
        from . import signals  # noqa: F401
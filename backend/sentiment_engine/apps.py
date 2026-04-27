import logging
from django.apps import AppConfig

logger = logging.getLogger(__name__)


class SentimentEngineConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "sentiment_engine"

    def ready(self):
        """Pre-load models into memory when Django starts."""
        import os
        # Skip model loading during management commands that don't need it
        # (migrations, collectstatic, etc.) and during test runs
        if os.environ.get("SENTIMENT_SKIP_LOAD") == "1":
            return
        try:
            from .model_loader import get_models
            get_models()
            logger.info("Sentiment models loaded successfully.")
        except Exception as e:
            logger.error("Failed to load sentiment models: %s", e)

        # Register signals
        from . import signals  # noqa: F401
"""
Periodic ingestion job for django-crontab.

MVP: system crontab invokes `python manage.py crontab run <job_id>` every 30 minutes
(see CRONJOBS in config/settings.py). Works on Linux/macOS servers with cron.

For production at scale (retries, queues, multiple workers, visibility), migrate to
Celery + django-celery-beat + Redis/RabbitMQ instead of django-crontab.

Windows dev: `crontab add` is not available; run `run_ingestion_job()` from a shell
or use Task Scheduler calling `manage.py crontab run <id>` if you install cron tooling.
"""

from __future__ import annotations

import logging

from django.conf import settings

from ingestion.services.pipeline import run_ingestion

logger = logging.getLogger(__name__)


def run_ingestion_job() -> None:
    """
    Entry point for django-crontab. Uses INGESTION_DEFAULT_COMPANY_ID.
    Individual sources already log and continue on failure inside the pipeline;
    this wrapper catches any unexpected error so the cron subprocess exits cleanly.
    """
    company_id = getattr(settings, "INGESTION_DEFAULT_COMPANY_ID", None)
    if company_id is None:
        logger.warning(
            "Scheduled ingestion skipped: INGESTION_DEFAULT_COMPANY_ID is not set.",
        )
        return

    try:
        company_id = int(company_id)
    except (TypeError, ValueError):
        logger.error(
            "Scheduled ingestion skipped: invalid INGESTION_DEFAULT_COMPANY_ID=%r.",
            company_id,
        )
        return

    logger.info(
        "Scheduled ingestion started for company_id=%s",
        company_id,
    )
    try:
        result = run_ingestion(company_id)
    except Exception:
        logger.exception(
            "Scheduled ingestion failed for company_id=%s (pipeline error).",
            company_id,
        )
        return

    logger.info(
        "Scheduled ingestion finished for company_id=%s: created=%s existing=%s skipped=%s sources=%s",
        company_id,
        result.get("created"),
        result.get("existing"),
        result.get("skipped"),
        list((result.get("sources") or {}).keys()),
    )

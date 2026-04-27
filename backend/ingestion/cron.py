"""
Scheduled ingestion job entrypoint.

This module is shared by background schedulers (e.g., `run_scheduler`) and can
also be invoked manually for diagnostics.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

from django.conf import settings
from companies.models import Company

from ingestion.services.pipeline import run_ingestion

logger = logging.getLogger(__name__)
LOCK_FILE = Path(settings.BASE_DIR) / "ingestion_scheduler.lock"


def _acquire_lock() -> bool:
    """
    Cross-process lock to prevent overlapping scheduler cycles.
    Uses atomic file creation.
    """
    try:
        fd = os.open(str(LOCK_FILE), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(str(os.getpid()))
        return True
    except FileExistsError:
        return False


def _release_lock() -> None:
    try:
        LOCK_FILE.unlink(missing_ok=True)
    except Exception:
        logger.exception("Failed to release scheduler lock: %s", LOCK_FILE)


def run_ingestion_job() -> None:
    """
    Run one ingestion cycle for all companies.
    """
    if not _acquire_lock():
        logger.warning(
            "Scheduled ingestion skipped: another cycle is already running (lock=%s).",
            LOCK_FILE,
        )
        return

    try:
        companies = list(Company.objects.order_by("id").values("id", "name"))
        if not companies:
            logger.warning("Scheduled ingestion skipped: no companies found.")
            return

        logger.info("Scheduled ingestion cycle started for %d company(ies).", len(companies))
        total_created = total_existing = total_skipped = 0

        for item in companies:
            company_id = item["id"]
            company_name = item["name"]
            logger.info("Ingestion started for company_id=%s name=%s", company_id, company_name)
            try:
                result = run_ingestion(company_id)
            except Exception:
                logger.exception(
                    "Scheduled ingestion failed for company_id=%s name=%s.",
                    company_id,
                    company_name,
                )
                continue

            created = int(result.get("created", 0) or 0)
            existing = int(result.get("existing", 0) or 0)
            skipped = int(result.get("skipped", 0) or 0)
            total_created += created
            total_existing += existing
            total_skipped += skipped
            logger.info(
                "Ingestion finished for company_id=%s name=%s: created=%s existing=%s skipped=%s sources=%s",
                company_id,
                company_name,
                created,
                existing,
                skipped,
                list((result.get("sources") or {}).keys()),
            )

        logger.info(
            "Scheduled ingestion cycle finished: total_created=%s total_existing=%s total_skipped=%s companies=%s",
            total_created,
            total_existing,
            total_skipped,
            len(companies),
        )
    finally:
        _release_lock()

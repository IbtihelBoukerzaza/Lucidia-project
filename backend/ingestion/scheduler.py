import schedule
import time
import logging

from ingestion.cron import run_ingestion_job

logger = logging.getLogger(__name__)


def start_scheduler():
    logger.info("Scheduler started: running every 30 minutes")

    schedule.every(30).minutes.do(run_ingestion_job)

    # run immediately (important for testing)
    run_ingestion_job()

    while True:
        try:
            schedule.run_pending()
            time.sleep(10)
        except Exception:
            logger.exception("Scheduler loop crashed, continuing...")
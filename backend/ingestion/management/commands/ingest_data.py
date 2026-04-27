import json
import os
import sys
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from ingestion.services.pipeline import run_ingestion

LOCK_FILE = Path(settings.BASE_DIR) / "ingestion.lock"


class Command(BaseCommand):
    help = "Ingest posts from all configured sources into posts.Post."

    def add_arguments(self, parser):
        parser.add_argument(
            "--company-id",
            type=int,
            default=None,
            help="Target company PK (defaults to INGESTION_DEFAULT_COMPANY_ID).",
        )
        parser.add_argument("--skip-rss", action="store_true")
        parser.add_argument("--skip-youtube", action="store_true")
        parser.add_argument("--skip-twitter", action="store_true")
        parser.add_argument("--skip-google-news", action="store_true")
        parser.add_argument("--skip-reddit", action="store_true")
        parser.add_argument("--skip-facebook", action="store_true")
        parser.add_argument("--skip-instagram", action="store_true")
        parser.add_argument("--skip-tiktok", action="store_true")
        parser.add_argument(
            "--json",
            action="store_true",
            help="Print stats as JSON.",
        )

    def handle(self, *args, **options):
        # Overlap protection — prevents two runs at the same time
        if LOCK_FILE.exists():
            self.stdout.write(
                self.style.WARNING(
                    f"Ingestion already running (lock: {LOCK_FILE}). Exiting."
                )
            )
            sys.exit(0)

        LOCK_FILE.write_text(str(os.getpid()))
        try:
            self._run(options)
        finally:
            LOCK_FILE.unlink(missing_ok=True)

    def _run(self, options):
        company_id = options["company_id"]
        if company_id is None:
            company_id = getattr(settings, "INGESTION_DEFAULT_COMPANY_ID", None)
        if company_id is None:
            raise CommandError(
                "Pass --company-id or set INGESTION_DEFAULT_COMPANY_ID."
            )

        stats = run_ingestion(
            company_id,
            skip_rss=options["skip_rss"],
            skip_youtube=options["skip_youtube"],
            skip_twitter=options["skip_twitter"],
            skip_google_news=options["skip_google_news"],
            skip_reddit=options["skip_reddit"],
            skip_facebook=options["skip_facebook"],
            skip_instagram=options["skip_instagram"],
            skip_tiktok=options["skip_tiktok"],
        )

        if options["json"]:
            self.stdout.write(json.dumps(stats, default=str))
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Ingestion complete for company {company_id}"
                )
            )
            self.stdout.write(f"  created:  {stats['created']}")
            self.stdout.write(f"  existing: {stats['existing']}")
            self.stdout.write(f"  skipped:  {stats['skipped']}")
            for name, detail in stats["sources"].items():
                self.stdout.write(f"  [{name}] {detail}")
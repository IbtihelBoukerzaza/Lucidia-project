import json

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from ingestion.services.pipeline import run_ingestion


class Command(BaseCommand):
    help = (
        "Ingest posts from GDELT, RSS, Google News, Reddit, Hacker News, YouTube, "
        "and Twitter (API and/or optional snscrape fallback) into posts.Post."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--company-id",
            type=int,
            default=None,
            help="Target company PK (defaults to INGESTION_DEFAULT_COMPANY_ID).",
        )
        parser.add_argument("--skip-gdelt", action="store_true")
        parser.add_argument("--skip-rss", action="store_true")
        parser.add_argument("--skip-youtube", action="store_true")
        parser.add_argument("--skip-twitter", action="store_true")
        parser.add_argument("--skip-google-news", action="store_true")
        parser.add_argument("--skip-reddit", action="store_true")
        parser.add_argument("--skip-hackernews", action="store_true")
        parser.add_argument(
            "--json",
            action="store_true",
            help="Print stats as JSON (for cron / monitoring).",
        )

    def handle(self, *args, **options):
        company_id = options["company_id"]
        if company_id is None:
            company_id = getattr(settings, "INGESTION_DEFAULT_COMPANY_ID", None)
        if company_id is None:
            raise CommandError(
                "Pass --company-id or set INGESTION_DEFAULT_COMPANY_ID in the environment.",
            )

        stats = run_ingestion(
            company_id,
            skip_gdelt=options["skip_gdelt"],
            skip_rss=options["skip_rss"],
            skip_youtube=options["skip_youtube"],
            skip_twitter=options["skip_twitter"],
            skip_google_news=options["skip_google_news"],
            skip_reddit=options["skip_reddit"],
            skip_hackernews=options["skip_hackernews"],
        )

        if options["json"]:
            self.stdout.write(json.dumps(stats, default=str))
        else:
            self.stdout.write(self.style.SUCCESS(f"Ingestion complete for company {company_id}"))
            self.stdout.write(f"  created:  {stats['created']}")
            self.stdout.write(f"  existing: {stats['existing']}")
            self.stdout.write(f"  skipped:  {stats['skipped']}")
            for name, detail in stats["sources"].items():
                self.stdout.write(f"  [{name}] {detail}")

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from ingestion.services.facebook_scraper import fetch_last_post_comments
from ingestion.services.facebook import normalize_facebook_data
from ingestion.services.store import upsert_post


class Command(BaseCommand):
    help = "Ingest Facebook comments into posts.Post"

    def add_arguments(self, parser):
        parser.add_argument(
            "--company-id",
            type=int,
            default=None,
            help="Target company PK",
        )

    def handle(self, *args, **options):
        company_id = options["company_id"]

        if company_id is None:
            company_id = getattr(settings, "INGESTION_DEFAULT_COMPANY_ID", None)

        if company_id is None:
            raise CommandError(
                "Pass --company-id or set INGESTION_DEFAULT_COMPANY_ID"
            )

        facebook_url = getattr(settings, "FACEBOOK_PAGE_URL", None)

        if not facebook_url:
            raise CommandError("FACEBOOK_PAGE_URL is not configured")

        self.stdout.write("Fetching Facebook data...")

        raw_data = fetch_last_post_comments(facebook_url)
        rows = normalize_facebook_data(raw_data)

        created = existing = skipped = 0

        for row in rows:
            post, is_new = upsert_post(company_id=company_id, row=row)

            if post is None:
                skipped += 1
            elif is_new:
                created += 1
            else:
                existing += 1

        self.stdout.write(self.style.SUCCESS("Facebook ingestion complete"))
        self.stdout.write(f"Created:  {created}")
        self.stdout.write(f"Existing: {existing}")
        self.stdout.write(f"Skipped:  {skipped}")
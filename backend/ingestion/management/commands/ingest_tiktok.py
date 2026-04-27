from django.core.management.base import BaseCommand, CommandError

from companies.models import CompanySocialProfile
from ingestion.services.tiktok_scraper import fetch_tiktok_comments
from ingestion.services.tiktok import normalize_tiktok_data
from ingestion.services.store import upsert_post


class Command(BaseCommand):
    help = "Ingest TikTok comments into posts.Post"

    def add_arguments(self, parser):
        parser.add_argument("--company-id", type=int, default=None)
        parser.add_argument("--video-limit", type=int, default=5)
        parser.add_argument("--comment-limit", type=int, default=30)

    def handle(self, *args, **options):
        company_id = options["company_id"]
        if company_id is None:
            raise CommandError("Pass --company-id")

        tiktok_url = (
            CompanySocialProfile.objects
            .filter(
                company_id=company_id,
                platform=CompanySocialProfile.Platform.TIKTOK,
                is_active=True,
            )
            .values_list("url", flat=True)
            .first()
        )
        if not tiktok_url:
            raise CommandError(
                "No active TikTok URL configured for this company in CompanySocialProfile.",
            )

        self.stdout.write(f"Fetching TikTok data from: {tiktok_url}")

        raw_rows = fetch_tiktok_comments(
            profile_url=tiktok_url,
            video_limit=options["video_limit"],
            comment_limit=options["comment_limit"],
        )
        self.stdout.write(f"Scraper returned {len(raw_rows)} raw rows")

        rows = normalize_tiktok_data(raw_rows)
        self.stdout.write(f"After normalization: {len(rows)} valid rows")

        created = existing = skipped = 0
        for row in rows:
            post, is_new = upsert_post(company_id=company_id, row=row)
            if post is None:
                skipped += 1
            elif is_new:
                created += 1
            else:
                existing += 1

        self.stdout.write(self.style.SUCCESS("TikTok ingestion complete"))
        self.stdout.write(f"Created:  {created}")
        self.stdout.write(f"Existing: {existing}")
        self.stdout.write(f"Skipped:  {skipped}")
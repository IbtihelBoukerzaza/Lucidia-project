"""
Management command to backfill sentiment for all unclassified posts.

Usage:
    python manage.py classify_existing
    python manage.py classify_existing --company 2
    python manage.py classify_existing --batch-size 50
"""

from __future__ import annotations

import logging
from django.core.management.base import BaseCommand
from django.utils import timezone

from posts.models import Post
from sentiment_engine.predictor import predict

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Classify sentiment for all posts that have not been classified yet."

    def add_arguments(self, parser):
        parser.add_argument(
            "--company",
            type=int,
            default=None,
            help="Only classify posts for this company ID.",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=100,
            help="Number of posts to process per batch (default: 100).",
        )

    def handle(self, *args, **options):
        company_id = options["company"]
        batch_size = options["batch_size"]

        qs = Post.objects.filter(sentiment__isnull=True).exclude(text="")
        if company_id:
            qs = qs.filter(company_id=company_id)

        total = qs.count()
        self.stdout.write(f"Found {total} unclassified posts.")

        if total == 0:
            self.stdout.write(self.style.SUCCESS("Nothing to do."))
            return

        done = 0
        errors = 0
        now = timezone.now()

        ids = list(qs.values_list("pk", flat=True))

        for i in range(0, len(ids), batch_size):
            batch_ids = ids[i : i + batch_size]
            batch = Post.objects.filter(pk__in=batch_ids)

            for post in batch:
                try:
                    result = predict(post.text)
                    if result["label"] is None:
                        continue
                    Post.objects.filter(pk=post.pk).update(
                        sentiment=result["label"],
                        sentiment_score=result["score"],
                        sentiment_scores=result["scores"],
                        sentiment_at=now,
                    )
                    done += 1
                except Exception as e:
                    errors += 1
                    logger.error("Failed to classify post %s: %s", post.pk, e)

            self.stdout.write(f"  Processed {min(i + batch_size, total)}/{total}...")

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Classified: {done} | Errors: {errors}"
            )
        )
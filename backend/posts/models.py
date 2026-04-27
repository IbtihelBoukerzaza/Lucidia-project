from django.db import models

from companies.models import Company


class Post(models.Model):
    class Source(models.TextChoices):
        RSS = "rss", "RSS"
        YOUTUBE = "youtube", "YouTube"
        TWITTER = "twitter", "Twitter"
        GOOGLE_NEWS = "google_news", "Google News"
        REDDIT = "reddit", "Reddit"
        FACEBOOK = "facebook", "Facebook"
        INSTAGRAM = "instagram", "Instagram"
        TIKTOK = "tiktok", "TikTok"        
        MANUAL = "manual", "Manual"

    class Platform(models.TextChoices):
        NEWS = "news", "News"
        SOCIAL = "social", "Social"

    text = models.TextField()
    source = models.CharField(max_length=20, choices=Source.choices)
    platform = models.CharField(max_length=20, choices=Platform.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="posts",
    )
    external_id = models.CharField(
        max_length=512,
        blank=True,
        null=True,
        help_text="Stable id from the source; used for deduplication per company.",
    )
    url = models.URLField(blank=True, null=True, max_length=2048)
    author = models.CharField(max_length=255, blank=True, null=True)

    # --- Sentiment fields (populated by sentiment_engine) ---
    sentiment = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        choices=[
            ("positive", "Positive"),
            ("neutral", "Neutral"),
            ("negative", "Negative"),
        ],
        db_index=True,
    )
    sentiment_score = models.FloatField(
        blank=True,
        null=True,
        help_text="Confidence score of the predicted sentiment (0.0 – 1.0).",
    )
    sentiment_scores = models.JSONField(
        blank=True,
        null=True,
        help_text="Full probability distribution: {negative, neutral, positive}.",
    )
    sentiment_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When sentiment was last classified.",
    )
    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["company", "-created_at"]),
            models.Index(fields=["company", "source"]),
            models.Index(fields=["company", "sentiment"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["company", "external_id"],
                name="posts_post_company_external_id_uniq",
                condition=models.Q(external_id__isnull=False),
            ),
        ]

    def __str__(self):
        preview = (self.text or "")[:60]
        return f"{self.source} @ {self.company_id}: {preview}"

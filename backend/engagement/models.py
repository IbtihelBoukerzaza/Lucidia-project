from django.db import models
from companies.models import Company


class EngagedPost(models.Model):
    class Platform(models.TextChoices):
        FACEBOOK = "facebook", "Facebook"
        INSTAGRAM = "instagram", "Instagram"
        YOUTUBE = "youtube", "YouTube"
        REDDIT = "reddit", "Reddit"

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="engaged_posts",
    )
    url = models.URLField(max_length=2048)
    platform = models.CharField(max_length=20, choices=Platform.choices, db_index=True)
    title = models.TextField(blank=True, default="")
    like_count = models.PositiveIntegerField(null=True, blank=True)
    share_count = models.PositiveIntegerField(null=True, blank=True)
    comment_count = models.PositiveIntegerField(null=True, blank=True)
    view_count = models.PositiveIntegerField(null=True, blank=True)
    scraped_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-scraped_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["company", "url"],
                name="engagement_engagedpost_company_url_uniq",
            )
        ]

    def __str__(self):
        return f"{self.platform} | {self.company_id} | {self.url[:60]}"
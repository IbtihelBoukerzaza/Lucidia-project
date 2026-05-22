from django.conf import settings
from django.db import models


class PlatformFeedback(models.Model):
    """
    Feedback submitted by Gantra platform users (e.g. Mobilis admins/analysts)
    about the platform itself — not about their own customers.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="platform_feedback",
    )

    # NPS: 0–10  "How likely are you to recommend Gantra to a colleague?"
    nps_score = models.PositiveSmallIntegerField(
        help_text="0–10 Net Promoter Score"
    )

    # Star ratings 1–5
    accuracy_rating = models.PositiveSmallIntegerField(
        help_text="Sentiment accuracy rating 1–5"
    )
    usability_rating = models.PositiveSmallIntegerField(
        help_text="Dashboard usability rating 1–5"
    )
    coverage_rating = models.PositiveSmallIntegerField(
        help_text="Scraping coverage rating 1–5"
    )

    # Open text
    comment = models.TextField(blank=True, default="")

    # Admin picks which ones appear on the homepage
    is_featured = models.BooleanField(default=False)

    # Shown as the author name on homepage testimonials
    display_name = models.CharField(
        max_length=100, blank=True, default="",
        help_text="Name shown on homepage (e.g. 'Ahmed, Mobilis'). Auto-filled if blank."
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Platform Feedback"
        verbose_name_plural = "Platform Feedback"

    def __str__(self):
        return f"{self.user.email} — NPS {self.nps_score}"

    def save(self, *args, **kwargs):
        # Auto-fill display_name from user's first_name if blank
        if not self.display_name:
            name = self.user.first_name or self.user.email.split("@")[0]
            self.display_name = name
        super().save(*args, **kwargs)
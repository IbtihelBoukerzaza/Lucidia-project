from django.conf import settings
from django.db import models


class Company(models.Model):
    name = models.CharField(max_length=200)
    industry = models.CharField(
        max_length=100,
        help_text="e.g. telecom, finance, ecommerce",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "companies"

    def __str__(self):
        return self.name


class Membership(models.Model):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        ANALYST = "analyst", "Analyst"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.ANALYST,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["company__name"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "company"],
                name="companies_membership_user_company_uniq",
            ),
        ]

    def __str__(self):
        return f"{self.user_id} @ {self.company_id} ({self.role})"


class CompanyKeyword(models.Model):
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="keywords",
    )
    keyword = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("company", "keyword")
        ordering = ["keyword"]

    def __str__(self):
        return f"{self.company.name} - {self.keyword}"


class CompanySocialProfile(models.Model):
    """
    Stores one social/RSS URL per platform per company.
    This centralizes per-company source URLs in the database instead of settings.

    Examples:
        platform="facebook"  url="https://www.facebook.com/Mobilis.dz"
        platform="instagram" url="https://www.instagram.com/mobilis.dz/"
        platform="tiktok"    url="https://www.tiktok.com/@mobilis.dz"
        platform="rss"       url="https://feeds.bbci.co.uk/news/rss.xml"

    A company can have multiple RSS feeds (one row per feed).
    A company should have at most one row per social platform.
    """

    class Platform(models.TextChoices):
        FACEBOOK = "facebook", "Facebook"
        INSTAGRAM = "instagram", "Instagram"
        TIKTOK = "tiktok", "TikTok"
        RSS = "rss", "RSS Feed"
        YOUTUBE_CHANNEL = "youtube_channel", "YouTube Channel"
        X = "x", "X / Twitter"

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="social_profiles",
    )
    platform = models.CharField(
        max_length=30,
        choices=Platform.choices,
    )
    url = models.URLField(max_length=2048)
    is_active = models.BooleanField(
        default=True,
        help_text="Uncheck to temporarily disable this source without deleting it.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["platform"]
        # One URL per platform per company
        # Exception: RSS — a company can have multiple feeds
        constraints = [
            models.UniqueConstraint(
                fields=["company", "platform", "url"],
                name="companies_socialprofile_company_platform_url_uniq",
            ),
        ]

    def __str__(self):
        return f"{self.company.name} | {self.platform} | {self.url}"
from datetime import timedelta
import hashlib
import secrets

from django.conf import settings
from django.db import models
from django.utils import timezone


class AccessRequest(models.Model):
    SECTOR_CHOICES = [
        ("ecommerce", "تجارة إلكترونية"),
        ("finance", "بنك / مالية"),
        ("telecom", "اتصالات"),
        ("services", "خدمات"),
        ("other", "أخرى"),
    ]

    COMPANY_SIZE_CHOICES = [
        ("1-10", "1-10 موظفين"),
        ("10-50", "10-50 موظف"),
        ("50-200", "50-200 موظف"),
        ("200+", "200+ موظف"),
    ]

    full_name = models.CharField(max_length=150)
    professional_email = models.EmailField(unique=True)
    company_name = models.CharField(max_length=150)
    sector = models.CharField(max_length=50, choices=SECTOR_CHOICES)
    company_size = models.CharField(max_length=20, choices=COMPANY_SIZE_CHOICES)
    goal = models.TextField()

    is_reviewed = models.BooleanField(default=False)
    is_approved = models.BooleanField(null=True, blank=True)
    approved_user = models.EmailField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.company_name} - {self.professional_email}"


class ActivationToken(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="activation_tokens",
    )
    access_request = models.ForeignKey(
        AccessRequest,
        on_delete=models.CASCADE,
        related_name="activation_tokens",
    )
    token_hash = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Activation token for {self.user.email}"

    @property
    def is_used(self):
        return self.used_at is not None

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at

    @property
    def is_valid(self):
        return not self.is_used and not self.is_expired

    def mark_as_used(self):
        self.used_at = timezone.now()
        self.save(update_fields=["used_at"])

    @staticmethod
    def hash_token(raw_token: str) -> str:
        return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    @classmethod
    def create_token(cls, user, access_request, expires_in_hours=24):
        raw_token = secrets.token_urlsafe(48)
        token_hash = cls.hash_token(raw_token)

        token = cls.objects.create(
            user=user,
            access_request=access_request,
            token_hash=token_hash,
            expires_at=timezone.now() + timedelta(hours=expires_in_hours),
        )

        return token, raw_token
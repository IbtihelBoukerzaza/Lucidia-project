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
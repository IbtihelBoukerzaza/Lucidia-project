from django.db import models
from companies.models import Company


class InsightReport(models.Model):
    company      = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="insight_reports")
    generated_at = models.DateTimeField(auto_now_add=True)
    content      = models.TextField()        # markdown Arabic report
    period_days  = models.PositiveIntegerField(default=30)

    class Meta:
        ordering = ["-generated_at"]

    def __str__(self):
        return f"InsightReport #{self.pk} — {self.company.name} — {self.generated_at:%Y-%m-%d}"
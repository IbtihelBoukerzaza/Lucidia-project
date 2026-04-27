from django.db import models
from django.conf import settings
from companies.models import Company


class AlertRule(models.Model):

    RULE_TYPES = [
        ("negative_pct_above",  "نسبة السلبي تتجاوز الحد"),
        ("positive_pct_below",  "نسبة الإيجابي تنخفض عن الحد"),
        ("negative_count_above","عدد السلبيات يتجاوز الحد اليومي"),
        ("volume_spike",        "حجم المنشورات اليومية يتجاوز الحد"),
        ("keyword_spike",       "كلمة مفتاحية تتجاوز الحد"),
        ("sentiment_drop",      "انخفاض حاد في الإيجابي مقارنة بالأمس"),
        ("negative_streak",     "السلبي هو الغالب لعدة أيام متتالية"),
    ]

    SEVERITY_CHOICES = [
        ("low",    "منخفض"),
        ("medium", "متوسط"),
        ("high",   "عالٍ"),
    ]

    company    = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="alert_rules")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    rule_type  = models.CharField(max_length=30, choices=RULE_TYPES)
    threshold  = models.FloatField(help_text="الحد الرقمي — نسبة مئوية أو عدد حسب نوع القاعدة")
    keyword    = models.CharField(max_length=200, blank=True, default="",
                                  help_text="فقط لنوع keyword_spike")
    severity   = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default="medium")
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.company.name} — {self.rule_type} ({self.threshold})"


class Alert(models.Model):

    company      = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="alerts")
    rule         = models.ForeignKey(AlertRule, on_delete=models.SET_NULL,
                                     null=True, related_name="alerts")
    message      = models.TextField()
    severity     = models.CharField(max_length=10, choices=AlertRule.SEVERITY_CHOICES)
    is_read      = models.BooleanField(default=False, db_index=True)
    triggered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-triggered_at"]

    def __str__(self):
        return f"{self.company.name} — {self.severity} — {self.triggered_at:%Y-%m-%d}"
import secrets
from django.db import models
from companies.models import Company


class Survey(models.Model):
    SURVEY_TYPES = [
        ("nps",      "Net Promoter Score"),
        ("csat",     "رضا العملاء CSAT"),
        ("feedback", "ملاحظات حرة"),
        ("mixed",    "مختلط"),
    ]

    company     = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="surveys")
    title       = models.CharField(max_length=300)
    description = models.TextField(blank=True, default="")
    survey_type = models.CharField(max_length=20, choices=SURVEY_TYPES, default="mixed")
    token       = models.CharField(max_length=64, unique=True, editable=False)
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    closes_at   = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.company.name} — {self.title}"


class SurveyQuestion(models.Model):
    QUESTION_TYPES = [
        ("text",            "نص حر"),
        ("rating",          "تقييم (1–5)"),
        ("nps",             "NPS (0–10)"),
        ("multiple_choice", "اختيار متعدد"),
    ]

    survey        = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name="questions")
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default="text")
    choices       = models.JSONField(
                        null=True, blank=True,
                        help_text="قائمة الخيارات — فقط لنوع multiple_choice"
                    )
    order         = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"[{self.survey.title}] Q{self.order}: {self.question_text[:60]}"


class SurveyResponse(models.Model):
    survey                = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name="responses")
    submitted_at          = models.DateTimeField(auto_now_add=True)
    respondent_identifier = models.CharField(
                                max_length=64, blank=True, default="",
                                help_text="SHA-256 hash of respondent IP"
                            )

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"Response #{self.pk} → {self.survey.title}"


class QuestionAnswer(models.Model):
    response    = models.ForeignKey(SurveyResponse, on_delete=models.CASCADE, related_name="answers")
    question    = models.ForeignKey(SurveyQuestion, on_delete=models.CASCADE, related_name="answers")
    answer_text = models.TextField(blank=True, default="")
    rating      = models.PositiveSmallIntegerField(null=True, blank=True)
    sentiment   = models.CharField(
                      max_length=10, blank=True, default="",
                      help_text="auto-classified: positive / neutral / negative"
                  )

    def __str__(self):
        return f"Answer #{self.pk} to Q#{self.question_id}"
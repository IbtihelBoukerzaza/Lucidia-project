from rest_framework import serializers
from .models import InsightReport


class InsightReportSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.name", read_only=True)

    class Meta:
        model  = InsightReport
        fields = ["id", "company_name", "generated_at", "content", "period_days"]
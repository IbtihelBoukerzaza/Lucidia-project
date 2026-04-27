from rest_framework import serializers
from .models import AlertRule, Alert


class AlertRuleSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    rule_type_display = serializers.CharField(source="get_rule_type_display", read_only=True)
    severity_display  = serializers.CharField(source="get_severity_display",  read_only=True)

    class Meta:
        model  = AlertRule
        fields = [
            "id", "rule_type", "rule_type_display",
            "threshold", "keyword", "severity", "severity_display",
            "is_active", "created_at", "created_by_name",
        ]
        read_only_fields = ["id", "created_at", "created_by_name",
                            "rule_type_display", "severity_display"]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.first_name or obj.created_by.email
        return ""


class AlertSerializer(serializers.ModelSerializer):
    rule_type    = serializers.CharField(source="rule.rule_type",    read_only=True, default="")
    severity_display = serializers.CharField(source="get_severity_display", read_only=True)

    class Meta:
        model  = Alert
        fields = [
            "id", "message", "severity", "severity_display",
            "is_read", "triggered_at", "rule_type",
        ]
        read_only_fields = fields
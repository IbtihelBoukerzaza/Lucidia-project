from rest_framework import serializers
from .models import PlatformFeedback


class FeedbackSubmitSerializer(serializers.ModelSerializer):
    """Used for POST (submit/update own feedback)."""

    class Meta:
        model = PlatformFeedback
        fields = [
            "id",
            "nps_score",
            "accuracy_rating",
            "usability_rating",
            "coverage_rating",
            "comment",
            "display_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_nps_score(self, value):
        if not 0 <= value <= 10:
            raise serializers.ValidationError("NPS score must be between 0 and 10.")
        return value

    def validate_accuracy_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_usability_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_coverage_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


class TestimonialSerializer(serializers.ModelSerializer):
    """Public-facing — only featured feedback, limited fields."""

    class Meta:
        model = PlatformFeedback
        fields = [
            "id",
            "display_name",
            "nps_score",
            "accuracy_rating",
            "usability_rating",
            "coverage_rating",
            "comment",
            "created_at",
        ]
from rest_framework import serializers
from .models import Survey, SurveyQuestion, SurveyResponse, QuestionAnswer


class SurveyQuestionSerializer(serializers.ModelSerializer):
    question_type_display = serializers.CharField(
        source="get_question_type_display", read_only=True
    )

    class Meta:
        model  = SurveyQuestion
        fields = [
            "id", "question_text", "question_type", "question_type_display",
            "choices", "order",
        ]
        read_only_fields = ["id", "question_type_display"]

    def validate(self, data):
        q_type  = data.get("question_type", "")
        choices = data.get("choices")
        if q_type == "multiple_choice" and not choices:
            raise serializers.ValidationError(
                {"choices": "الخيارات مطلوبة لنوع السؤال اختيار متعدد."}
            )
        return data


class SurveySerializer(serializers.ModelSerializer):
    questions         = SurveyQuestionSerializer(many=True, read_only=True)
    survey_type_display = serializers.CharField(
        source="get_survey_type_display", read_only=True
    )
    response_count    = serializers.SerializerMethodField()
    public_url        = serializers.SerializerMethodField()

    class Meta:
        model  = Survey
        fields = [
            "id", "title", "description", "survey_type", "survey_type_display",
            "token", "is_active", "created_at", "closes_at",
            "questions", "response_count", "public_url",
        ]
        read_only_fields = [
            "id", "token", "created_at", "questions",
            "survey_type_display", "response_count", "public_url",
        ]

    def get_response_count(self, obj):
        return obj.responses.count()

    def get_public_url(self, obj):
        request = self.context.get("request")
        if request:
            frontend = request.build_absolute_uri("/").rstrip("/")
            # point to the React public survey page
            return f"{frontend}/s/{obj.token}"
        return f"/s/{obj.token}"


class QuestionAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source="question.question_text", read_only=True)
    question_type = serializers.CharField(source="question.question_type", read_only=True)

    class Meta:
        model  = QuestionAnswer
        fields = ["id", "question", "question_text", "question_type",
                  "answer_text", "rating", "sentiment"]
        read_only_fields = ["id", "question_text", "question_type", "sentiment"]


class SurveyResponseSerializer(serializers.ModelSerializer):
    answers = QuestionAnswerSerializer(many=True, read_only=True)

    class Meta:
        model  = SurveyResponse
        fields = ["id", "submitted_at", "answers"]
        read_only_fields = fields


# ── Public submission serializer (used by respondents) ────────────────────────

class AnswerSubmitSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    answer_text = serializers.CharField(required=False, allow_blank=True, default="")
    rating      = serializers.IntegerField(required=False, allow_null=True, default=None)


class SurveySubmitSerializer(serializers.Serializer):
    answers = AnswerSubmitSerializer(many=True)
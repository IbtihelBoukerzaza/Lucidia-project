import hashlib
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from companies.models import Membership
from .models import Survey, SurveyQuestion, SurveyResponse, QuestionAnswer
from .serializers import (
    SurveySerializer,
    SurveyQuestionSerializer,
    SurveyResponseSerializer,
    SurveySubmitSerializer,
)

# Try to import sentiment predictor — graceful fallback if models not loaded
try:
    from sentiment_engine.predictor import predict
    SENTIMENT_AVAILABLE = True
except Exception:
    SENTIMENT_AVAILABLE = False


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_company_id(request):
    company_id = request.query_params.get("company")
    if not company_id:
        return None, Response(
            {"detail": "يجب تحديد معرّف الشركة (company)."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return company_id, None


def _get_membership(user, company_id):
    return Membership.objects.filter(user=user, company_id=company_id).first()


def _is_admin(user, company_id):
    m = _get_membership(user, company_id)
    return m and m.role == "admin"


def _hash_ip(request):
    ip = (
        request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip()
        or request.META.get("REMOTE_ADDR", "")
    )
    return hashlib.sha256(ip.encode()).hexdigest()[:64]


# ── Survey List + Create ──────────────────────────────────────────────────────

class SurveyListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company_id, err = _get_company_id(request)
        if err:
            return err
        if not _get_membership(request.user, company_id):
            return Response({"detail": "غير مصرح."}, status=403)

        surveys = Survey.objects.filter(company_id=company_id).prefetch_related("questions")
        return Response(
            SurveySerializer(surveys, many=True, context={"request": request}).data
        )

    def post(self, request):
        company_id, err = _get_company_id(request)
        if err:
            return err
        if not _is_admin(request.user, company_id):
            return Response({"detail": "الإنشاء للمسؤولين فقط."}, status=403)

        serializer = SurveySerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        serializer.save(company_id=company_id)
        return Response(serializer.data, status=201)


# ── Survey Detail + Edit + Delete ─────────────────────────────────────────────

class SurveyDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_survey(self, pk, user):
        try:
            survey = Survey.objects.prefetch_related("questions").get(pk=pk)
        except Survey.DoesNotExist:
            return None, Response({"detail": "الاستطلاع غير موجود."}, status=404)
        if not _get_membership(user, survey.company_id):
            return None, Response({"detail": "غير مصرح."}, status=403)
        return survey, None

    def get(self, request, pk):
        survey, err = self._get_survey(pk, request.user)
        if err:
            return err
        return Response(
            SurveySerializer(survey, context={"request": request}).data
        )

    def patch(self, request, pk):
        survey, err = self._get_survey(pk, request.user)
        if err:
            return err
        if not _is_admin(request.user, survey.company_id):
            return Response({"detail": "التعديل للمسؤولين فقط."}, status=403)

        serializer = SurveySerializer(
            survey, data=request.data, partial=True, context={"request": request}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        survey, err = self._get_survey(pk, request.user)
        if err:
            return err
        if not _is_admin(request.user, survey.company_id):
            return Response({"detail": "الحذف للمسؤولين فقط."}, status=403)
        survey.delete()
        return Response(status=204)


# ── Questions ─────────────────────────────────────────────────────────────────

class SurveyQuestionListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_survey(self, pk, user):
        try:
            survey = Survey.objects.get(pk=pk)
        except Survey.DoesNotExist:
            return None, Response({"detail": "الاستطلاع غير موجود."}, status=404)
        if not _is_admin(user, survey.company_id):
            return None, Response({"detail": "للمسؤولين فقط."}, status=403)
        return survey, None

    def get(self, request, pk):
        survey, err = self._get_survey(pk, request.user)
        if err:
            return err
        questions = survey.questions.all()
        return Response(SurveyQuestionSerializer(questions, many=True).data)

    def post(self, request, pk):
        survey, err = self._get_survey(pk, request.user)
        if err:
            return err

        serializer = SurveyQuestionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save(survey=survey)
        return Response(serializer.data, status=201)


class SurveyQuestionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_question(self, survey_pk, question_pk, user):
        try:
            survey = Survey.objects.get(pk=survey_pk)
        except Survey.DoesNotExist:
            return None, Response({"detail": "الاستطلاع غير موجود."}, status=404)
        if not _is_admin(user, survey.company_id):
            return None, Response({"detail": "للمسؤولين فقط."}, status=403)
        try:
            question = SurveyQuestion.objects.get(pk=question_pk, survey=survey)
        except SurveyQuestion.DoesNotExist:
            return None, Response({"detail": "السؤال غير موجود."}, status=404)
        return question, None

    def patch(self, request, pk, question_pk):
        question, err = self._get_question(pk, question_pk, request.user)
        if err:
            return err
        serializer = SurveyQuestionSerializer(question, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk, question_pk):
        question, err = self._get_question(pk, question_pk, request.user)
        if err:
            return err
        question.delete()
        return Response(status=204)


# ── Responses (admin view) ────────────────────────────────────────────────────

class SurveyResponseListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            survey = Survey.objects.get(pk=pk)
        except Survey.DoesNotExist:
            return Response({"detail": "الاستطلاع غير موجود."}, status=404)
        if not _get_membership(request.user, survey.company_id):
            return Response({"detail": "غير مصرح."}, status=403)

        responses = survey.responses.prefetch_related("answers__question").all()
        return Response(SurveyResponseSerializer(responses, many=True).data)


# ── Analytics ─────────────────────────────────────────────────────────────────

class SurveyAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            survey = Survey.objects.prefetch_related("questions").get(pk=pk)
        except Survey.DoesNotExist:
            return Response({"detail": "الاستطلاع غير موجود."}, status=404)
        if not _get_membership(request.user, survey.company_id):
            return Response({"detail": "غير مصرح."}, status=403)

        total_responses = survey.responses.count()
        questions_data  = []

        for question in survey.questions.all():
            answers = QuestionAnswer.objects.filter(question=question)
            q_data  = {
                "question_id":   question.id,
                "question_text": question.question_text,
                "question_type": question.question_type,
                "answer_count":  answers.count(),
            }

            if question.question_type in ("rating", "nps"):
                ratings = [a.rating for a in answers if a.rating is not None]
                q_data["average_rating"] = (
                    round(sum(ratings) / len(ratings), 2) if ratings else None
                )
                q_data["rating_distribution"] = {}
                for r in ratings:
                    key = str(r)
                    q_data["rating_distribution"][key] = (
                        q_data["rating_distribution"].get(key, 0) + 1
                    )

                # NPS score: promoters (9-10) minus detractors (0-6)
                if question.question_type == "nps" and ratings:
                    promoters  = sum(1 for r in ratings if r >= 9)
                    detractors = sum(1 for r in ratings if r <= 6)
                    total      = len(ratings)
                    q_data["nps_score"] = round(
                        ((promoters - detractors) / total) * 100, 1
                    )

            elif question.question_type == "multiple_choice":
                distribution = {}
                for a in answers:
                    key = a.answer_text.strip()
                    if key:
                        distribution[key] = distribution.get(key, 0) + 1
                q_data["choice_distribution"] = distribution

            elif question.question_type == "text":
                sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0, "": 0}
                for a in answers:
                    s = a.sentiment or ""
                    sentiment_counts[s] = sentiment_counts.get(s, 0) + 1
                q_data["sentiment_breakdown"] = {
                    k: v for k, v in sentiment_counts.items() if k
                }

            questions_data.append(q_data)

        return Response({
            "survey_id":       survey.id,
            "title":           survey.title,
            "total_responses": total_responses,
            "questions":       questions_data,
        })


# ── Public endpoint (no auth) ─────────────────────────────────────────────────

class PublicSurveyView(APIView):
    permission_classes = [AllowAny]

    def _get_active_survey(self, token):
        try:
            survey = Survey.objects.prefetch_related("questions").get(token=token)
        except Survey.DoesNotExist:
            return None, Response({"detail": "الاستطلاع غير موجود."}, status=404)

        if not survey.is_active:
            return None, Response({"detail": "هذا الاستطلاع مغلق."}, status=410)

        if survey.closes_at and survey.closes_at < timezone.now():
            return None, Response({"detail": "انتهت مدة هذا الاستطلاع."}, status=410)

        return survey, None

    def get(self, request, token):
        """Return survey structure to the public respondent."""
        survey, err = self._get_active_survey(token)
        if err:
            return err
        return Response(SurveySerializer(survey, context={"request": request}).data)

    def post(self, request, token):
        """Accept and store a survey submission."""
        survey, err = self._get_active_survey(token)
        if err:
            return err

        serializer = SurveySubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        # Validate all question IDs belong to this survey
        valid_ids = set(survey.questions.values_list("id", flat=True))
        for ans in serializer.validated_data["answers"]:
            if ans["question_id"] not in valid_ids:
                return Response(
                    {"detail": f"معرّف السؤال {ans['question_id']} غير صحيح."},
                    status=400,
                )

        # Create response record
        survey_response = SurveyResponse.objects.create(
            survey=survey,
            respondent_identifier=_hash_ip(request),
        )

        # Save each answer
        questions_map = {q.id: q for q in survey.questions.all()}
        for ans in serializer.validated_data["answers"]:
            question  = questions_map[ans["question_id"]]
            sentiment = ""

            # Auto-classify text answers using our sentiment engine
            text = ans.get("answer_text", "").strip()
            if question.question_type == "text" and text and SENTIMENT_AVAILABLE:
                try:
                    result    = predict(text)
                    sentiment = result.get("label", "")
                except Exception:
                    sentiment = ""

            QuestionAnswer.objects.create(
                response    = survey_response,
                question    = question,
                answer_text = text,
                rating      = ans.get("rating"),
                sentiment   = sentiment,
            )

        return Response({"detail": "تم إرسال إجاباتك بنجاح. شكراً لك!"}, status=201)
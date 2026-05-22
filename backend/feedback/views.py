from django.db.models import Avg, Count
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PlatformFeedback
from .serializers import FeedbackSubmitSerializer, TestimonialSerializer


class FeedbackSubmitView(APIView):
    """
    GET  /api/feedback/mine/   — return current user's feedback (or 404)
    POST /api/feedback/mine/   — create or update current user's feedback
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            feedback = PlatformFeedback.objects.get(user=request.user)
            return Response(FeedbackSubmitSerializer(feedback).data)
        except PlatformFeedback.DoesNotExist:
            return Response({"detail": "No feedback submitted yet."}, status=404)

    def post(self, request):
        # Upsert: update if exists, create if not
        try:
            feedback = PlatformFeedback.objects.get(user=request.user)
            serializer = FeedbackSubmitSerializer(
                feedback, data=request.data, partial=True
            )
        except PlatformFeedback.DoesNotExist:
            serializer = FeedbackSubmitSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TestimonialsView(APIView):
    """
    GET /api/feedback/testimonials/ — public, returns featured feedback only.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        qs = PlatformFeedback.objects.filter(
            is_featured=True,
            comment__gt="",       # only ones with actual text
        ).order_by("-created_at")
        return Response(TestimonialSerializer(qs, many=True).data)


class FeedbackStatsView(APIView):
    """
    GET /api/feedback/stats/ — public aggregate stats for homepage.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        qs = PlatformFeedback.objects.all()
        total = qs.count()

        if total == 0:
            return Response({
                "total": 0,
                "nps_score": None,
                "avg_accuracy": None,
                "avg_usability": None,
                "avg_coverage": None,
            })

        # NPS = %promoters (9-10) - %detractors (0-6)
        promoters  = qs.filter(nps_score__gte=9).count()
        detractors = qs.filter(nps_score__lte=6).count()
        nps = round(((promoters - detractors) / total) * 100)

        agg = qs.aggregate(
            avg_accuracy=Avg("accuracy_rating"),
            avg_usability=Avg("usability_rating"),
            avg_coverage=Avg("coverage_rating"),
        )

        return Response({
            "total":        total,
            "nps_score":    nps,
            "avg_accuracy":  round(agg["avg_accuracy"],  1),
            "avg_usability": round(agg["avg_usability"], 1),
            "avg_coverage":  round(agg["avg_coverage"],  1),
        })
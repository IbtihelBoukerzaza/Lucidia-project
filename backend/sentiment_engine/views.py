from __future__ import annotations

import re
from collections import Counter
from datetime import timedelta

from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

from companies.models import Membership
from posts.models import Post


ARABIC_STOP_WORDS = {
    "في", "من", "على", "إلى", "عن", "مع", "هذا", "هذه", "التي", "الذي",
    "وهو", "وهي", "أن", "كان", "كانت", "قد", "لا", "ما", "كل", "بعد",
    "قبل", "حتى", "أو", "وفي", "ولا", "ومن", "وعلى", "أي", "بين", "عند",
    "منذ", "لكن", "إن", "كما", "غير", "فقط", "هو", "هي", "هم", "نحن",
    "أنا", "أنت", "لم", "لن", "له", "لها", "لهم", "بها", "به", "بهم",
    "وكان", "وكانت", "وقد", "فإن", "ذلك", "تلك", "هناك", "حيث", "إذا",
    "the", "and", "of", "to", "in", "a", "is", "that", "for", "on",
    "are", "with", "as", "at", "be", "by", "this", "was", "it", "an",
}


def _get_company_or_403(request) -> tuple[int | None, Response | None]:
    """Validate company param and membership. Returns (company_id, None) or (None, error_response)."""
    company_param = request.query_params.get("company")
    if not company_param:
        return None, Response({"detail": "company parameter is required."}, status=400)
    try:
        company_id = int(company_param)
    except ValueError:
        return None, Response({"detail": "Invalid company id."}, status=400)

    if not Membership.objects.filter(user=request.user, company_id=company_id).exists():
        return None, Response({"detail": "ليس لديك صلاحية الوصول لهذه الشركة."}, status=403)

    return company_id, None


def _base_qs(company_id: int):
    return Post.objects.filter(company_id=company_id, sentiment__isnull=False)


class SentimentDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company_id, err = _get_company_or_403(request)
        if err:
            return err

        qs = _base_qs(company_id)
        total = qs.count()

        counts = (
            qs.values("sentiment")
            .annotate(count=Count("id"))
            .order_by("sentiment")
        )

        distribution = {"positive": 0, "neutral": 0, "negative": 0}
        for row in counts:
            distribution[row["sentiment"]] = row["count"]

        def pct(n):
            return round(n / total * 100, 1) if total else 0.0

        return Response({
            "total": total,
            "distribution": {
                label: {
                    "count": count,
                    "percentage": pct(count),
                }
                for label, count in distribution.items()
            },
        })


class SentimentTimelineView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company_id, err = _get_company_or_403(request)
        if err:
            return err

        days = int(request.query_params.get("days", 30))
        since = timezone.now() - timedelta(days=days)

        rows = (
            _base_qs(company_id)
            .filter(created_at__gte=since)
            .annotate(date=TruncDate("created_at"))
            .values("date", "sentiment")
            .annotate(count=Count("id"))
            .order_by("date")
        )

        # Build a dict keyed by date
        timeline: dict[str, dict] = {}
        for row in rows:
            d = str(row["date"])
            if d not in timeline:
                timeline[d] = {"date": d, "positive": 0, "neutral": 0, "negative": 0}
            timeline[d][row["sentiment"]] = row["count"]

        return Response({"timeline": sorted(timeline.values(), key=lambda x: x["date"])})


class SentimentPostsPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class SentimentPostsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company_id, err = _get_company_or_403(request)
        if err:
            return err

        qs = _base_qs(company_id).select_related("company")

        sentiment_filter = request.query_params.get("sentiment")
        if sentiment_filter in ("positive", "neutral", "negative"):
            qs = qs.filter(sentiment=sentiment_filter)

        source_filter = request.query_params.get("source")
        if source_filter:
            qs = qs.filter(source=source_filter)

        paginator = SentimentPostsPagination()
        page = paginator.paginate_queryset(qs, request)

        data = [
            {
                "id": p.id,
                "text": p.text,
                "source": p.source,
                "platform": p.platform,
                "author": p.author,
                "url": p.url,
                "created_at": p.created_at,
                "sentiment": p.sentiment,
                "sentiment_score": p.sentiment_score,
                "sentiment_scores": p.sentiment_scores,
            }
            for p in page
        ]

        return paginator.get_paginated_response(data)


class SentimentKeywordsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company_id, err = _get_company_or_403(request)
        if err:
            return err

        top_n = int(request.query_params.get("top", 10))

        result = {}
        for label in ("positive", "neutral", "negative"):
            texts = (
                _base_qs(company_id)
                .filter(sentiment=label)
                .values_list("text", flat=True)[:500]
            )
            words = []
            for text in texts:
                tokens = re.findall(r"[\u0600-\u06FFa-zA-Z]{3,}", text)
                words.extend(
                    t for t in tokens if t.lower() not in ARABIC_STOP_WORDS
                )
            counter = Counter(words)
            result[label] = [
                {"word": w, "count": c}
                for w, c in counter.most_common(top_n)
            ]

        return Response({"keywords": result})
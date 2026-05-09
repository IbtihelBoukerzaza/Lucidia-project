from __future__ import annotations

import re
from collections import Counter, defaultdict
from datetime import timedelta
from itertools import combinations

from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from companies.models import Membership
from posts.models import Post

# ── stop words (same set used in sentiment_engine) ──────────────────────────
STOP_WORDS = {
    "في", "من", "على", "إلى", "عن", "مع", "هذا", "هذه", "التي", "الذي",
    "وهو", "وهي", "أن", "كان", "كانت", "قد", "لا", "ما", "كل", "بعد",
    "قبل", "حتى", "أو", "وفي", "ولا", "ومن", "وعلى", "أي", "بين", "عند",
    "منذ", "لكن", "إن", "كما", "غير", "فقط", "هو", "هي", "هم", "نحن",
    "أنا", "أنت", "لم", "لن", "له", "لها", "لهم", "بها", "به", "بهم",
    "وكان", "وكانت", "وقد", "فإن", "ذلك", "تلك", "هناك", "حيث", "إذا",
    "the", "and", "of", "to", "in", "a", "is", "that", "for", "on",
    "are", "with", "as", "at", "be", "by", "this", "was", "it", "an",
    "also", "its", "or", "but", "not", "an", "we", "our", "you", "their",
}


def _check_membership(request) -> tuple[int | None, Response | None]:
    """Returns (company_id, None) or (None, error Response)."""
    param = request.query_params.get("company")
    if not param:
        return None, Response({"detail": "company parameter is required."}, status=400)
    try:
        company_id = int(param)
    except ValueError:
        return None, Response({"detail": "Invalid company id."}, status=400)
    if not Membership.objects.filter(user=request.user, company_id=company_id).exists():
        return None, Response({"detail": "ليس لديك صلاحية الوصول لهذه الشركة."}, status=403)
    return company_id, None


def _tokenize(text: str) -> list[str]:
    """Extract meaningful tokens (≥3 chars, not a stop word)."""
    tokens = re.findall(r"[\u0600-\u06FFa-zA-Z]{3,}", text)
    return [t for t in tokens if t.lower() not in STOP_WORDS]


def _posts_qs(company_id: int):
    return Post.objects.filter(company_id=company_id)


# ── Views ────────────────────────────────────────────────────────────────────

class TopKeywordsView(APIView):
    """GET /api/topics/top/?company=<id>&top=20"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company_id, err = _check_membership(request)
        if err:
            return err

        top_n = min(int(request.query_params.get("top", 20)), 100)

        texts = _posts_qs(company_id).values_list("text", flat=True)[:2000]
        counter: Counter = Counter()
        for text in texts:
            counter.update(_tokenize(text))

        return Response({
            "top": [
                {"word": w, "count": c}
                for w, c in counter.most_common(top_n)
            ]
        })


class KeywordTrendsView(APIView):
    """GET /api/topics/trends/?company=<id>&days=30&top=10"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company_id, err = _check_membership(request)
        if err:
            return err

        days = int(request.query_params.get("days", 30))
        top_n = min(int(request.query_params.get("top", 10)), 20)
        since = timezone.now() - timedelta(days=days)

        # Step 1: find the global top-N keywords over the period
        texts_all = (
            _posts_qs(company_id)
            .filter(created_at__gte=since)
            .values_list("text", flat=True)[:3000]
        )
        global_counter: Counter = Counter()
        for text in texts_all:
            global_counter.update(_tokenize(text))
        top_words = [w for w, _ in global_counter.most_common(top_n)]

        if not top_words:
            return Response({"keywords": top_words, "timeline": []})

        # Step 2: per-day counts for those top words
        rows = (
            _posts_qs(company_id)
            .filter(created_at__gte=since)
            .annotate(date=TruncDate("created_at"))
            .values("date", "text")
            .order_by("date")
        )

        # date → word → count
        day_word: dict[str, Counter] = defaultdict(Counter)
        for row in rows:
            date_str = str(row["date"])
            for token in _tokenize(row["text"]):
                if token in top_words:
                    day_word[date_str][token] += 1

        # Build timeline list
        timeline = []
        for date_str in sorted(day_word.keys()):
            entry = {"date": date_str}
            for w in top_words:
                entry[w] = day_word[date_str].get(w, 0)
            timeline.append(entry)

        return Response({"keywords": top_words, "timeline": timeline})


class KeywordsBySourceView(APIView):
    """GET /api/topics/by-source/?company=<id>&top=10"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company_id, err = _check_membership(request)
        if err:
            return err

        top_n = min(int(request.query_params.get("top", 10)), 50)

        sources = (
            _posts_qs(company_id)
            .values_list("source", flat=True)
            .distinct()
        )

        result = {}
        for source in sources:
            texts = (
                _posts_qs(company_id)
                .filter(source=source)
                .values_list("text", flat=True)[:500]
            )
            counter: Counter = Counter()
            for text in texts:
                counter.update(_tokenize(text))
            result[source] = [
                {"word": w, "count": c}
                for w, c in counter.most_common(top_n)
            ]

        return Response({"by_source": result})


class CoOccurrenceView(APIView):
    """GET /api/topics/co-occurrence/?company=<id>&top=10"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company_id, err = _check_membership(request)
        if err:
            return err

        top_n = min(int(request.query_params.get("top", 10)), 50)

        texts = _posts_qs(company_id).values_list("text", flat=True)[:1000]
        pair_counter: Counter = Counter()

        for text in texts:
            tokens = list(set(_tokenize(text)))  # unique per post
            if len(tokens) < 2:
                continue
            # Only consider top-frequency tokens to keep pairs meaningful
            for pair in combinations(sorted(tokens), 2):
                pair_counter[pair] += 1

        return Response({
            "pairs": [
                {"word_a": a, "word_b": b, "count": c}
                for (a, b), c in pair_counter.most_common(top_n)
            ]
        })
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

# ── stop words ───────────────────────────────────────────────────────────────
STOP_WORDS = {
    # --- Standard Arabic function words ---
    "في", "من", "على", "إلى", "عن", "مع", "هذا", "هذه", "التي", "الذي",
    "وهو", "وهي", "أن", "كان", "كانت", "قد", "لا", "ما", "كل", "بعد",
    "قبل", "حتى", "أو", "وفي", "ولا", "ومن", "وعلى", "أي", "بين", "عند",
    "منذ", "لكن", "إن", "كما", "غير", "فقط", "هو", "هي", "هم", "نحن",
    "أنا", "أنت", "لم", "لن", "له", "لها", "لهم", "بها", "به", "بهم",
    "وكان", "وكانت", "وقد", "فإن", "ذلك", "تلك", "هناك", "حيث", "إذا",
    "إلا", "أيضا", "أيضاً", "عبر", "حول", "خلال", "ضد", "دون", "تم",
    "يتم", "كذلك", "ثم", "بل", "رغم", "نحو", "لدى", "لدي", "لديه",
    "لديها", "عليه", "عليها", "عليهم", "منه", "منها", "منهم", "إذ",
    "بعض", "جميع", "هل", "لو", "يكون", "تكون", "مما", "معه", "معها",
    "فيه", "فيها", "فيهم", "عنه", "عنها", "عنهم", "وإن", "ولو", "وأن",
    "بأن", "لأن", "لأنه", "لأنها", "حين", "كانوا", "وهذا", "عليكم",
    # --- Arabic greetings / filler ---
    "السلام", "خويا", "الإذاعة",
    # --- Algerian dialect particles ---
    "اللي", "هاد", "هاذا", "هاذي", "واش", "راه", "باش", "ماشي",
    "كيف", "وين", "فين", "علاش", "كيما", "بزاف", "يزي", "عندي",
    # --- Algerian geo / demographic noise ---
    "الجزائر", "الجزائري", "الجزائرية", "الجزائريين", "الجزائريات",
    "وطني", "وطنية", "محلي", "محلية", "عربي", "عربية",
    "Algeria", "algerie", "Algerie", "Alger", "Kabylie",
    # --- Algerian media / newspaper names ---
    "الشروق", "النهار", "الخبر", "الوطن", "المساء", "الأحداث",
    "البلاد", "الأمة", "الفجر", "الحوار", "الهداف",
    "Moudjahid", "Gazette", "Fennec", "horizons", "internews",
    "Watan", "Courrier", "Soir", "soir", "Matin", "Zerrouki",
    "echorouk", "ennahar", "elkhabar",
    # --- Sports noise ---
    "Ligue", "ligue", "football", "Football", "Competition", "competition",
    "matchs", "champion", "podium", "calendrier", "club", "Europe", "Africa",
    "JSK", "MCA", "USMA", "CRB", "NAHD", "ASO", "بلوزداد",
    "الرابطة", "الأولى", "المحترفة", "الكرة", "المباراة", "الدوري",
    "الكأس", "المنتخب", "الملعب", "اللاعب", "الجولة", "بطولة",
    "مولودية", "شباب", "شبيبة", "اتحاد", "Saoura", "Akbou",
    # --- Religious content (unrelated to Mobilis) ---
    "الله", "اللهم", "سيدنا", "صلاة", "محمد", "النبي", "رسول",
    # --- Encoding fragments from accented French ---
    "Alg", "alg", "rie", "rien", "abonn", "seau", "jour", "journ", "patrie",
    # --- URL / web noise ---
    "http", "https", "www", "com", "site", "news", "News",
    # --- Social platform names ---
    "twitter", "Twitter", "facebook", "Facebook",
    "instagram", "Instagram", "youtube", "Youtube", "YouTube",
    "tiktok", "TikTok", "تويتر", "فيسبوك", "انستغرام", "يوتيوب",
    # --- French stopwords ---
    "les", "des", "pour", "sur", "ses", "son", "une", "par", "dans",
    "avec", "qui", "que", "mise", "face", "nouveau", "nouvelle", "sous",
    "le", "la", "de", "du", "un", "et", "en", "au", "aux",
    "est", "sont", "mais", "pas", "plus", "tout", "tous", "toute",
    "très", "bien", "aussi", "comme", "cette", "cet", "ces",
    "elle", "lui", "ils", "ont", "faire", "lance",
    # --- English stopwords ---
    "the", "and", "for", "that", "with", "from", "this", "are",
    "also", "its", "not", "but", "our", "you", "their", "have",
    "been", "will", "said", "were", "more", "about", "just",
    "fort", "than", "some", "what",
}


def _check_membership(request) -> tuple[int | None, Response | None]:
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
    """
    Extract meaningful tokens.
    - Only matches Arabic script or plain ASCII letters (no accented Latin).
      This naturally drops encoding fragments like 'Alg'+'rie' from 'Algérie'.
    - Minimum 4 chars.
    - Case-insensitive stopword check.
    """
    tokens = re.findall(r"[\u0600-\u06FFa-zA-Z]{4,}", text)
    return [t for t in tokens if t not in STOP_WORDS and t.lower() not in STOP_WORDS]


def _posts_qs(company_id: int):
    return Post.objects.filter(company_id=company_id)


# ── Views ─────────────────────────────────────────────────────────────────────

class TopKeywordsView(APIView):
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
            "top": [{"word": w, "count": c} for w, c in counter.most_common(top_n)]
        })


class KeywordTrendsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company_id, err = _check_membership(request)
        if err:
            return err
        days = int(request.query_params.get("days", 30))
        top_n = min(int(request.query_params.get("top", 10)), 20)
        since = timezone.now() - timedelta(days=days)

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

        rows = (
            _posts_qs(company_id)
            .filter(created_at__gte=since)
            .annotate(date=TruncDate("created_at"))
            .values("date", "text")
            .order_by("date")
        )
        day_word: dict[str, Counter] = defaultdict(Counter)
        for row in rows:
            date_str = str(row["date"])
            for token in _tokenize(row["text"]):
                if token in top_words:
                    day_word[date_str][token] += 1

        timeline = []
        for date_str in sorted(day_word.keys()):
            entry = {"date": date_str}
            for w in top_words:
                entry[w] = day_word[date_str].get(w, 0)
            timeline.append(entry)

        return Response({"keywords": top_words, "timeline": timeline})


class KeywordsBySourceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company_id, err = _check_membership(request)
        if err:
            return err
        top_n = min(int(request.query_params.get("top", 10)), 50)

        # Single query — fetch source + text together, no per-source loops
        rows = (
            _posts_qs(company_id)
            .values_list("source", "text")[:3000]
        )

        # Group in Python
        source_counters: dict[str, Counter] = defaultdict(Counter)
        for source, text in rows:
            source_counters[source].update(_tokenize(text))

        if not source_counters:
            return Response({"by_source": {}})

        result = {
            source: [
                {"word": w, "count": c}
                for w, c in counter.most_common(top_n)
            ]
            for source, counter in source_counters.items()
            if counter
        }

        return Response({"by_source": result})

class CoOccurrenceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company_id, err = _check_membership(request)
        if err:
            return err
        top_n = min(int(request.query_params.get("top", 10)), 50)

        texts = _posts_qs(company_id).values_list("text", flat=True)[:1000]
        pair_counter: Counter = Counter()
        for text in texts:
            tokens = list(set(_tokenize(text)))
            if len(tokens) < 2:
                continue
            for pair in combinations(sorted(tokens), 2):
                pair_counter[pair] += 1

        return Response({
            "pairs": [
                {"word_a": a, "word_b": b, "count": c}
                for (a, b), c in pair_counter.most_common(top_n)
            ]
        })
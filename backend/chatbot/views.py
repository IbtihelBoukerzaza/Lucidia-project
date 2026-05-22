from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from collections import Counter
import re
import requests

from companies.models import Company, Membership
from posts.models import Post
from alerts.models import Alert


# ── data context ─────────────────────────────────────────────────────────────

def _get_company_context(company, lang="ar"):
    """Pull live company data to inject into the system prompt."""
    since = timezone.now() - timedelta(days=30)
    posts_qs = Post.objects.filter(company=company, created_at__gte=since)
    total = posts_qs.count()

    counts = {"positive": 0, "negative": 0, "neutral": 0}
    for p in posts_qs.values("sentiment"):
        s = p["sentiment"]
        if s in counts:
            counts[s] += 1

    pct = {k: round(v / total * 100, 1) if total else 0 for k, v in counts.items()}

    words = []
    for p in posts_qs.values("text"):
        words += re.findall(r"[\u0600-\u06FF]+", p["text"] or "")
    STOPWORDS = {"في", "من", "على", "إلى", "عن", "مع", "هذا", "هذه", "أن", "كان", "التي", "الذي"}
    top_keywords = [w for w, _ in Counter(words).most_common(30) if w not in STOPWORDS][:15]

    recent_alerts = list(
        Alert.objects.filter(rule__company=company)
        .order_by("-triggered_at")[:10]
        .values("message", "severity", "triggered_at")
    )
    alerts_text = "\n".join(
        f"- [{a['severity']}] {a['message']}"
        for a in recent_alerts
    ) or ("No recent alerts." if lang == "en" else "لا توجد تنبيهات حديثة." if lang == "ar" else "Aucune alerte récente.")

    keywords_text = "، ".join(top_keywords) or "—"

    if lang == "en":
        return f"""Company: {company.name}
Period: Last 30 days
Total posts: {total}
Positive: {counts['positive']} ({pct['positive']}%)
Negative: {counts['negative']} ({pct['negative']}%)
Neutral: {counts['neutral']} ({pct['neutral']}%)
Top keywords: {keywords_text}
Recent alerts:
{alerts_text}"""
    elif lang == "fr":
        return f"""Entreprise : {company.name}
Période : 30 derniers jours
Total publications : {total}
Positif : {counts['positive']} ({pct['positive']}%)
Négatif : {counts['negative']} ({pct['negative']}%)
Neutre : {counts['neutral']} ({pct['neutral']}%)
Mots-clés principaux : {keywords_text}
Alertes récentes :
{alerts_text}"""
    else:
        return f"""الشركة: {company.name}
الفترة: آخر 30 يوماً
إجمالي المنشورات: {total}
إيجابي: {counts['positive']} ({pct['positive']}%)
سلبي: {counts['negative']} ({pct['negative']}%)
محايد: {counts['neutral']} ({pct['neutral']}%)
أبرز الكلمات: {keywords_text}
التنبيهات الأخيرة:
{alerts_text}"""


def _build_system_prompt(company, lang="ar"):
    context = _get_company_context(company, lang)

    return f"""You are Gantra AI, an intelligent assistant specialized in social media sentiment analysis for the Algerian market.
You help users understand their company's sentiment data, trends, keywords, and alerts.

CRITICAL LANGUAGE RULE: Always respond in the SAME language the user writes in.
- If the user writes in Arabic → respond in Arabic
- If the user writes in French → respond in French  
- If the user writes in English → respond in English
- If the user mixes languages → use the dominant language

Be concise, data-driven, and helpful.
If asked about something outside sentiment analysis or company data, politely decline in the user's language.

Current company data for {company.name}:
{context}"""

# ── view ─────────────────────────────────────────────────────────────────────

class ChatMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message    = (request.data.get("message") or "").strip()
        history    = request.data.get("history", [])   # list of {role, content}
        company_id = request.data.get("company_id")
        lang       = request.data.get("lang", "ar")

        if not message:
            return Response({"error": "message is required."}, status=400)
        if not company_id:
            return Response({"error": "company_id is required."}, status=400)

        try:
            company = Company.objects.get(pk=company_id)
        except Company.DoesNotExist:
            return Response({"error": "Company not found."}, status=404)

        # verify membership
        is_member = Membership.objects.filter(
            user=request.user, company=company
        ).exists()
        if not is_member:
            return Response({"error": "Access denied."}, status=403)

        system_prompt = _build_system_prompt(company, lang)

        # build messages list for Groq
        messages = []
        for turn in history[-10:]:   # keep last 10 turns to stay within token limit
            role    = turn.get("role")
            content = turn.get("content", "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": message})

        try:
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        *messages,
                    ],
                    "max_tokens": 1024,
                    "temperature": 0.5,
                },
                timeout=30,
            )
            resp.raise_for_status()
            reply = resp.json()["choices"][0]["message"]["content"]
        except Exception as e:
            return Response({"error": str(e)}, status=500)

        return Response({"reply": reply})
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from companies.models import Company, Membership
from posts.models import Post
from alerts.models import Alert

from .models import InsightReport
from .serializers import InsightReportSerializer

from django.conf import settings
from django.utils import timezone
from datetime import timedelta

import requests


# ── helpers ──────────────────────────────────────────────────────────────────

def _check_admin(request, company_id):
    """Return (company, None) if requester is admin, else (None, Response error)."""
    try:
        company = Company.objects.get(pk=company_id)
    except Company.DoesNotExist:
        return None, Response({"error": "Company not found."}, status=404)
    is_admin = Membership.objects.filter(
        user=request.user, company=company, role=Membership.Role.ADMIN
    ).exists()
    if not is_admin:
        return None, Response({"error": "Admin only."}, status=403)
    return company, None


def _gather_data(company, period_days):
    """Collect all data needed for the report and return a structured dict."""
    since = timezone.now() - timedelta(days=period_days)

    posts_qs = Post.objects.filter(company=company, created_at__gte=since)
    total    = posts_qs.count()

    sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0}
    for post in posts_qs.values("sentiment"):
        s = post["sentiment"]
        if s in sentiment_counts:
            sentiment_counts[s] += 1

    pct = {}
    for k, v in sentiment_counts.items():
        pct[k] = round((v / total * 100), 1) if total else 0

    # top 20 keywords from posts text (simple frequency — topics app not imported here)
    from collections import Counter
    import re
    words = []
    for p in posts_qs.values("text"):
        words += re.findall(r"[\u0600-\u06FF]+", p["text"] or "")
    STOPWORDS = {"في", "من", "على", "إلى", "عن", "مع", "هذا", "هذه", "أن", "كان", "التي", "الذي", "وهو", "وهي"}
    top_keywords = [w for w, _ in Counter(words).most_common(30) if w not in STOPWORDS][:20]

    # last 30 alerts
    recent_alerts = list(
        Alert.objects.filter(rule__company=company)
        .order_by("-triggered_at")[:30]
        .values("message", "severity", "triggered_at")
    )

    return {
        "total_posts": total,
        "period_days": period_days,
        "sentiment_counts": sentiment_counts,
        "sentiment_pct": pct,
        "top_keywords": top_keywords,
        "recent_alerts": recent_alerts,
    }


def _build_prompt(company, data, lang="ar"):
    alerts_text = "\n".join(
        f"- [{a['severity']}] {a['message']} ({a['triggered_at']})"
        for a in data["recent_alerts"]
    ) or "No alerts."

    keywords_text = "، ".join(data["top_keywords"]) or "None."

    configs = {
        "ar": {
            "instruction": "اكتب التقرير باللغة العربية فقط.",
            "period":      f"آخر {data['period_days']} يوماً",
            "total":       "إجمالي المنشورات",
            "positive":    "المشاعر الإيجابية",
            "negative":    "المشاعر السلبية",
            "neutral":     "المشاعر المحايدة",
            "keywords":    "أبرز الكلمات المفتاحية",
            "alerts":      "آخر التنبيهات",
            "sections":    f"# تقرير تحليل المشاعر — {company.name}\n\n## ملخص تنفيذي\n\n## تحليل المشاعر\n\n## أبرز المخاوف\n\n## الكلمات الصاعدة\n\n## إشارات الأزمات\n\n## توصيات قابلة للتنفيذ",
        },
        "en": {
            "instruction": "Write the report in English only.",
            "period":      f"Last {data['period_days']} days",
            "total":       "Total posts",
            "positive":    "Positive sentiment",
            "negative":    "Negative sentiment",
            "neutral":     "Neutral sentiment",
            "keywords":    "Top keywords",
            "alerts":      "Recent alerts",
            "sections":    f"# Sentiment Analysis Report — {company.name}\n\n## Executive Summary\n\n## Sentiment Analysis\n\n## Key Concerns\n\n## Rising Keywords\n\n## Crisis Signals\n\n## Actionable Recommendations",
        },
        "fr": {
            "instruction": "Rédigez le rapport en français uniquement.",
            "period":      f"Les {data['period_days']} derniers jours",
            "total":       "Total des publications",
            "positive":    "Sentiment positif",
            "negative":    "Sentiment négatif",
            "neutral":     "Sentiment neutre",
            "keywords":    "Mots-clés principaux",
            "alerts":      "Alertes récentes",
            "sections":    f"# Rapport d'analyse de sentiment — {company.name}\n\n## Résumé exécutif\n\n## Analyse des sentiments\n\n## Principales préoccupations\n\n## Mots-clés émergents\n\n## Signaux de crise\n\n## Recommandations actionnables",
        },
    }

    c = configs.get(lang, configs["ar"])

    return f"""You are a data analyst specializing in social media sentiment analysis for the Algerian market.

{c['instruction']}

Generate a comprehensive sentiment analysis report for the company: {company.name}
Period: {c['period']}

Available data:
- {c['total']}: {data['total_posts']}
- {c['positive']}: {data['sentiment_counts']['positive']} ({data['sentiment_pct']['positive']}%)
- {c['negative']}: {data['sentiment_counts']['negative']} ({data['sentiment_pct']['negative']}%)
- {c['neutral']}: {data['sentiment_counts']['neutral']} ({data['sentiment_pct']['neutral']}%)
- {c['keywords']}: {keywords_text}
- {c['alerts']}:
{alerts_text}

Write the report using exactly this Markdown structure:

{c['sections']}

Be accurate, data-driven, and do not invent numbers not present in the data."""

def _call_groq(prompt):
    """Call Groq API and return the report text."""
    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set in settings.")

    resp = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 4096,
            "temperature": 0.4,
        },
        timeout=60,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


# ── views ─────────────────────────────────────────────────────────────────────

class GenerateInsightView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        company_id = request.query_params.get("company")
        if not company_id:
            return Response({"error": "company param required."}, status=400)

        company, err = _check_admin(request, company_id)
        if err:
            return err

        period_days = int(request.query_params.get("period_days", 30))
        lang= request.query_params.get("lang", "ar")
        try:
            data    = _gather_data(company, period_days)
            prompt  = _build_prompt(company, data, lang)
            content = _call_groq(prompt)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

        report = InsightReport.objects.create(
            company=company,
            content=content,
            period_days=period_days,
        )
        return Response(InsightReportSerializer(report).data, status=201)


class LatestInsightView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company_id = request.query_params.get("company")
        if not company_id:
            return Response({"error": "company param required."}, status=400)

        try:
            company = Company.objects.get(pk=company_id)
        except Company.DoesNotExist:
            return Response({"error": "Company not found."}, status=404)

        report = InsightReport.objects.filter(company=company).first()
        if not report:
            return Response({"detail": "No reports yet."}, status=404)
        return Response(InsightReportSerializer(report).data)


class InsightHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company_id = request.query_params.get("company")
        if not company_id:
            return Response({"error": "company param required."}, status=400)

        try:
            company = Company.objects.get(pk=company_id)
        except Company.DoesNotExist:
            return Response({"error": "Company not found."}, status=404)

        reports = InsightReport.objects.filter(company=company)
        return Response(InsightReportSerializer(reports, many=True).data)
"""
Evaluate all active AlertRules for a company and create Alert records
when conditions are met. Called at the end of every ingestion run.
"""

from __future__ import annotations

import logging
from datetime import timedelta

from django.utils import timezone
from django.db.models import Count, Q

from posts.models import Post
from .models import AlertRule, Alert

logger = logging.getLogger(__name__)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _today_posts(company_id: int):
    """QuerySet of posts created today for this company."""
    today = timezone.now().date()
    return Post.objects.filter(
        company_id=company_id,
        created_at__date=today,
    )


def _yesterday_posts(company_id: int):
    """QuerySet of posts created yesterday for this company."""
    yesterday = timezone.now().date() - timedelta(days=1)
    return Post.objects.filter(
        company_id=company_id,
        created_at__date=yesterday,
    )


def _sentiment_pct(qs, label: str) -> float:
    """Return percentage of `label` sentiment in queryset. 0.0 if empty."""
    total = qs.count()
    if total == 0:
        return 0.0
    count = qs.filter(sentiment=label).count()
    return round((count / total) * 100, 1)


def _sentiment_count(qs, label: str) -> int:
    return qs.filter(sentiment=label).count()


def _already_triggered_today(rule: AlertRule) -> bool:
    """Avoid firing the same rule more than once per day."""
    today = timezone.now().date()
    return Alert.objects.filter(
        rule=rule,
        triggered_at__date=today,
    ).exists()


def _fire(rule: AlertRule, message: str) -> None:
    """Create an Alert record."""
    Alert.objects.create(
        company_id=rule.company_id,
        rule=rule,
        message=message,
        severity=rule.severity,
    )
    logger.info("Alert fired — rule=%d type=%s company=%d", rule.pk, rule.rule_type, rule.company_id)


# ── Rule evaluators ────────────────────────────────────────────────────────────

def _eval_negative_pct_above(rule: AlertRule) -> None:
    today_qs = _today_posts(rule.company_id)
    pct = _sentiment_pct(today_qs, "negative")
    if pct >= rule.threshold:
        _fire(
            rule,
            f"⚠️ نسبة التعليقات السلبية اليوم بلغت {pct}% — "
            f"تجاوزت الحد المحدد ({rule.threshold}%).",
        )


def _eval_positive_pct_below(rule: AlertRule) -> None:
    today_qs = _today_posts(rule.company_id)
    pct = _sentiment_pct(today_qs, "positive")
    if pct > 0 and pct <= rule.threshold:
        _fire(
            rule,
            f"⚠️ نسبة التعليقات الإيجابية اليوم انخفضت إلى {pct}% — "
            f"دون الحد المحدد ({rule.threshold}%).",
        )


def _eval_negative_count_above(rule: AlertRule) -> None:
    today_qs = _today_posts(rule.company_id)
    count = _sentiment_count(today_qs, "negative")
    if count >= rule.threshold:
        _fire(
            rule,
            f"⚠️ عدد التعليقات السلبية اليوم بلغ {count} — "
            f"تجاوز الحد المحدد ({int(rule.threshold)}).",
        )


def _eval_volume_spike(rule: AlertRule) -> None:
    today_qs = _today_posts(rule.company_id)
    total = today_qs.count()
    if total >= rule.threshold:
        _fire(
            rule,
            f"📈 حجم المنشورات اليوم بلغ {total} منشوراً — "
            f"تجاوز الحد المحدد ({int(rule.threshold)}).",
        )


def _eval_keyword_spike(rule: AlertRule) -> None:
    if not rule.keyword:
        return
    today_qs = _today_posts(rule.company_id)
    count = today_qs.filter(text__icontains=rule.keyword).count()
    if count >= rule.threshold:
        _fire(
            rule,
            f"🔍 الكلمة المفتاحية \"{rule.keyword}\" ظهرت {count} مرة اليوم — "
            f"تجاوزت الحد المحدد ({int(rule.threshold)}).",
        )


def _eval_sentiment_drop(rule: AlertRule) -> None:
    """
    Fires if positive % dropped by more than `threshold` points
    compared to yesterday.
    """
    today_qs     = _today_posts(rule.company_id)
    yesterday_qs = _yesterday_posts(rule.company_id)

    today_pct     = _sentiment_pct(today_qs,     "positive")
    yesterday_pct = _sentiment_pct(yesterday_qs, "positive")

    if yesterday_qs.count() == 0 or today_qs.count() == 0:
        return

    drop = yesterday_pct - today_pct
    if drop >= rule.threshold:
        _fire(
            rule,
            f"📉 انخفضت نسبة الإيجابي من {yesterday_pct}% أمس إلى {today_pct}% اليوم — "
            f"انخفاض بمقدار {round(drop, 1)} نقطة (الحد: {rule.threshold}).",
        )


def _eval_negative_streak(rule: AlertRule) -> None:
    """
    Fires if negative sentiment is dominant for `threshold` consecutive days.
    threshold should be an integer like 3.
    """
    days = int(rule.threshold)
    today = timezone.now().date()

    streak = 0
    for i in range(days):
        day = today - timedelta(days=i)
        qs = Post.objects.filter(company_id=rule.company_id, created_at__date=day)
        if qs.count() == 0:
            break
        neg = _sentiment_count(qs, "negative")
        pos = _sentiment_count(qs, "positive")
        neu = qs.filter(sentiment="neutral").count()
        if neg > pos and neg > neu:
            streak += 1
        else:
            break

    if streak >= days:
        _fire(
            rule,
            f"🚨 السلبي هو المشاعر الغالبة منذ {streak} أيام متتالية — "
            f"يُنصح بمراجعة فورية.",
        )


# ── Dispatch table ─────────────────────────────────────────────────────────────

_EVALUATORS = {
    "negative_pct_above":   _eval_negative_pct_above,
    "positive_pct_below":   _eval_positive_pct_below,
    "negative_count_above": _eval_negative_count_above,
    "volume_spike":         _eval_volume_spike,
    "keyword_spike":        _eval_keyword_spike,
    "sentiment_drop":       _eval_sentiment_drop,
    "negative_streak":      _eval_negative_streak,
}


# ── Public entry point ─────────────────────────────────────────────────────────

def evaluate_rules(company_id: int) -> int:
    """
    Evaluate all active rules for the company.
    Returns the number of alerts fired.
    """
    rules = AlertRule.objects.filter(company_id=company_id, is_active=True)
    fired = 0

    for rule in rules:
        if _already_triggered_today(rule):
            logger.debug("Rule %d already triggered today — skipping.", rule.pk)
            continue
        evaluator = _EVALUATORS.get(rule.rule_type)
        if not evaluator:
            logger.warning("Unknown rule type: %s", rule.rule_type)
            continue
        try:
            evaluator(rule)
            # Check if a new alert was just created
            if _already_triggered_today(rule):
                fired += 1
        except Exception as e:
            logger.exception("Error evaluating rule %d: %s", rule.pk, e)

    logger.info("evaluate_rules: company=%d rules=%d fired=%d", company_id, rules.count(), fired)
    return fired
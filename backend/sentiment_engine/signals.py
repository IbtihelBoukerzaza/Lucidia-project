"""
Auto-classify Post on save if text is present and sentiment is not yet set.
"""

from __future__ import annotations

import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from posts.models import Post

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Post)
def classify_post_on_save(sender, instance: Post, created: bool, **kwargs):
    """Classify new posts only. Skip if already classified or text is empty."""
    if not created:
        return
    if instance.sentiment is not None:
        return
    if not (instance.text or "").strip():
        return

    try:
        from .predictor import predict
        result = predict(instance.text)

        if result["label"] is None:
            return

        Post.objects.filter(pk=instance.pk).update(
            sentiment=result["label"],
            sentiment_score=result["score"],
            sentiment_scores=result["scores"],
            sentiment_at=timezone.now(),
        )
    except Exception as e:
        logger.error("Failed to classify post %s: %s", instance.pk, e)
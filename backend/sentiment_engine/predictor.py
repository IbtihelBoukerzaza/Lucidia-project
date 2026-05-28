"""
Ensemble predictor — now delegates to FastAPI ML service via HTTP.
Return format is identical to the original so signals.py needs no changes.
"""

from __future__ import annotations

import logging

from .model_loader import predict_via_service

logger = logging.getLogger(__name__)


def predict(text: str) -> dict:
    """
    Classify a single text using the ML service.

    Returns:
        {
            "label": "positive" | "neutral" | "negative",
            "score": float,
            "scores": {
                "negative": float,
                "neutral":  float,
                "positive": float,
            }
        }
    """
    if not text or not text.strip():
        return {
            "label": None,
            "score": None,
            "scores": None,
        }

    return predict_via_service(text)
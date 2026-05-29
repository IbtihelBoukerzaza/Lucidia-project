"""
HTTP client for the Gantra ML Service (FastAPI on HuggingFace Spaces).
Django no longer loads models directly — it calls the ML service over HTTP.
"""

from __future__ import annotations

import logging
import os

import requests

logger = logging.getLogger(__name__)

ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:8001")
ML_SERVICE_TOKEN = os.getenv("ML_SERVICE_TOKEN", "")


def predict_via_service(text: str) -> dict:
    """
    Send text to the FastAPI ML service and return the prediction.
    Falls back to neutral if the service is unreachable.
    """
    try:
        headers = {}
        if ML_SERVICE_TOKEN:
            headers["Authorization"] = f"Bearer {ML_SERVICE_TOKEN}"

        resp = requests.post(
            f"{ML_SERVICE_URL}/predict",
            json={"text": text},
            headers=headers,
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            "label":  data["sentiment"],
            "score":  data["score"],
            "scores": data["scores"],
        }
    except Exception as e:
        logger.error("ML service unreachable: %s", e)
        return {
            "label":  "neutral",
            "score":  0.0,
            "scores": {"negative": 0.0, "neutral": 1.0, "positive": 0.0},
        }
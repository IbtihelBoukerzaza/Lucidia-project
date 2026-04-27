"""
Ensemble predictor: DziriBERT (weight 0.45) + MARBERT (weight 0.55).
Returns label + confidence score + full probability distribution.
"""

from __future__ import annotations

import logging

import torch
import torch.nn.functional as F

from .model_loader import get_models

logger = logging.getLogger(__name__)

DZIRIBERT_WEIGHT = 0.45
MARBERT_WEIGHT = 0.55

LABELS = ["negative", "neutral", "positive"]


def _predict_one(entry: dict, text: str) -> torch.Tensor:
    """Run inference with one model. Returns softmax probabilities tensor."""
    tokenizer = entry["tokenizer"]
    model = entry["model"]
    max_length = entry["max_length"]
    device = entry["device"]

    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=max_length,
    )
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        logits = model(**inputs).logits

    return F.softmax(logits, dim=-1).squeeze(0).cpu()


def predict(text: str) -> dict:
    """
    Classify a single text using the ensemble.

    Returns:
        {
            "label": "positive" | "neutral" | "negative",
            "score": float,          # confidence of winning label
            "scores": {              # full distribution
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

    models = get_models()

    probs_dz = _predict_one(models["dziribert"], text)
    probs_mb = _predict_one(models["marbert"], text)

    # Weighted ensemble average
    ensemble = DZIRIBERT_WEIGHT * probs_dz + MARBERT_WEIGHT * probs_mb

    # Map to labels using DziriBERT id2label (both models share same label order)
    id2label = models["dziribert"]["id2label"]
    scores = {id2label[i]: round(float(ensemble[i]), 4) for i in range(len(LABELS))}

    winning_label = max(scores, key=scores.get)
    winning_score = scores[winning_label]

    return {
        "label": winning_label,
        "score": winning_score,
        "scores": scores,
    }
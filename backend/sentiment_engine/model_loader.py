"""
Singleton loader for DziriBERT and MARBERT models.
Models are loaded once at Django startup and reused for all predictions.
Never call this directly from a view — use predictor.py instead.
"""

from __future__ import annotations

import json
import logging
import threading
from pathlib import Path

from django.conf import settings

logger = logging.getLogger(__name__)

_lock = threading.Lock()
_models: dict | None = None


def _load_one(model_dir: Path) -> dict:
    """Load a single model and its tokenizer from disk."""
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    import torch

    meta_path = model_dir / "model_meta.json"
    label_path = model_dir / "label_map.json"

    with open(meta_path, encoding="utf-8") as f:
        meta = json.load(f)
    with open(label_path, encoding="utf-8") as f:
        label_map = json.load(f)

    id2label = {int(k): v for k, v in label_map["id2label"].items()}
    max_length = meta.get("max_length", 128)

    tokenizer = AutoTokenizer.from_pretrained(str(model_dir))
    model = AutoModelForSequenceClassification.from_pretrained(str(model_dir))
    model.eval()

    device = "cuda" if torch.cuda.is_available() else "cpu"
    model.to(device)

    logger.info("Loaded model from %s on %s", model_dir, device)

    return {
        "model": model,
        "tokenizer": tokenizer,
        "id2label": id2label,
        "max_length": max_length,
        "device": device,
    }


def get_models() -> dict:
    """
    Return loaded models dict. Loads from disk on first call (singleton).
    Thread-safe.
    """
    global _models
    if _models is not None:
        return _models

    with _lock:
        if _models is not None:
            return _models

        paths = settings.SENTIMENT_MODELS
        dziribert_dir = Path(paths["dziribert"])
        marbert_dir = Path(paths["marbert"])

        logger.info("Loading DziriBERT from %s", dziribert_dir)
        dziribert = _load_one(dziribert_dir)

        logger.info("Loading MARBERT from %s", marbert_dir)
        marbert = _load_one(marbert_dir)

        _models = {
            "dziribert": dziribert,
            "marbert": marbert,
        }

    return _models
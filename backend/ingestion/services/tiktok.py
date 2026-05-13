
"""
ingestion/services/tiktok.py
Normalizes raw TikTok scraper output. Mirrors facebook.py and instagram.py.
"""
from typing import List, Dict


def normalize_tiktok_data(raw_rows: List[Dict]) -> List[Dict]:
    normalized = []
    for row in raw_rows:
        text = (row.get("text") or "").strip()
        if not text or len(text) < 2:
            continue
        external_id = row.get("external_id")
        if not external_id:
            continue
        normalized.append({
            "text": text,
            "source": "tiktok",
            "platform": "social",
            "external_id": external_id,
            "url": row.get("url", ""),
            "author": row.get("author") or "",
        })
    return normalized

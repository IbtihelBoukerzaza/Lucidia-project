"""
ingestion/services/instagram.py

Normalizes raw Instagram scraper output into pipeline-compatible rows.
Mirrors the structure of ingestion/services/facebook.py
"""

import re
from typing import List, Dict


def normalize_instagram_data(raw_rows: List[Dict]) -> List[Dict]:
    """
    Takes the list returned by fetch_instagram_comments() and returns
    clean rows ready for upsert_post().

    Input (from scraper):
        [
            {
                "text": "...",
                "source": "instagram",
                "platform": "social",
                "external_id": "ig_ABC123_0",
                "url": "https://www.instagram.com/p/ABC123/",
                "author": "username"
            },
            ...
        ]

    Output (for upsert_post):
        Same structure — scraper already returns normalized format.
        This function validates, cleans, and filters bad rows.
    """
    normalized = []

    for row in raw_rows:
        text = (row.get("text") or "").strip()

        # Skip empty or too-short text
        if not text or len(text) < 3:
            continue

        # external_id is required for deduplication
        external_id = row.get("external_id")
        if not external_id:
            continue

        normalized.append({
            "text": text,
            "source": "instagram",
            "platform": "social",
            "external_id": external_id,
            "url": row.get("url", ""),
            "author": row.get("author") or "",
        })

    return normalized
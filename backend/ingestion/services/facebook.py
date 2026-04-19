"""
Normalize Facebook scraper output into ingestion pipeline format.
"""

from __future__ import annotations

import hashlib
from typing import Any, List, Dict


def _make_external_id(post_url: str, author: str, text: str) -> str:
    """
    Generate a stable unique ID for a Facebook comment.
    """
    raw = f"{post_url}|{author}|{text}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def normalize_facebook_data(raw_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    normalized_rows: List[Dict[str, Any]] = []

    for post in raw_data:
        post_url = post.get("post_url")

        if not post_url:
            continue

        comments = post.get("comments", [])

        for comment in comments:
            text = (comment.get("text") or "").strip()
            author = (comment.get("author") or "").strip()

            if not text:
                continue

            external_id = _make_external_id(post_url, author, text)

            normalized_rows.append({
                "text": text,
                "source": "facebook",
                "platform": "social",
                "external_id": external_id,
                "url": post_url,
                "author": author or None,
            })

    return normalized_rows
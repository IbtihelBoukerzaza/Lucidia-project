"""GDELT DOC 2.0 API — article list by keyword (no API key)."""

from __future__ import annotations

import hashlib
import logging
from typing import Any
from urllib.parse import quote_plus

import requests

from posts.models import Post

logger = logging.getLogger(__name__)

GDELT_DOC_URL = "https://api.gdeltproject.org/api/v2/doc/doc"


def _stable_id(prefix: str, value: str) -> str:
    h = hashlib.sha256(value.encode("utf-8", errors="replace")).hexdigest()
    return f"{prefix}:{h}"


def fetch_gdelt_articles(
    *,
    keywords: list[str],
    max_per_keyword: int = 15,
    timeout: int = 45,
) -> list[dict[str, Any]]:
    """
    Returns normalized rows (not yet saved). Each item is a dict compatible with store.upsert_post.
    """
    rows: list[dict[str, Any]] = []
    if not keywords:
        return rows

    session = requests.Session()
    session.headers.setdefault(
        "User-Agent",
        "SentivyaDZ-Ingestion/1.0 (+https://localhost)",
    )

    for keyword in keywords:
        q = quote_plus(keyword.strip())
        if not q:
            continue
        url = (
            f"{GDELT_DOC_URL}?query={q}&mode=ArtList"
            f"&maxrecords={max_per_keyword}&format=json"
        )
        try:
            resp = session.get(url, timeout=timeout)
            resp.raise_for_status()
            data = resp.json()
        except (requests.RequestException, ValueError) as exc:
            logger.warning("GDELT request failed for %r: %s", keyword, exc)
            continue

        articles = data.get("articles") or data.get("activity") or []
        if not isinstance(articles, list):
            continue

        for art in articles:
            if not isinstance(art, dict):
                continue
            link = (art.get("url") or art.get("url_mobile") or "").strip()
            title = (art.get("title") or "").strip()
            if not link and not title:
                continue
            domain = (art.get("domain") or "").strip()
            parts = [title]
            if domain:
                parts.append(f"({domain})")
            text = " ".join(p for p in parts if p).strip()
            if not text:
                text = link or "GDELT article"

            ext = _stable_id("gdelt", link or title + domain)
            rows.append(
                {
                    "text": text,
                    "source": Post.Source.GDELT,
                    "platform": Post.Platform.NEWS,
                    "external_id": ext,
                    "url": link or None,
                    "author": domain or None,
                }
            )

    return rows

"""Hacker News search via Algolia public API (hn.algolia.com)."""

from __future__ import annotations

import logging
from typing import Any

import requests

from posts.models import Post

logger = logging.getLogger(__name__)

SEARCH_URL = "https://hn.algolia.com/api/v1/search"


def fetch_hackernews_hits(
    *,
    keywords: list[str],
    hits_per_keyword: int = 20,
    timeout: int = 30,
) -> list[dict[str, Any]]:
    if not keywords:
        return []

    rows: list[dict[str, Any]] = []
    headers = {
        "User-Agent": "SentivyaDZ-Ingestion/1.0 (+https://localhost)",
    }
    session = requests.Session()
    session.headers.update(headers)

    for keyword in keywords:
        kw = keyword.strip()
        if not kw:
            continue
        try:
            r = session.get(
                SEARCH_URL,
                params={
                    "query": kw,
                    "hitsPerPage": min(max(hits_per_keyword, 1), 50),
                },
                timeout=timeout,
                headers=headers,
            )
            r.raise_for_status()
            data = r.json()
        except (requests.RequestException, ValueError) as exc:
            logger.warning("Hacker News API failed for %r: %s", kw, exc)
            continue

        for hit in data.get("hits") or []:
            if not isinstance(hit, dict):
                continue
            oid = hit.get("objectID")
            title = (hit.get("title") or "").strip()
            url_story = (hit.get("url") or "").strip()
            author = (hit.get("author") or "").strip() or None
            if not oid or not title:
                continue
            text = title
            if url_story:
                text = f"{title}\n\n{url_story}"
            comment_url = f"https://news.ycombinator.com/item?id={oid}"
            rows.append(
                {
                    "text": text[:100000],
                    "external_id": f"hn:{oid}"[:512],
                    "url": url_story or comment_url,
                    "source": Post.Source.HACKERNEWS,
                    "platform": Post.Platform.SOCIAL,
                    "author": author,
                }
            )

    return rows

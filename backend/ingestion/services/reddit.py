"""Reddit public search JSON (official-style public endpoint; User-Agent required)."""

from __future__ import annotations

import logging
from typing import Any

import requests

from posts.models import Post

logger = logging.getLogger(__name__)

SEARCH_URL = "https://www.reddit.com/search.json"
USER_AGENT = (
    "SentivyaDZ-Ingestion/1.0 (social listening; +https://localhost) "
    "Python/requests"
)


def fetch_reddit_posts(
    *,
    keywords: list[str],
    limit_per_keyword: int = 25,
    timeout: int = 30,
) -> list[dict[str, Any]]:
    if not keywords:
        return []

    rows: list[dict[str, Any]] = []
    headers = {"User-Agent": USER_AGENT}
    session = requests.Session()
    session.headers.update(headers)

    for keyword in keywords:
        kw = keyword.strip()
        if not kw:
            continue
        params = {
            "q": kw,
            "limit": min(max(limit_per_keyword, 1), 100),
            "sort": "new",
            "raw_json": 1,
        }
        try:
            r = session.get(SEARCH_URL, params=params, timeout=timeout)
            r.raise_for_status()
            data = r.json()
        except (requests.RequestException, ValueError) as exc:
            logger.warning("Reddit search failed for %r: %s", kw, exc)
            continue

        listing = (data.get("data") or {}).get("children") or []
        for child in listing:
            if not isinstance(child, dict):
                continue
            d = child.get("data") or {}
            rid = d.get("name") or d.get("id")
            title = (d.get("title") or "").strip()
            selftext = (d.get("selftext") or "").strip()
            permalink = (d.get("permalink") or "").strip()
            author = (d.get("author") or "").strip() or None
            if not rid:
                continue
            parts = [title]
            if selftext and selftext not in ("[removed]", "[deleted]"):
                parts.append(selftext)
            text = "\n\n".join(p for p in parts if p).strip()
            if not text:
                continue
            full_url = (
                f"https://www.reddit.com{permalink}"
                if permalink.startswith("/")
                else permalink or None
            )
            rows.append(
                {
                    "text": text[:100000],
                    "external_id": f"reddit:{rid}"[:512],
                    "url": full_url,
                    "source": Post.Source.REDDIT,
                    "platform": Post.Platform.SOCIAL,
                    "author": author,
                }
            )

    return rows

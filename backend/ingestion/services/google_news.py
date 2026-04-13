"""Google News RSS search (public RSS; no scraping)."""

from __future__ import annotations

import hashlib
import logging
from typing import Any
from urllib.parse import quote_plus

import feedparser
import requests

from posts.models import Post

logger = logging.getLogger(__name__)

USER_AGENT = "SentivyaDZ-Ingestion/1.0 (+https://localhost)"


def _external_id(link: str, title: str) -> str:
    base = f"{link}|{title}"
    h = hashlib.sha256(base.encode("utf-8", errors="replace")).hexdigest()
    return f"google_news:{h}"


def fetch_google_news(
    *,
    keywords: list[str],
    timeout: int = 30,
) -> list[dict[str, Any]]:
    """Fetch Google News RSS per keyword; normalize for posts.Post."""
    rows: list[dict[str, Any]] = []
    if not keywords:
        return rows

    headers = {"User-Agent": USER_AGENT}
    session = requests.Session()
    session.headers.update(headers)

    for keyword in keywords:
        kw = keyword.strip()
        if not kw:
            continue
        q = quote_plus(kw)
        url = f"https://news.google.com/rss/search?q={q}&hl=en&gl=DZ&ceid=DZ:en"
        try:
            resp = session.get(url, timeout=timeout)
            resp.raise_for_status()
            parsed = feedparser.parse(resp.content)
        except (requests.RequestException, Exception) as exc:
            logger.warning("Google News RSS failed for %r: %s", kw, exc)
            continue

        if getattr(parsed, "bozo", False) and not parsed.entries:
            logger.warning(
                "Google News RSS parse issue for %r: %s",
                kw,
                getattr(parsed, "bozo_exception", "unknown"),
            )
            continue

        for entry in parsed.entries or []:
            title = (entry.get("title") or "").strip()
            link = (entry.get("link") or "").strip()
            summary = (
                entry.get("summary")
                or entry.get("description")
                or ""
            )
            summary = str(summary).strip()
            text_parts = [p for p in (title, summary) if p]
            text = "\n\n".join(text_parts).strip()
            if not text:
                continue
            ext = _external_id(link, title)[:512]
            rows.append(
                {
                    "text": text[:100000],
                    "external_id": ext,
                    "url": link or None,
                    "source": Post.Source.GOOGLE_NEWS,
                    "platform": Post.Platform.NEWS,
                    "author": None,
                }
            )

    return rows

"""Google News RSS search (public RSS; no scraping)."""

from __future__ import annotations

import hashlib
import logging
import re
import unicodedata
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


def _is_arabic(text: str) -> bool:
    """Return True if text contains Arabic characters."""
    return any(
        unicodedata.name(c, "").startswith("ARABIC")
        for c in text
    )


def _strip_html(text: str) -> str:
    """
    Remove HTML tags and decode common entities.
    Google News RSS summaries contain raw HTML like:
    <a href="...">Title</a>&nbsp;&nbsp;<font color="...">Source</font>
    """
    # Remove all HTML tags
    text = re.sub(r"<[^>]+>", " ", text)
    # Decode common HTML entities
    text = text.replace("&nbsp;", " ")
    text = text.replace("&amp;", "&")
    text = text.replace("&lt;", "<")
    text = text.replace("&gt;", ">")
    text = text.replace("&quot;", '"')
    text = text.replace("&#39;", "'")
    # Collapse whitespace
    text = " ".join(text.split())
    return text.strip()


def _is_relevant(text: str, keyword: str) -> bool:
    """
    Check that result is actually about the keyword we searched.

    Multi-word keyword ("Algérie Télécom"): all words must appear.
    Single word ("Mobilis"): must appear as whole word to avoid
    matching "mobilisation", "Zymomonas mobilis", etc.
    """
    if not text or not keyword:
        return False

    text_lower = text.lower()
    kw_lower = keyword.lower().strip()
    words = kw_lower.split()

    if len(words) > 1:
        return all(w in text_lower for w in words)

    # Single word — whole word match only
    pattern = r"\b" + re.escape(kw_lower) + r"\b"
    return bool(re.search(pattern, text_lower))


def fetch_google_news(
    *,
    keywords: list[str],
    timeout: int = 30,
) -> list[dict[str, Any]]:
    """
    Fetch Google News RSS per keyword.
    Uses French locale for Latin keywords, Arabic locale for Arabic keywords.
    Strips HTML from summaries before storing.
    Filters irrelevant results using whole-word matching.
    """
    rows: list[dict[str, Any]] = []
    seen_ids: set[str] = set()

    if not keywords:
        return rows

    session = requests.Session()
    session.headers["User-Agent"] = USER_AGENT

    for keyword in keywords:
        kw = keyword.strip()
        if not kw:
            continue

        q = quote_plus(kw)

        # Arabic locale for Arabic keywords, French for others
        if _is_arabic(kw):
            url = (
                f"https://news.google.com/rss/search"
                f"?q={q}&hl=ar&gl=DZ&ceid=DZ:ar"
            )
        else:
            url = (
                f"https://news.google.com/rss/search"
                f"?q={q}&hl=fr&gl=DZ&ceid=DZ:fr"
            )

        try:
            resp = session.get(url, timeout=timeout)
            resp.raise_for_status()
            parsed = feedparser.parse(resp.content)
        except Exception as exc:
            logger.warning("Google News RSS failed for %r: %s", kw, exc)
            continue

        if getattr(parsed, "bozo", False) and not parsed.entries:
            logger.warning(
                "Google News RSS parse issue for %r: %s",
                kw,
                getattr(parsed, "bozo_exception", "unknown"),
            )
            continue

        fetched = 0
        filtered = 0

        for entry in parsed.entries or []:
            title = _strip_html((entry.get("title") or "").strip())
            link = (entry.get("link") or "").strip()
            summary = _strip_html(
                str(
                    entry.get("summary")
                    or entry.get("description")
                    or ""
                ).strip()
            )

            combined = f"{title} {summary}"

            if not _is_relevant(combined, kw):
                filtered += 1
                logger.debug(
                    "Google News: filtered %r for keyword %r",
                    title[:60], kw,
                )
                continue

            text_parts = [p for p in (title, summary) if p]
            text = "\n\n".join(text_parts).strip()
            if not text:
                continue

            ext = _external_id(link, title)[:512]
            if ext in seen_ids:
                continue
            seen_ids.add(ext)

            fetched += 1
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

        logger.info(
            "Google News: keyword=%r fetched=%d filtered_out=%d",
            kw, fetched, filtered,
        )

    return rows
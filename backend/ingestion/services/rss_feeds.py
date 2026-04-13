"""RSS / Atom feed parsing (multiple feeds, optional keyword filter)."""

from __future__ import annotations

import hashlib
import logging
from typing import Any

import feedparser
import requests

from posts.models import Post

logger = logging.getLogger(__name__)

USER_AGENT = "SentivyaDZ-Ingestion/1.0 (+https://localhost)"


def _stable_id(link: str, title: str) -> str:
    base = link or title
    h = hashlib.sha256(base.encode("utf-8", errors="replace")).hexdigest()
    return f"rss:{h}"


def _entry_matches_keywords(
    title: str,
    summary: str,
    keywords: list[str] | None,
) -> bool:
    if not keywords:
        return True
    blob = f"{title}\n{summary}".casefold()
    for kw in keywords:
        k = kw.strip()
        if k and k.casefold() in blob:
            return True
    return False


def fetch_rss_entries(
    *,
    feed_urls: list[str],
    keywords: list[str] | None = None,
    filter_by_keywords: bool = False,
    timeout: int = 30,
) -> list[dict[str, Any]]:
    """
    Fetch many feeds; skip empty URLs and failed fetches.
    If filter_by_keywords is True and keywords is non-empty, keep only entries
    whose title or summary contains at least one keyword (case-insensitive).
    """
    rows: list[dict[str, Any]] = []
    urls = [u.strip() for u in (feed_urls or []) if u and str(u).strip()]
    if not urls:
        return rows

    active_keywords = list(keywords or []) if filter_by_keywords else None

    headers = {"User-Agent": USER_AGENT}
    session = requests.Session()
    session.headers.update(headers)

    for feed_url in urls:
        try:
            resp = session.get(feed_url, timeout=timeout)
            resp.raise_for_status()
            if not resp.content:
                logger.warning("RSS empty body for %s", feed_url)
                continue
            parsed = feedparser.parse(resp.content)
        except requests.RequestException as exc:
            logger.warning("RSS fetch failed for %s: %s", feed_url, exc)
            continue
        except Exception as exc:
            logger.warning("RSS unexpected error for %s: %s", feed_url, exc)
            continue

        if getattr(parsed, "bozo", False):
            exc = getattr(parsed, "bozo_exception", None)
            if exc and not parsed.entries:
                logger.warning("RSS malformed feed %s: %s", feed_url, exc)
                continue

        entries = parsed.entries or []
        if not entries:
            logger.info("RSS no entries for %s", feed_url)
            continue

        for entry in entries:
            title = (entry.get("title") or "").strip()
            link = (entry.get("link") or "").strip()
            summary = (
                entry.get("summary")
                or entry.get("description")
                or entry.get("subtitle")
                or ""
            )
            summary = str(summary).strip()
            guid = (entry.get("id") or entry.get("guid") or "").strip()
            if isinstance(guid, dict):
                guid = str(guid.get("value") or "").strip()

            if active_keywords and not _entry_matches_keywords(
                title, summary, active_keywords
            ):
                continue

            text_parts = [title]
            if summary and summary != title:
                text_parts.append(summary)
            text = "\n\n".join(p for p in text_parts if p).strip()
            if not text:
                continue

            ext_source = guid or link or title
            external_id = _stable_id(link, ext_source)[:512]

            rows.append(
                {
                    "text": text[:100000],
                    "source": Post.Source.RSS,
                    "platform": Post.Platform.NEWS,
                    "external_id": external_id,
                    "url": link or None,
                    "author": None,
                }
            )

    return rows

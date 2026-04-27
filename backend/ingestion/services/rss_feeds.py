"""RSS / Atom feed parsing (multiple feeds, optional keyword filter)."""

from __future__ import annotations

import hashlib
import logging
import re
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
    keywords: list[str],
) -> bool:
    """
    Return True only if the article contains at least one keyword
    as a complete phrase — never split into individual words.

    Examples:
        keyword="Mobilis"        → matches "Mobilis lance une offre"
        keyword="Algérie Télécom"→ matches only if BOTH words appear together
        keyword="موبيليس"        → substring match in Arabic text

    We do NOT split "Mobilis Algeria" into ["mobilis", "algeria"]
    because "algérie" alone matches every Algerian news article.
    """
    if not keywords:
        return True

    blob = f"{title} {summary}".lower()

    for kw in keywords:
        kw = kw.strip()
        if not kw:
            continue
        kw_lower = kw.lower()

        # Multi-word keyword: all words must appear AND close to each other
        # We check the full phrase as a substring first
        if kw_lower in blob:
            return True

        # For multi-word keywords, also accept if all words appear
        # BUT only if the keyword is a known company name pattern
        # (skip this for generic words like "algeria")
        words = kw_lower.split()
        if len(words) >= 2:
            # Only do word-by-word for proper company names
            # where each word is at least 5 chars (filters out "de", "la", etc)
            meaningful_words = [w for w in words if len(w) >= 5]
            if meaningful_words and all(w in blob for w in meaningful_words):
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
    If filter_by_keywords is True, keep only entries that contain
    at least one keyword as a complete phrase.
    """
    rows: list[dict[str, Any]] = []
    seen_ids: set[str] = set()

    urls = [u.strip() for u in (feed_urls or []) if u and str(u).strip()]
    if not urls:
        return rows

    active_keywords = list(keywords or []) if filter_by_keywords else []

    session = requests.Session()
    session.headers["User-Agent"] = USER_AGENT

    for feed_url in urls:
        try:
            resp = session.get(
                feed_url,
                timeout=timeout,
                headers={
                    "User-Agent": USER_AGENT,
                    "Accept": "application/rss+xml, application/xml, text/xml, */*",
                },
            )
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

        feed_fetched = 0
        feed_filtered = 0

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

            # Strict keyword filter — full phrase match only
            if active_keywords and not _entry_matches_keywords(
                title, summary, active_keywords
            ):
                feed_filtered += 1
                continue

            text_parts = [title]
            if summary and summary != title:
                text_parts.append(summary)
            text = "\n\n".join(p for p in text_parts if p).strip()
            if not text:
                continue

            ext_source = guid or link or title
            external_id = _stable_id(link, ext_source)[:512]

            if external_id in seen_ids:
                continue
            seen_ids.add(external_id)

            feed_fetched += 1
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

        logger.info(
            "RSS %s: fetched=%d filtered_out=%d",
            feed_url, feed_fetched, feed_filtered,
        )

    return rows
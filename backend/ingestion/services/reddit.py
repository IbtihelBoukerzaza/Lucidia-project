"""Reddit public search JSON (official-style public endpoint; User-Agent required)."""

from __future__ import annotations

import logging
import re
from typing import Any

import requests
from langdetect import detect, LangDetectException

from posts.models import Post

logger = logging.getLogger(__name__)

SEARCH_URL = "https://www.reddit.com/search.json"
USER_AGENT = (
    "SentivyaDZ-Ingestion/1.0 (social listening; +https://localhost) "
    "Python/requests"
)

ALLOWED_LANGS = {"ar", "fr", "en"}

# Common Spanish/Portuguese words that indicate off-topic posts
SPANISH_NOISE = {
    "que", "una", "del", "los", "las", "por", "con", "para",
    "está", "esto", "este", "pero", "como", "más", "también",
    "cuando", "porque", "donde", "desde", "hasta", "tiene",
    "hacer", "sobre", "entre", "cada", "todo", "todos",
}


def _is_relevant(text: str, keyword: str) -> bool:
    """
    Check the post actually mentions the keyword.
    Whole-word match for single words, phrase match for multi-word.
    """
    if not text or not keyword:
        return False

    text_lower = text.lower()
    kw_lower = keyword.lower().strip()
    words = kw_lower.split()

    if len(words) > 1:
        return all(w in text_lower for w in words)

    pattern = r"\b" + re.escape(kw_lower) + r"\b"
    return bool(re.search(pattern, text_lower))


def _is_spanish_noise(text: str) -> bool:
    """
    Detect Spanish/Portuguese posts by counting noise words.
    If more than 3 Spanish words appear, skip the post.
    """
    words = set(re.findall(r"\b\w+\b", text.lower()))
    matches = words & SPANISH_NOISE
    return len(matches) >= 3


def _is_allowed_language(text: str) -> bool:
    """
    Returns True if the overall post language is Arabic, French, or English.
    Also checks word by word — if any word is detected as a foreign language,
    the post is rejected.
    """
    if not text or not text.strip():
        return False

    # Step 1: check overall language of the full text
    try:
        overall_lang = detect(text)
        if overall_lang not in ALLOWED_LANGS:
            logger.debug("Reddit: rejected post (lang=%s): %s", overall_lang, text[:60])
            return False
    except LangDetectException:
        # Can't detect overall — proceed to word-level check
        pass

    # Step 2: word-level check — reject if any word is clearly foreign
    for word in text.split():
        if len(word) < 3:
            continue
        try:
            word_lang = detect(word)
            if word_lang not in ALLOWED_LANGS:
                logger.debug("Reddit: rejected word %r (lang=%s)", word, word_lang)
                return False
        except LangDetectException:
            continue  # can't detect single word — allow it

    return True


def fetch_reddit_posts(
    *,
    keywords: list[str],
    limit_per_keyword: int = 25,
    timeout: int = 30,
) -> list[dict[str, Any]]:
    if not keywords:
        return []

    rows: list[dict[str, Any]] = []
    seen_ids: set[str] = set()

    session = requests.Session()
    session.headers["User-Agent"] = USER_AGENT

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

        fetched = 0
        filtered = 0
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

            # Skip if keyword not actually in the post
            if not _is_relevant(text, kw):
                filtered += 1
                logger.debug("Reddit: filtered irrelevant post %r", title[:60])
                continue

            # Skip Spanish/Portuguese noise posts
            if _is_spanish_noise(text):
                filtered += 1
                logger.debug("Reddit: filtered Spanish noise %r", title[:60])
                continue

            # Skip posts in disallowed languages
            if not _is_allowed_language(text):
                filtered += 1
                logger.debug("Reddit: filtered foreign language post %r", title[:60])
                continue

            # Dedup
            if rid in seen_ids:
                continue
            seen_ids.add(rid)

            full_url = (
                f"https://www.reddit.com{permalink}"
                if permalink.startswith("/")
                else permalink or None
            )
            fetched += 1
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

        logger.info(
            "Reddit: keyword=%r fetched=%d filtered_out=%d",
            kw, fetched, filtered,
        )

    return rows
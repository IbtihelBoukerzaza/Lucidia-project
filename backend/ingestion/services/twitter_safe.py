"""
Twitter / X ingestion: official API v2 first; optional snscrape fallback.

Fallback is OFF by default (ENABLE_TWITTER_SCRAPER=false). Isolated in
fetch_twitter_snscraper; requires optional `snscrape` package.
"""

from __future__ import annotations

import logging
from typing import Any
from urllib.parse import urlencode

import requests

from django.conf import settings

from posts.models import Post

logger = logging.getLogger(__name__)

SEARCH_URL = "https://api.twitter.com/2/tweets/search/recent"


def fetch_twitter_api(
    *,
    bearer_token: str,
    keywords: list[str],
    max_per_keyword: int = 10,
    timeout: int = 30,
) -> tuple[list[dict[str, Any]], bool]:
    """
    Official Twitter API v2 recent search.
    Returns (rows, api_succeeded). api_succeeded is False on auth failure or
    repeated transport errors (caller may use scraper fallback).
    """
    rows: list[dict[str, Any]] = []
    if not bearer_token or not keywords:
        return rows, bool(bearer_token)

    session = requests.Session()
    session.headers["Authorization"] = f"Bearer {bearer_token}"

    for keyword in keywords:
        kw = keyword.strip()
        if not kw:
            continue
        max_res = max(10, min(max_per_keyword, 100))
        params = {
            "query": f"{kw} -is:retweet",
            "max_results": max_res,
            "tweet.fields": "author_id,created_at",
        }
        url = f"{SEARCH_URL}?{urlencode(params)}"
        try:
            r = session.get(url, timeout=timeout)
        except requests.RequestException as exc:
            logger.warning("Twitter API request failed for %r: %s", kw, exc)
            return rows, False

        if r.status_code == 401:
            logger.warning("Twitter API unauthorized; check TWITTER_BEARER_TOKEN.")
            return rows, False
        if r.status_code == 403:
            logger.warning("Twitter API forbidden (plan or permissions).")
            return rows, False
        if r.status_code == 429:
            logger.warning("Twitter API rate limited.")
            return rows, False
        try:
            r.raise_for_status()
            data = r.json()
        except (requests.RequestException, ValueError) as exc:
            logger.warning("Twitter API error for %r: %s", kw, exc)
            return rows, False

        tweets = data.get("data") or []

        for tw in tweets:
            if not isinstance(tw, dict):
                continue
            tid = tw.get("id")
            text = (tw.get("text") or "").strip()
            aid = tw.get("author_id")
            if not tid or not text:
                continue
            rows.append(
                {
                    "text": text[:100000],
                    "external_id": f"twitter:{tid}"[:512],
                    "url": f"https://twitter.com/i/web/status/{tid}",
                    "source": Post.Source.TWITTER,
                    "platform": Post.Platform.SOCIAL,
                    "author": str(aid) if aid is not None else None,
                }
            )

    return rows, True


def fetch_twitter_snscraper(
    *,
    keywords: list[str],
    max_per_keyword: int = 20,
) -> list[dict[str, Any]]:
    """
    Optional fallback using snscrape (not an official API).
    Only invoked when ENABLE_TWITTER_SCRAPER=true in settings.
    """
    rows: list[dict[str, Any]] = []
    if not keywords:
        return rows

    try:
        import snscrape.modules.twitter as sntwitter
    except ImportError:
        logger.warning(
            "Twitter scraper fallback requested but snscrape is not installed. "
            "Install with: pip install snscrape",
        )
        return rows

    for keyword in keywords:
        kw = keyword.strip()
        if not kw:
            continue
        try:
            scraper = sntwitter.TwitterSearchScraper(kw)
            n = 0
            for tweet in scraper.get_items():
                if n >= max_per_keyword:
                    break
                tid = getattr(tweet, "id", None)
                text = (getattr(tweet, "rawContent", None) or getattr(tweet, "content", None) or "").strip()
                if tid is None or not text:
                    continue
                user = getattr(tweet, "user", None)
                author = None
                if user is not None:
                    author = getattr(user, "username", None) or str(getattr(user, "id", "") or "")
                rows.append(
                    {
                        "text": text[:100000],
                        "external_id": f"twitter:{tid}"[:512],
                        "url": f"https://twitter.com/i/web/status/{tid}",
                        "source": Post.Source.TWITTER,
                        "platform": Post.Platform.SOCIAL,
                        "author": (author or None),
                    }
                )
                n += 1
        except Exception as exc:
            logger.warning("snscrape failed for %r: %s", kw, exc)
            continue

    return rows


def fetch_twitter(*, keywords: list[str]) -> list[dict[str, Any]]:
    """
    Try official API when TWITTER_BEARER_TOKEN is set.
    If API fails or token is missing, use snscrape only when
    ENABLE_TWITTER_SCRAPER is true; otherwise return [] (or partial API rows
    if API failed mid-way — we return scraper output on failure when enabled).
    """
    token = (getattr(settings, "TWITTER_BEARER_TOKEN", None) or "").strip()
    scraper_on = getattr(settings, "ENABLE_TWITTER_SCRAPER", False)
    max_api = int(getattr(settings, "INGESTION_TWITTER_MAX_RESULTS", 10))
    max_scrape = int(getattr(settings, "INGESTION_TWITTER_SCRAPER_MAX", 20))

    if token:
        api_rows, ok = fetch_twitter_api(
            bearer_token=token,
            keywords=keywords,
            max_per_keyword=max_api,
        )
        if ok:
            return api_rows
        if scraper_on:
            logger.info("Twitter API unavailable or failed; using snscrape fallback.")
            return fetch_twitter_snscraper(
                keywords=keywords,
                max_per_keyword=max_scrape,
            )
        return api_rows

    if scraper_on:
        logger.info("Twitter: no bearer token; using snscrape fallback only.")
        return fetch_twitter_snscraper(
            keywords=keywords,
            max_per_keyword=max_scrape,
        )

    return []

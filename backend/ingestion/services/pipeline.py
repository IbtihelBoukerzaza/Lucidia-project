"""Orchestrate all ingestion sources into posts.Post."""

from __future__ import annotations

import logging
from typing import Any

from django.conf import settings
from companies.models import Company ,CompanyKeyword

from . import gdelt, google_news, hackernews, reddit, rss_feeds, youtube
from .store import upsert_post
from .twitter_safe import fetch_twitter
from .x_scraper import fetch_x_comments
from .facebook_scraper import fetch_last_post_comments
from .facebook import normalize_facebook_data
logger = logging.getLogger(__name__)


def run_ingestion(
    company_id: int,
    *,
    skip_gdelt: bool = False,
    skip_rss: bool = False,
    skip_youtube: bool = False,
    skip_twitter: bool = False,
    skip_google_news: bool = False,
    skip_reddit: bool = False,
    skip_hackernews: bool = False,
    skip_facebook: bool = False,
) -> dict[str, Any]:
    """
    Fetch from enabled sources, normalize, and upsert posts for the given company.
    """
    Company.objects.get(pk=company_id)

    stats: dict[str, Any] = {
        "company_id": company_id,
        "created": 0,
        "existing": 0,
        "skipped": 0,
        "sources": {},
    }

    keywords = list(
    CompanyKeyword.objects
    .filter(company_id=company_id)
    .values_list("keyword", flat=True)
)
    if not keywords:
     keywords = list(getattr(settings, "INGESTION_KEYWORDS", []) or [])
    rss_urls = list(getattr(settings, "INGESTION_RSS_FEEDS", []) or [])
    rss_filter = bool(getattr(settings, "INGESTION_RSS_FILTER_BY_KEYWORDS", True))

    google_news_on = bool(getattr(settings, "GOOGLE_NEWS_ENABLED", True))
    reddit_on = bool(getattr(settings, "REDDIT_ENABLED", True))
    hackernews_on = bool(getattr(settings, "HACKERNEWS_ENABLED", True))

    def consume(source: str, rows: list[dict[str, Any]]) -> None:
        created = existing = skipped = 0
        for row in rows:
            post, is_new = upsert_post(company_id=company_id, row=row)
            if post is None:
                skipped += 1
            elif is_new:
                created += 1
            else:
                existing += 1
        stats["sources"][source] = {
            "fetched": len(rows),
            "created": created,
            "existing": existing,
            "skipped": skipped,
        }
        stats["created"] += created
        stats["existing"] += existing
        stats["skipped"] += skipped

    if not skip_gdelt and keywords:
        max_g = int(getattr(settings, "INGESTION_GDELT_MAX_RECORDS", 15))
        rows = gdelt.fetch_gdelt_articles(keywords=keywords, max_per_keyword=max_g)
        logger.info("GDELT: fetched %s candidate rows", len(rows))
        consume("gdelt", rows)
    elif not skip_gdelt:
        stats["sources"]["gdelt"] = {"skipped": True, "reason": "no keywords"}

    if not skip_rss and rss_urls:
        rows = rss_feeds.fetch_rss_entries(
            feed_urls=rss_urls,
            keywords=keywords,
            filter_by_keywords=rss_filter and bool(keywords),
        )
        logger.info("RSS: fetched %s candidate rows", len(rows))
        consume("rss", rows)
    elif not skip_rss:
        stats["sources"]["rss"] = {"skipped": True, "reason": "no feeds"}

    if not skip_google_news and google_news_on and keywords:
        rows = google_news.fetch_google_news(keywords=keywords)
        logger.info("Google News: fetched %s candidate rows", len(rows))
        consume("google_news", rows)
    elif not skip_google_news:
        stats["sources"]["google_news"] = {
            "skipped": True,
            "reason": "disabled, no keywords, or --skip-google-news",
        }

    if not skip_reddit and reddit_on and keywords:
        rows = reddit.fetch_reddit_posts(
            keywords=keywords,
            limit_per_keyword=int(
                getattr(settings, "INGESTION_REDDIT_LIMIT", 25),
            ),
        )
        logger.info("Reddit: fetched %s candidate rows", len(rows))
        consume("reddit", rows)
    elif not skip_reddit:
        stats["sources"]["reddit"] = {
            "skipped": True,
            "reason": "disabled, no keywords, or --skip-reddit",
        }

    if not skip_hackernews and hackernews_on and keywords:
        rows = hackernews.fetch_hackernews_hits(
            keywords=keywords,
            hits_per_keyword=int(
                getattr(settings, "INGESTION_HACKERNEWS_HITS", 20),
            ),
        )
        logger.info("Hacker News: fetched %s candidate rows", len(rows))
        consume("hackernews", rows)
    elif not skip_hackernews:
        stats["sources"]["hackernews"] = {
            "skipped": True,
            "reason": "disabled, no keywords, or --skip-hackernews",
        }

    yt_key = (getattr(settings, "YOUTUBE_API_KEY", None) or "").strip()
    if not skip_youtube and keywords and yt_key:
        rows = youtube.fetch_youtube_comments(
            api_key=yt_key,
            keywords=keywords,
            max_videos_per_keyword=int(
                getattr(settings, "INGESTION_YOUTUBE_MAX_VIDEOS", 5)
            ),
            max_comments_per_video=int(
                getattr(settings, "INGESTION_YOUTUBE_MAX_COMMENTS", 50)
            ),
        )
        logger.info("YouTube: fetched %s candidate rows", len(rows))
        consume("youtube", rows)
    elif not skip_youtube:
        stats["sources"]["youtube"] = {
            "skipped": True,
            "reason": "no API key or no keywords",
        }

    # X / Twitter scraping (safe fallback)
    if not skip_twitter and keywords:
        rows = fetch_x_comments(
        keywords=keywords,
        max_per_keyword=int(
            getattr(settings, "INGESTION_TWITTER_SCRAPER_MAX", 20)
        ),
    )
        logger.info("X (scraper): fetched %s candidate rows", len(rows))
        consume("x", rows)
    elif not skip_twitter:
        stats["sources"]["x"] = {"skipped": True, "reason": "no keywords"}
       # Facebook scraping
    if not skip_facebook:
      try:
        # ⚠️ IMPORTANT: you must decide how to get the page URL
        facebook_url = getattr(settings, "FACEBOOK_PAGE_URL", None)

        if not facebook_url:
            stats["sources"]["facebook"] = {
                "skipped": True,
                "reason": "no FACEBOOK_PAGE_URL configured",
            }
        else:
            raw_data = fetch_last_post_comments(facebook_url)

            rows = normalize_facebook_data(raw_data)

            logger.info("Facebook: fetched %s candidate rows", len(rows))

            consume("facebook", rows)

      except Exception as e:
        logger.exception("Facebook ingestion failed: %s", e)
        stats["sources"]["facebook"] = {
            "error": str(e),
        }
    else:
        stats["sources"]["facebook"] = {
        "skipped": True,
        "reason": "--skip-facebook",
    }

    return stats

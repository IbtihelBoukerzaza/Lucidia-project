"""Orchestrate all ingestion sources into posts.Post."""

from __future__ import annotations

import logging
from typing import Any

from django.conf import settings

from companies.models import Company, CompanyKeyword, CompanySocialProfile
from .store import upsert_post
from . import google_news, reddit, rss_feeds, youtube
from .twitter_safe import fetch_twitter
from .x_scraper import fetch_x_comments
from .facebook_scraper import fetch_last_post_comments
from .facebook import normalize_facebook_data
from .instagram_scraper import fetch_instagram_comments
from .instagram import normalize_instagram_data
from .tiktok_scraper import fetch_tiktok_comments
from .tiktok import normalize_tiktok_data

logger = logging.getLogger(__name__)


def _get_social_urls(company_id: int, platform: str) -> list[str]:
    """
    Return active URLs for a given platform from CompanySocialProfile.
    Most platforms return one URL. RSS can return many.
    """
    return list(
        CompanySocialProfile.objects
        .filter(company_id=company_id, platform=platform, is_active=True)
        .values_list("url", flat=True)
    )


def _get_keywords(company_id: int) -> list[str]:
    """
    Return keywords configured in DB for this company.
    """
    return list(
        CompanyKeyword.objects
        .filter(company_id=company_id)
        .values_list("keyword", flat=True)
    )


def run_ingestion(
    company_id: int,
    *,
    skip_rss: bool = False,
    skip_youtube: bool = False,
    skip_twitter: bool = False,
    skip_google_news: bool = False,
    skip_reddit: bool = False,
    skip_facebook: bool = False,
    skip_instagram: bool = False,
    skip_tiktok: bool = False,
) -> dict[str, Any]:
    """
    Fetch from all enabled sources, normalize, and upsert posts
    for the given company. All URLs are read from CompanySocialProfile.
    Keywords are read from CompanyKeyword.
    """
    # Verify company exists — raises Company.DoesNotExist if not
    Company.objects.get(pk=company_id)

    stats: dict[str, Any] = {
        "company_id": company_id,
        "created": 0,
        "existing": 0,
        "skipped": 0,
        "sources": {},
    }

    # --- Load company data from DB ---
    keywords = _get_keywords(company_id)
    rss_urls = _get_social_urls(company_id, "rss")
    facebook_urls = _get_social_urls(company_id, "facebook")
    instagram_urls = _get_social_urls(company_id, "instagram")
    tiktok_urls = _get_social_urls(company_id, "tiktok")

    # --- Settings-based toggles ---
    rss_filter = bool(getattr(settings, "INGESTION_RSS_FILTER_BY_KEYWORDS", True))
    google_news_on = bool(getattr(settings, "GOOGLE_NEWS_ENABLED", True))
    reddit_on = bool(getattr(settings, "REDDIT_ENABLED", True))
    

    # -------------------------------------------------------------------
    # Internal helper: store a batch of rows and update stats
    # -------------------------------------------------------------------
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
        logger.info(
            "%s: fetched=%d created=%d existing=%d skipped=%d",
            source, len(rows), created, existing, skipped,
        )

   
    # -------------------------------------------------------------------
    # RSS — feed URLs from CompanySocialProfile (platform="rss")
    # -------------------------------------------------------------------
    if not skip_rss and rss_urls:
        try:
            rows = rss_feeds.fetch_rss_entries(
                feed_urls=rss_urls,
                keywords=keywords,
                filter_by_keywords=rss_filter and bool(keywords),
            )
            consume("rss", rows)
        except Exception as e:
            logger.exception("RSS ingestion failed: %s", e)
            stats["sources"]["rss"] = {"error": str(e)}
    else:
        stats["sources"]["rss"] = {
            "skipped": True,
            "reason": "no RSS feeds configured" if not rss_urls else "--skip-rss",
        }

    # -------------------------------------------------------------------
    # Google News — keyword-based
    # -------------------------------------------------------------------
    if not skip_google_news and google_news_on and keywords:
        try:
            rows = google_news.fetch_google_news(keywords=keywords)
            consume("google_news", rows)
        except Exception as e:
            logger.exception("Google News ingestion failed: %s", e)
            stats["sources"]["google_news"] = {"error": str(e)}
    else:
        stats["sources"]["google_news"] = {
            "skipped": True,
            "reason": "disabled or no keywords",
        }

    # -------------------------------------------------------------------
    # Reddit — keyword-based
    # -------------------------------------------------------------------
    if not skip_reddit and reddit_on and keywords:
        try:
            rows = reddit.fetch_reddit_posts(
                keywords=keywords,
                limit_per_keyword=int(getattr(settings, "INGESTION_REDDIT_LIMIT", 25)),
            )
            consume("reddit", rows)
        except Exception as e:
            logger.exception("Reddit ingestion failed: %s", e)
            stats["sources"]["reddit"] = {"error": str(e)}
    else:
        stats["sources"]["reddit"] = {
            "skipped": True,
            "reason": "disabled or no keywords",
        }


    # -------------------------------------------------------------------
    # YouTube — keyword-based, requires API key
    # -------------------------------------------------------------------
    yt_key = (getattr(settings, "YOUTUBE_API_KEY", None) or "").strip()
    if not skip_youtube and keywords and yt_key:
        try:
            rows = youtube.fetch_youtube_comments(
                api_key=yt_key,
                keywords=keywords,
                max_videos_per_keyword=int(getattr(settings, "INGESTION_YOUTUBE_MAX_VIDEOS", 5)),
                max_comments_per_video=int(getattr(settings, "INGESTION_YOUTUBE_MAX_COMMENTS", 50)),
            )
            consume("youtube", rows)
        except Exception as e:
            logger.exception("YouTube ingestion failed: %s", e)
            stats["sources"]["youtube"] = {"error": str(e)}
    else:
        stats["sources"]["youtube"] = {
            "skipped": True,
            "reason": "no API key or no keywords",
        }

    # -------------------------------------------------------------------
    # X / Twitter — keyword-based
    # Official API if bearer token set, otherwise Playwright scraper
    # -------------------------------------------------------------------
    if not skip_twitter and keywords:
        try:
            token = (getattr(settings, "TWITTER_BEARER_TOKEN", None) or "").strip()
            if token:
                rows = fetch_twitter(keywords=keywords)
            else:
                scraper_enabled = bool(getattr(settings, "ENABLE_TWITTER_SCRAPER", True))
                if not scraper_enabled:
                    stats["sources"]["twitter"] = {
                        "skipped": True,
                        "reason": "no bearer token and ENABLE_TWITTER_SCRAPER is false",
                    }
                    rows = None
                else:
                    rows = fetch_x_comments(
                        keywords=keywords,
                        max_per_keyword=int(getattr(settings, "INGESTION_TWITTER_SCRAPER_MAX", 20)),
                    )
            if rows is not None:
                consume("twitter", rows)
        except Exception as e:
            logger.exception("X/Twitter ingestion failed: %s", e)
            stats["sources"]["twitter"] = {"error": str(e)}
    else:
        stats["sources"]["twitter"] = {
            "skipped": True,
            "reason": "no keywords" if not keywords else "--skip-twitter",
        }

    # -------------------------------------------------------------------
    # Facebook — profile URL from CompanySocialProfile (platform="facebook")
    # -------------------------------------------------------------------
    if not skip_facebook:
        if not facebook_urls:
            stats["sources"]["facebook"] = {
                "skipped": True,
                "reason": "no active Facebook profile URL configured for company",
            }
        else:
            try:
                # One Facebook page per company
                facebook_url = facebook_urls[0]
                raw_data = fetch_last_post_comments(facebook_url)
                rows = normalize_facebook_data(raw_data)
                consume("facebook", rows)
            except Exception as e:
                logger.exception("Facebook ingestion failed: %s", e)
                stats["sources"]["facebook"] = {"error": str(e)}
    else:
        stats["sources"]["facebook"] = {
            "skipped": True,
            "reason": "--skip-facebook",
        }

    # -------------------------------------------------------------------
    # Instagram — profile URL from CompanySocialProfile (platform="instagram")
    # -------------------------------------------------------------------
    if not skip_instagram:
        if not instagram_urls:
            stats["sources"]["instagram"] = {
                "skipped": True,
                "reason": "no active Instagram profile URL configured for company",
            }
        else:
            try:
                instagram_url = instagram_urls[0]
                raw_rows = fetch_instagram_comments(
                    page_url=instagram_url,
                    post_limit=int(getattr(settings, "INGESTION_INSTAGRAM_POST_LIMIT", 5)),
                    comment_limit=int(getattr(settings, "INGESTION_INSTAGRAM_COMMENT_LIMIT", 30)),
                )
                rows = normalize_instagram_data(raw_rows)
                consume("instagram", rows)
            except Exception as e:
                logger.exception("Instagram ingestion failed: %s", e)
                stats["sources"]["instagram"] = {"error": str(e)}
    else:
        stats["sources"]["instagram"] = {
            "skipped": True,
            "reason": "--skip-instagram",
        }

    # -------------------------------------------------------------------
    # TikTok — profile URL from CompanySocialProfile (platform="tiktok")
    # -------------------------------------------------------------------
    if not skip_tiktok:
        if not tiktok_urls:
            stats["sources"]["tiktok"] = {
                "skipped": True,
                "reason": "no active TikTok profile URL configured for company",
            }
        else:
            try:
                tiktok_url = tiktok_urls[0]
                raw_rows = fetch_tiktok_comments(
                    profile_url=tiktok_url,
                    video_limit=int(getattr(settings, "INGESTION_TIKTOK_VIDEO_LIMIT", 5)),
                    comment_limit=int(getattr(settings, "INGESTION_TIKTOK_COMMENT_LIMIT", 30)),
                )
                rows = normalize_tiktok_data(raw_rows)
                consume("tiktok", rows)
            except Exception as e:
                logger.exception("TikTok ingestion failed: %s", e)
                stats["sources"]["tiktok"] = {"error": str(e)}
    else:
        stats["sources"]["tiktok"] = {
            "skipped": True,
            "reason": "--skip-tiktok",
        }

        # ── Evaluate alert rules after every ingestion run ──────────────────
    try:
        from alerts.evaluator import evaluate_rules
        fired = evaluate_rules(company_id)
        stats["alerts_fired"] = fired
    except Exception as e:
        logger.exception("Alert evaluation failed: %s", e)
        stats["alerts_fired"] = 0

    return stats
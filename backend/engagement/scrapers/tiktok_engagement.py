"""
engagement/scrapers/tiktok_engagement.py

Scrapes like / comment / view / share counts from TikTok videos.
Given a profile URL, collects recent video URLs then scrapes
engagement metrics from each video page.

Uses the same tiktok_cookies.json as the ingestion scraper.

Returns a list of dicts, one per video:
    {
        "url":           str,
        "like_count":    int | None,
        "comment_count": int | None,
        "view_count":    int | None,
        "share_count":   int | None,
        "title":         str,
    }
"""

from __future__ import annotations

import json
import logging
import re
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


# ── Cookie loader ─────────────────────────────────────────────────────────────

def _load_cookies(cookies_path: str) -> list[dict]:
    path = Path(cookies_path)
    if not path.exists():
        logger.error("tiktok_cookies.json not found at %s", cookies_path)
        return []
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        logger.error("Failed to read tiktok_cookies.json: %s", exc)
        return []

    cookies = []
    for c in raw:
        name  = c.get("name", "")
        value = c.get("value", "")
        if not name or not value:
            continue
        domain = c.get("domain", ".tiktok.com")
        if not domain.startswith("."):
            domain = "." + domain
        raw_ss = (c.get("sameSite") or "no_restriction").lower()
        if "strict" in raw_ss:
            same_site = "Strict"
        elif "lax" in raw_ss:
            same_site = "Lax"
        else:
            same_site = "None"
        cookies.append({
            "name":     name,
            "value":    value,
            "domain":   domain,
            "path":     c.get("path", "/"),
            "secure":   c.get("secure", True),
            "httpOnly": c.get("httpOnly", False),
            "sameSite": same_site,
        })

    logger.info("Loaded %d TikTok cookies", len(cookies))
    return cookies


# ── Helpers ───────────────────────────────────────────────────────────────────

def _parse_count(text: str) -> int | None:
    if not text:
        return None
    text = text.strip().replace(",", "").replace("\u202f", "").replace("\xa0", "")
    multipliers = {"K": 1_000, "k": 1_000, "M": 1_000_000, "m": 1_000_000}
    for suffix, mult in multipliers.items():
        if text.endswith(suffix):
            try:
                return int(float(text[:-1]) * mult)
            except ValueError:
                return None
    try:
        return int(float(text))
    except ValueError:
        return None


def _extract_video_id(url: str) -> str | None:
    match = re.search(r"/video/(\d+)", url)
    return match.group(1) if match else None


# ── Step 1: collect video URLs from profile page ──────────────────────────────

def _get_video_links(page: Any, profile_url: str, limit: int) -> list[str]:
    from playwright.sync_api import TimeoutError as PWTimeout

    logger.info("Opening TikTok profile: %s", profile_url)
    page.goto(profile_url, wait_until="domcontentloaded", timeout=60_000)
    page.wait_for_timeout(5_000)

    if "login" in page.url:
        logger.error("TikTok redirected to login — cookies may be expired")
        return []

    try:
        page.wait_for_selector("a[href*='/video/']", timeout=20_000)
    except PWTimeout:
        logger.warning("No video links found on TikTok profile page")
        return []

    for _ in range(3):
        page.mouse.wheel(0, 2000)
        page.wait_for_timeout(1_000)

    hrefs = page.eval_on_selector_all(
        "a[href*='/video/']",
        "els => [...new Set(els.map(e => e.href))]"
    )

    username = profile_url.rstrip("/").split("/")[-1].lstrip("@")
    video_links = []
    for href in hrefs:
        if re.search(r"/video/\d+", href) and username in href:
            video_links.append(href)

    logger.info("Found %d video links for @%s", len(video_links), username)
    return video_links[:limit]


# ── Step 2: scrape engagement from a single video page ────────────────────────

def _scrape_video_metrics(page: Any, video_url: str) -> dict:
    from playwright.sync_api import TimeoutError as PWTimeout

    result = {
        "url":           video_url,
        "like_count":    None,
        "comment_count": None,
        "share_count":   None,
        "view_count":    None,
        "title":         "",
    }

    logger.info("Scraping TikTok video: %s", video_url)
    page.goto(video_url, wait_until="domcontentloaded", timeout=30_000)

    # Wait for the action bar to fully render — this is the key fix.
    # We wait for any data-e2e element that signals JS hydration is done.
    # "like-count", "comment-count", or "share-count" all work.
    # Timeout 20s — TikTok JS hydration can be slow on headless.
    hydrated = False
    for selector in [
        "[data-e2e='like-count']",
        "[data-e2e='comment-count']",
        "[data-e2e='share-count']",
        "[data-e2e='browse-like-count']",
        "[data-e2e='browse-comment-count']",
    ]:
        try:
            page.wait_for_selector(selector, timeout=20_000)
            hydrated = True
            logger.debug("TikTok page hydrated via selector: %s", selector)
            break
        except PWTimeout:
            continue

    if not hydrated:
        logger.warning(
            "TikTok page did not fully hydrate for %s — counts may be None",
            video_url,
        )

    # Extract counts — try both video-page and browse-page selector variants
    # TikTok uses different data-e2e names depending on how the page is loaded
    for field, selectors in [
        ("like_count",    ["[data-e2e='like-count']",    "[data-e2e='browse-like-count']"]),
        ("comment_count", ["[data-e2e='comment-count']", "[data-e2e='browse-comment-count']"]),
        ("share_count",   ["[data-e2e='share-count']",   "[data-e2e='browse-share-count']"]),
        ("view_count",    ["[data-e2e='video-views']",   "[data-e2e='browse-video-play-count']",
                           "[data-e2e='video-play-count']"]),
    ]:
        for sel in selectors:
            try:
                el = page.locator(sel).first
                if el.count() > 0:
                    raw = el.inner_text().strip()
                    if raw:
                        result[field] = _parse_count(raw)
                        break
            except Exception as exc:
                logger.debug("%s selector %s failed: %s", field, sel, exc)

    # Title
    try:
        title = page.title().strip()
        if " | " in title:
            title = title.split(" | ")[0].strip()
        if title and title.lower() != "tiktok - make your day":
            result["title"] = title
        else:
            # Fallback: grab the video description text
            for sel in ["[data-e2e='browse-video-desc']", "[data-e2e='video-desc']"]:
                el = page.locator(sel).first
                if el.count() > 0:
                    result["title"] = el.inner_text().strip()[:120]
                    break
    except Exception:
        pass

    logger.info(
        "tiktok_video %s → likes=%s comments=%s shares=%s views=%s",
        video_url,
        result["like_count"],
        result["comment_count"],
        result["share_count"],
        result["view_count"],
    )
    return result


# ── Public entry point ────────────────────────────────────────────────────────

def scrape_tiktok_engagement(
    profile_url: str,
    cookies_path: str,
    video_limit: int = 10,
) -> list[dict]:
    """
    Main entry point.

    Args:
        profile_url:  TikTok profile URL, e.g. https://www.tiktok.com/@mobilis.dz
        cookies_path: Absolute path to tiktok_cookies.json
        video_limit:  Max number of recent videos to scrape (default 10)

    Returns:
        List of dicts, one per video, each with:
        url, like_count, comment_count, share_count, view_count, title
    """
    from playwright.sync_api import sync_playwright

    cookies = _load_cookies(cookies_path)
    if not cookies:
        raise RuntimeError(
            f"Could not load TikTok cookies from {cookies_path}. "
            "Export cookies from Cookie-Editor while logged into tiktok.com."
        )

    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled"],
        )
        context = browser.new_context(
            viewport={"width": 1280, "height": 900},
            locale="en-US",
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/123.0.0.0 Safari/537.36"
            ),
        )
        context.add_cookies(cookies)
        page = context.new_page()

        video_links = _get_video_links(page, profile_url, video_limit)

        if not video_links:
            logger.warning("No video links found for %s", profile_url)
            context.close()
            browser.close()
            return []

        for video_url in video_links:
            try:
                metrics = _scrape_video_metrics(page, video_url)
                results.append(metrics)
            except Exception as exc:
                logger.error("Failed to scrape TikTok video %s: %s", video_url, exc)
                results.append({
                    "url":           video_url,
                    "like_count":    None,
                    "comment_count": None,
                    "share_count":   None,
                    "view_count":    None,
                    "title":         "",
                })

        context.close()
        browser.close()

    logger.info("TikTok engagement scrape done. %d videos scraped.", len(results))
    return results
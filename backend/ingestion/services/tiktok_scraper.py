"""
ingestion/services/tiktok_scraper.py

Playwright-based TikTok comment scraper.
Scrapes comments from recent videos on a TikTok profile page.

Setup:
    1. Log into TikTok in real Chrome
    2. Export cookies with Cookie-Editor extension
    3. Save as tiktok_cookies.json next to manage.py

Returns pipeline-compatible rows:
    {text, source, platform, external_id, url, author}
"""

from __future__ import annotations

import json
import logging
import re
import time
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

COOKIES_FILE = Path("tiktok_cookies.json")
TIKTOK_BASE = "https://www.tiktok.com"
SCREENSHOT_DIR = Path("debug_screenshots")


# -------------------------------------------------------------------
# Cookie loader
# -------------------------------------------------------------------

def _load_cookies() -> list[dict]:
    if not COOKIES_FILE.exists():
        logger.error(
            "tiktok_cookies.json not found. "
            "Export cookies from Cookie-Editor while logged into tiktok.com "
            "and save as tiktok_cookies.json next to manage.py"
        )
        return []
    try:
        raw = json.loads(COOKIES_FILE.read_text(encoding="utf-8"))
    except Exception as e:
        logger.error("Failed to read tiktok_cookies.json: %s", e)
        return []

    cookies = []
    for c in raw:
        name = c.get("name", "")
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
            "name": name,
            "value": value,
            "domain": domain,
            "path": c.get("path", "/"),
            "secure": c.get("secure", True),
            "httpOnly": c.get("httpOnly", False),
            "sameSite": same_site,
        })

    logger.info("Loaded %d TikTok cookies", len(cookies))
    return cookies


# -------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------

def _clean(text: str) -> str:
    return " ".join((text or "").split())


def _extract_video_id(url: str) -> str | None:
    match = re.search(r"/video/(\d+)", url)
    return match.group(1) if match else None


def _is_noise(text: str) -> bool:
    if not text or len(text) < 2:
        return True
    noise = {
        "reply", "like", "view replies", "see more",
        "follow", "following", "log in", "sign up",
        "load more", "view more comments",
    }
    return text.lower() in noise


# -------------------------------------------------------------------
# Profile: collect video URLs
# -------------------------------------------------------------------

def _get_video_links(page: Any, profile_url: str, limit: int) -> list[str]:
    from playwright.sync_api import TimeoutError as PWTimeout

    logger.info("Opening profile: %s", profile_url)
    page.goto(profile_url, wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(60000)

    if "login" in page.url:
        logger.error("TikTok redirected to login — cookies may be expired")
        return []

    try:
        page.wait_for_selector("a[href*='/video/']", timeout=20000)
    except PWTimeout:
        logger.warning("No video links found on profile page")
        return []

    for _ in range(3):
        page.mouse.wheel(0, 2000)
        page.wait_for_timeout(1000)

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


# -------------------------------------------------------------------
# Comment panel: open + scroll
# -------------------------------------------------------------------

def _open_comment_panel(page: Any) -> bool:
    """
    Diagnose what's on the page then try every known selector to open comments.
    """
    from playwright.sync_api import TimeoutError as PWTimeout

    # --- Log page state ---
    logger.info("Current URL: %s", page.url)
    logger.info("Page title: %s", page.title())

    # --- Probe all candidate selectors ---
    for sel in [
        "[data-e2e='comment-count']",
        "[data-e2e='comment-icon']",
        "button[aria-label*='comment' i]",
        "[data-e2e='browse-comment-count']",
        "[data-e2e='browse-comment-icon']",
        "[data-e2e='comment-panel']",
        "div[class*='comment' i]",
    ]:
        try:
            count = page.locator(sel).count()
            visible = False
            if count > 0:
                visible = page.locator(sel).first.is_visible(timeout=2000)
            logger.info("  %-50s → count=%d visible=%s", sel, count, visible)
        except Exception as e:
            logger.info("  %-50s → ERROR: %s", sel, e)

    # --- Screenshot current state ---
    SCREENSHOT_DIR.mkdir(exist_ok=True)
    page.screenshot(path=str(SCREENSHOT_DIR / "tiktok_video_page.png"))
    logger.info("Screenshot saved: debug_screenshots/tiktok_video_page.png")

    # --- Try clicking each candidate ---
    for selector in [
        "[data-e2e='comment-count']",
        "[data-e2e='comment-icon']",
        "[data-e2e='browse-comment-count']",
        "[data-e2e='browse-comment-icon']",
    ]:
        try:
            el = page.locator(selector).first
            if el.is_visible(timeout=2000):
                logger.info("Clicking: %s", selector)
                el.click()
                page.wait_for_timeout(3000)

                after = page.locator("[data-e2e='comment-level-1']").count()
                logger.info(
                    "After clicking %s — comment-level-1 count: %d",
                    selector, after
                )
                if after > 0:
                    return True
        except Exception as e:
            logger.debug("Click failed for %s: %s", selector, e)
            continue

    logger.warning("Could not open comment panel")
    return False


def _scroll_comment_panel(page: Any, rounds: int = 5) -> None:
    panel = page.locator("div[class*='CommentList']").first
    try:
        if not panel.is_visible(timeout=2000):
            return
    except Exception:
        return

    for _ in range(rounds):
        try:
            panel.evaluate("el => el.scrollBy(0, 600)")
            page.wait_for_timeout(2000)
        except Exception:
            break


# -------------------------------------------------------------------
# Video: extract comments
# -------------------------------------------------------------------

def _extract_comments_from_video(
    page: Any,
    video_url: str,
    comment_limit: int,
) -> list[dict]:
    from playwright.sync_api import TimeoutError as PWTimeout

    logger.info("Opening video: %s", video_url)
    page.goto(video_url, wait_until="domcontentloaded", timeout=30000)
    page.wait_for_timeout(6000)  # longer wait — no media blocking

    if not _open_comment_panel(page):
        return []

    try:
        page.wait_for_selector(
            "[data-e2e='comment-level-1']",
            timeout=8000,
        )
    except PWTimeout:
        logger.warning("Comment list did not appear for %s", video_url)
        return []

    _scroll_comment_panel(page, rounds=5)
    page.wait_for_timeout(2000)

    comment_nodes = page.query_selector_all("[data-e2e='comment-level-1']")
    logger.info("Found %d comment nodes", len(comment_nodes))

    comments = []
    seen = set()

    for node in comment_nodes:
        if len(comments) >= comment_limit:
            break
        parsed = _parse_comment_node(node)
        if parsed is None:
            continue
        if parsed["text"] in seen:
            continue
        seen.add(parsed["text"])
        comments.append(parsed)

    logger.info("Extracted %d comments from %s", len(comments), video_url)
    return comments


def _parse_comment_node(node: Any) -> dict | None:
    try:
        # Author
        author = None
        author_el = node.query_selector("[data-e2e='comment-username-1']")
        if author_el:
            author = _clean(author_el.inner_text()) or None

        # Comment text — try specific selectors first, fall back to full node
        text = None
        for sel in [
            "p[data-e2e='comment-text-content']",
            "span[data-e2e='comment-text-content']",
            "[data-e2e='comment-text']",
        ]:
            el = node.query_selector(sel)
            if el:
                text = _clean(el.inner_text())
                break

        if not text:
            # Fallback: full node text minus author name
            full_text = _clean(node.inner_text())
            if author and full_text.startswith(author):
                text = full_text[len(author):].strip()
            else:
                text = full_text

        if not text or len(text) < 2:
            return None
        if _is_noise(text):
            return None

        return {"author": author, "text": text}

    except Exception as e:
        logger.debug("Failed to parse comment node: %s", e)
        return None


# -------------------------------------------------------------------
# Public entry point
# -------------------------------------------------------------------

def fetch_tiktok_comments(
    profile_url: str,
    video_limit: int = 5,
    comment_limit: int = 30,
) -> list[dict[str, Any]]:
    """
    Main entry point — called by pipeline.py and management command.
    Scrapes comments from recent videos on a TikTok profile.
    Returns normalized rows compatible with upsert_post().
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        logger.warning("Playwright not installed — TikTok scraping skipped.")
        return []

    cookies = _load_cookies()
    if not cookies:
        return []

    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,  # keep visible during debugging
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

        # Media blocking removed — may prevent comment panel from initializing

        video_links = _get_video_links(page, profile_url, video_limit)

        if not video_links:
            logger.error("No videos found on %s", profile_url)
            context.close()
            browser.close()
            return []

        for video_url in video_links:
            video_id = _extract_video_id(video_url)
            if not video_id:
                continue

            comments = _extract_comments_from_video(
                page, video_url, comment_limit
            )

            for idx, c in enumerate(comments):
                results.append({
                    "text": c["text"],
                    "source": "tiktok",
                    "platform": "social",
                    "external_id": f"tiktok_{video_id}_{idx}",
                    "url": video_url,
                    "author": c.get("author"),
                })
                logger.info(
                    "  @%s: %r", c.get("author"), c["text"][:60]
                )

            time.sleep(2)

        context.close()
        browser.close()

    logger.info("TikTok scrape done. Total rows: %d", len(results))
    return results
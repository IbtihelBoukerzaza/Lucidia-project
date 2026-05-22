"""
engagement/scrapers/instagram_engagement.py

Scrapes like / comment / view counts from an Instagram post or reel URL.
Uses the same persistent Playwright session as the ingestion scraper
(playwright_instagram_session directory).

DOM strategy (confirmed via live inspection):
  All three counts (likes, comments, shares) live together inside a single
  <section> element — the action bar. They are NOT individually adjacent to
  their button SVGs. We locate the section via the Comment SVG (which is 4
  levels below it), collect all purely-numeric span texts in DOM order, and
  assign them positionally: [0]=likes, [1]=comments, [2]=shares.

Returns:
    {
        "like_count":    int | None,
        "comment_count": int | None,
        "share_count":   int | None,
        "view_count":    int | None,
        "title":         str,
    }
"""

import logging
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

logger = logging.getLogger(__name__)

USER_DATA_DIR = "playwright_instagram_session"


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


def _slug_title(url: str) -> str:
    try:
        parts = urlparse(url).path.strip("/").split("/")
        if parts:
            return parts[0]
    except Exception:
        pass
    return ""


def scrape_instagram_engagement(post_url: str) -> dict:
    """
    Main entry point.

    Args:
        post_url: Full URL of an Instagram post or reel.

    Returns:
        dict with like_count, comment_count, share_count, view_count, title.
    """
    result = {
        "like_count":    None,
        "comment_count": None,
        "share_count":   None,
        "view_count":    None,
        "title":         _slug_title(post_url),
    }

    try:
        with sync_playwright() as p:
            context = p.chromium.launch_persistent_context(
                USER_DATA_DIR,
                headless=True,
                args=["--disable-blink-features=AutomationControlled"],
                viewport={"width": 1280, "height": 900},
                locale="en-US",
            )
            page = context.new_page()

            page.route(
                "**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,mp4,webm}",
                lambda route: route.abort(),
            )

            page.goto(post_url, wait_until="domcontentloaded", timeout=30_000)
            page.wait_for_timeout(3_000)

            counts = page.evaluate("""() => {
                // Locate the action bar <section> via the Comment SVG —
                // confirmed to be exactly 4 parentElement levels above it.
                const commentSvg = document.querySelector("svg[aria-label='Comment']");
                if (!commentSvg) return [];

                // Walk up 4 levels to reach the <section>
                let section = commentSvg;
                for (let i = 0; i < 4; i++) {
                    section = section.parentElement;
                    if (!section) return [];
                }

                // Collect all purely-numeric span texts in DOM order.
                // DOM order is: likes first, then comments, then shares.
                const nums = [];
                for (const span of section.querySelectorAll('span')) {
                    const t = span.innerText.trim();
                    if (/^\\d[\\d,\\.]*[KkMm]?$/.test(t)) {
                        nums.push(t);
                    }
                }
                return nums;
            }""")

            if counts and len(counts) >= 1:
                result["like_count"]    = _parse_count(counts[0])
            if counts and len(counts) >= 2:
                result["comment_count"] = _parse_count(counts[1])
            if counts and len(counts) >= 3:
                result["share_count"]   = _parse_count(counts[2])

            # View count for reels/videos
            try:
                view_raw = page.evaluate("""() => {
                    const vp = document.querySelector("[aria-label='Video player']");
                    if (!vp) return null;
                    let container = vp.parentElement;
                    if (!container) return null;
                    for (const span of container.querySelectorAll('span')) {
                        const t = span.innerText.trim();
                        if (/^\\d[\\d,\\.]*[KkMm]?$/.test(t)) return t;
                    }
                    return null;
                }""")
                if view_raw:
                    result["view_count"] = _parse_count(view_raw)
            except Exception as exc:
                logger.debug("view_count failed: %s", exc)

            context.close()

    except Exception as exc:
        logger.error("scrape_instagram_engagement failed for %s: %s", post_url, exc)
        raise

    logger.info(
        "instagram_engagement %s → likes=%s comments=%s shares=%s views=%s",
        post_url,
        result["like_count"],
        result["comment_count"],
        result["share_count"],
        result["view_count"],
    )
    return result
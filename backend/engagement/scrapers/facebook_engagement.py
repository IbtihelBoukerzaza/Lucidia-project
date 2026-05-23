"""
engagement/scrapers/facebook_engagement.py

Scrapes like / comment / share counts from a Facebook page or post URL
using a saved Playwright browser session (fb_session.json).

Returns:
    {
        "like_count":    int | None,
        "comment_count": int | None,
        "share_count":   int | None,
        "view_count":    None,          # not publicly available on Facebook
        "title":         str,
    }
"""

import re
import logging
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


def _parse_count(text: str) -> int | None:
    """
    Convert a Facebook engagement count string to an integer.
    Handles: "1.2K", "12K", "1.5M", "4,321", "42"
    """
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


def _extract_count_near_role(page, role: str) -> int | None:
    """
    Find the engagement count near a data-ad-rendering-role anchor.
    Walks up two parent levels looking for span[dir='auto'] with a digit.
    """
    try:
        locator = page.locator(f"[data-ad-rendering-role='{role}']").first
        if locator.count() == 0:
            return None

        parent = locator.locator("xpath=..").first
        for container in [parent, parent.locator("xpath=..").first]:
            for span in container.locator("span[dir='auto']").all():
                text = span.inner_text().strip()
                if re.search(r"\d", text):
                    count = _parse_count(text)
                    if count is not None:
                        return count

        return None

    except Exception as exc:
        logger.debug("_extract_count_near_role(%s) failed: %s", role, exc)
        return None


def _title_from_url(url: str) -> str:
    """
    Last-resort: derive a human-readable name from the Facebook URL slug.
    https://www.facebook.com/MobilisOfficielle/  →  "MobilisOfficielle"
    https://www.facebook.com/profile.php?id=123  →  "" (numeric, skip)
    """
    try:
        path = urlparse(url).path          # e.g. "/MobilisOfficielle/"
        slug = path.strip("/").split("/")[0]
        if slug and not slug.startswith("profile"):
            return slug
    except Exception:
        pass
    return ""


def _extract_title(page, url: str) -> str:
    """
    Extract the page/post title using multiple strategies in order:

    1. Any h2 inside the cover-photo / page-header area — Facebook renders
       the page name in an h2 in the hero section (not in the notification h1).
    2. The first span with role="heading" that is not "Notifications" or "Facebook".
    3. URL slug as a last resort.
    """
    JUNK = {"facebook", "notifications", ""}

    # Strategy 1: h2 elements — page name is almost always an h2 in the header
    try:
        for h2 in page.locator("h2").all():
            text = h2.inner_text().strip()
            if text.lower() not in JUNK and len(text) > 1:
                return text
    except Exception:
        pass

    # Strategy 2: span[role="heading"]
    try:
        for el in page.locator("span[role='heading']").all():
            text = el.inner_text().strip()
            if text.lower() not in JUNK and len(text) > 1:
                return text
    except Exception:
        pass

    # Strategy 3: URL slug
    return _title_from_url(url)


def scrape_facebook_engagement(post_url: str, session_path: str) -> dict:
    """
    Main entry point.

    Args:
        post_url:     Full URL of the Facebook page or post.
        session_path: Absolute path to fb_session.json (Playwright storage state).

    Returns:
        dict with like_count, comment_count, share_count, view_count, title.
        Any metric that cannot be extracted is returned as None.
    """
    from playwright.sync_api import sync_playwright

    result = {
        "like_count":    None,
        "comment_count": None,
        "share_count":   None,
        "view_count":    None,  # not publicly available on Facebook
        "title":         "",
    }

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                storage_state=session_path,
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
                viewport={"width": 1280, "height": 800},
                locale="ar-DZ",
            )
            page = context.new_page()

            # Block images / fonts / media — we only need DOM text
            page.route(
                "**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,mp4,webm}",
                lambda route: route.abort(),
            )

            from urllib.parse import urlparse, urlunparse
            parsed = urlparse(post_url)
            clean_url = urlunparse(parsed._replace(query=""))
            page.goto(clean_url, wait_until="domcontentloaded", timeout=30_000)
            # Wait for engagement bar to appear in the DOM
            try:
                page.wait_for_selector(
                    "[data-ad-rendering-role='like_button']",
                    state="attached",
                    timeout=20_000,
                )
            except Exception:
                logger.warning(
                    "facebook_engagement: like_button anchor not found on %s "
                    "— session may be expired or page structure changed.",
                    post_url,
                )

            result["title"]         = _title_from_url(clean_url)
            result["like_count"]    = _extract_count_near_role(page, "like_button")
            result["comment_count"] = _extract_count_near_role(page, "comment_button")
            result["share_count"]   = _extract_count_near_role(page, "share_button")

            context.close()
            browser.close()

    except Exception as exc:
        logger.error("scrape_facebook_engagement failed for %s: %s", post_url, exc)
        raise

    logger.info(
        "facebook_engagement %s → likes=%s comments=%s shares=%s title=%r",
        post_url,
        result["like_count"],
        result["comment_count"],
        result["share_count"],
        result["title"],
    )
    return result
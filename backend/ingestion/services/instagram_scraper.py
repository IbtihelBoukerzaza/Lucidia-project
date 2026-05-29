"""
ingestion/services/instagram_scraper.py

Comment extraction strategy:
- Instagram's current DOM has no article/ul/li structure
- All user-generated text lives in span[dir='auto'] elements
- We collect all spans, filter noise, then pair usernames with comment text
"""

import re
import time
import logging
from pathlib import Path
from typing import List, Dict, Optional
from urllib.parse import urlparse

try:
    from playwright.sync_api import sync_playwright, Page, TimeoutError as PWTimeout
except ImportError:
    sync_playwright = None
    Page = None
    PWTimeout = Exception

logger = logging.getLogger(__name__)

USER_DATA_DIR = "playwright_instagram_session"
INSTAGRAM_BASE = "https://www.instagram.com"
SCREENSHOT_DIR = Path("debug_screenshots")

# Nav items and UI chrome that always appear in span[dir='auto']
NOISE_EXACT = {
    "home", "reels", "messages", "search", "explore",
    "notifications", "create", "profile", "more",
    "also from meta", "meta", "threads", "about", "blog",
    "jobs", "help", "api", "privacy", "terms", "locations",
    "instagram lite", "meta ai", "meta verified", "english",
    "see translation", "reply", "like", "view replies",
    "contact uploading & non-users",
}

# Timestamp pattern: "12h", "3d", "5w", "just now"
TIMESTAMP_RE = re.compile(r"^\d+[smhdw]$|^just now$", re.IGNORECASE)

# Copyright footer
FOOTER_RE = re.compile(r"© \d{4}", re.IGNORECASE)

# Facebook crosspost notice
FACEBOOK_RE = re.compile(r"comments from facebook", re.IGNORECASE)

# Instagram username: letters, numbers, dots, underscores, max 30 chars, no spaces
USERNAME_RE = re.compile(r"^[a-zA-Z0-9._]{1,30}$")


def _screenshot(page: Page, name: str) -> None:
    SCREENSHOT_DIR.mkdir(exist_ok=True)
    path = SCREENSHOT_DIR / name
    page.screenshot(path=str(path), full_page=False)
    logger.info("Screenshot: %s", path.resolve())


def _extract_username_from_url(page_url: str) -> str:
    path = urlparse(page_url).path
    parts = [p for p in path.split("/") if p]
    return parts[0] if parts else ""


def _extract_shortcode(post_url: str) -> Optional[str]:
    match = re.search(r"/(p|reel)/([A-Za-z0-9_-]+)", post_url)
    return match.group(2) if match else None


def _is_noise(text: str) -> bool:
    """Return True if this span text should be discarded."""
    if not text or len(text) < 2:
        return True
    lower = text.lower()
    if lower in NOISE_EXACT:
        return True
    if TIMESTAMP_RE.match(text):
        return True
    if FOOTER_RE.search(text):
        return True
    if FACEBOOK_RE.search(text):
        return True
    # Skip caption block — contains newlines and account name at top
    if "\n" in text:
        return True
    return False


def _is_username(text: str) -> bool:
    """
    Heuristic: Instagram usernames are alphanumeric + dots + underscores,
    max 30 chars, no spaces.
    """
    return bool(USERNAME_RE.match(text)) and len(text) <= 30


def _parse_spans_into_comments(
    spans: List[str],
    account_username: str,
    comment_limit: int,
) -> List[Dict]:
    """
    Convert a flat list of span[dir='auto'] texts into author+comment pairs.

    Pattern observed in DOM:
        username  →  (noise: timestamp, duplicate username, UI labels)  →  comment text

    Strategy:
    - Walk spans in order
    - When we see a username-shaped string, treat it as the current author
    - The next non-noise, non-username string is their comment
    - Skip the account's own username (it's the caption author, not a commenter)
    """
    comments = []
    seen_texts = set()
    current_author = None
    i = 0

    while i < len(spans) and len(comments) < comment_limit:
        text = spans[i].strip()
        i += 1

        if _is_noise(text):
            continue

        # Skip the page owner's username — appears repeatedly as caption author
        if text.lower() == account_username.lower():
            continue

        if _is_username(text):
            # This is an author — next meaningful text is their comment
            current_author = text
            continue

        # If we reach here: non-noise, non-username text
        # It's a comment body (if we have an author) or skip (orphan text)
        if current_author is None:
            # No author established yet — skip orphan text
            continue

        if text in seen_texts:
            current_author = None
            continue

        seen_texts.add(text)
        comments.append({
            "author": current_author,
            "text": text,
        })
        # Reset — next username will start a new comment
        current_author = None
    # after the while loop, before return:
    logger.debug("Unparsed spans: %s", [s for s in spans if not _is_noise(s)])
    return comments


def _expand_comments(page: Page) -> None:
    """Click 'Load more comments' if available."""
    for _ in range(3):
        try:
            btn = page.locator(
                "button:has-text('Load more comments'),"
                "button:has-text('View more comments'),"
                "button:has-text('View all')"
            ).first
            if btn.is_visible(timeout=2000):
                btn.click()
                page.wait_for_timeout(1500)
            else:
                break
        except PWTimeout:
            break


def _get_post_links(page: Page, username: str, limit: int) -> List[str]:
    try:
        page.wait_for_selector(
            "a[href*='/p/'], a[href*='/reel/']",
            timeout=12000,
        )
    except PWTimeout:
        logger.warning("Timeout waiting for post links")
        return []

    hrefs = page.eval_on_selector_all(
        "a[href*='/p/'], a[href*='/reel/']",
        "els => [...new Set(els.map(e => e.getAttribute('href')))]",
    )

    post_links = []
    for href in hrefs:
        if not href:
            continue
        if not re.search(r"/(p|reel)/[A-Za-z0-9_-]+", href):
            continue
        if not href.startswith(f"/{username}/"):
            continue
        post_links.append(INSTAGRAM_BASE + href.rstrip("/"))

    logger.info("Found %d post links for @%s", len(post_links), username)
    return post_links[:limit]


def _extract_comments_from_post(
    page: Page,
    post_url: str,
    account_username: str,
    comment_limit: int,
) -> List[Dict]:
    logger.info("Opening: %s", post_url)
    page.goto(post_url, wait_until="domcontentloaded")
    page.wait_for_timeout(3000)

    # Wait for at least the comment input to confirm page loaded
    try:
        page.wait_for_selector(
            "[aria-label='Comment'], [placeholder='Add a comment…']",
            timeout=10000,
        )
    except PWTimeout:
        logger.warning("Comment input not found — page may not have loaded")
        _screenshot(page, f"failed_{_extract_shortcode(post_url)}.png")
        return []

    _expand_comments(page)

    # Scroll to load more comments
    for _ in range(4):
        page.mouse.wheel(0, 800)
        page.wait_for_timeout(600)

    page.wait_for_timeout(1500)

    # Collect all span[dir='auto'] texts
    raw_spans = page.eval_on_selector_all(
        "span[dir='auto']",
        "els => els.map(e => e.innerText.trim()).filter(t => t.length > 0)"
    )

    logger.info("Raw span[dir='auto'] count: %d", len(raw_spans))

    comments = _parse_spans_into_comments(raw_spans, account_username, comment_limit)
    logger.info("Parsed %d comments from %s", len(comments), post_url)

    for c in comments:
        logger.info("  @%s: %r", c["author"], c["text"][:60])

    return comments


def fetch_instagram_comments(
    page_url: str,
    post_limit: int = 5,
    comment_limit: int = 30,
) -> List[Dict]:

    account_username = _extract_username_from_url(page_url)
    logger.info("Target: @%s", account_username)

    results = []

    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            USER_DATA_DIR,
            headless=True,
            args=["--disable-blink-features=AutomationControlled"],
            viewport={"width": 1280, "height": 900},
            locale="en-US",
        )
        page = context.new_page()

        page.goto(page_url, wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(4000)

        post_links = _get_post_links(page, account_username, limit=post_limit)

        if not post_links:
            logger.error("No posts found for @%s", account_username)
            _screenshot(page, "no_posts.png")
            context.close()
            return []

        for post_url in post_links:
            shortcode = _extract_shortcode(post_url)
            if not shortcode:
                continue

            comments = _extract_comments_from_post(
                page, post_url, account_username, comment_limit
            )

            for idx, c in enumerate(comments):
                results.append({
                    "text": c["text"],
                    "source": "instagram",
                    "platform": "social",
                    "external_id": f"ig_{shortcode}_{idx}",
                    "url": post_url,
                    "author": c["author"],
                })

            time.sleep(2)

        context.close()

    logger.info("Total rows: %d", len(results))
    return results
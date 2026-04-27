"""
ingestion/services/x_scraper.py

Playwright-based X (Twitter) scraper.
Injects cookies from x_cookies.json on every run — more reliable than
persistent context on Windows where cookies don't always flush to disk.

Setup: export cookies from Cookie-Editor Chrome extension while logged into
x.com, save as x_cookies.json in the backend/ root folder.
"""

from __future__ import annotations

import json
import logging
import re
import time
import urllib.parse
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Path to cookies file — next to manage.py
COOKIES_FILE = Path("x_cookies.json")


def _load_cookies() -> list[dict]:
    """Load and convert Cookie-Editor JSON export to Playwright format."""
    if not COOKIES_FILE.exists():
        logger.error(
            "x_cookies.json not found. "
            "Export cookies from Cookie-Editor while logged into x.com "
            "and save as x_cookies.json next to manage.py"
        )
        return []

    try:
        raw = json.loads(COOKIES_FILE.read_text(encoding="utf-8"))
    except Exception as e:
        logger.error("Failed to read x_cookies.json: %s", e)
        return []

    cookies = []
    for c in raw:
        name = c.get("name", "")
        value = c.get("value", "")
        if not name or not value:
            continue

        domain = c.get("domain", "x.com")
        if not domain.startswith("."):
            domain = "." + domain

        raw_same_site = (c.get("sameSite") or "no_restriction").lower()
        if "strict" in raw_same_site:
            same_site = "Strict"
        elif "lax" in raw_same_site:
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

    logger.info("Loaded %d cookies from %s", len(cookies), COOKIES_FILE)
    return cookies


def _clean(text: str) -> str:
    return " ".join((text or "").split())


def _extract_tweet_id(href: str) -> str | None:
    match = re.search(r"/status/(\d+)", href)
    return match.group(1) if match else None


def _parse_tweet_node(node: Any) -> dict[str, Any] | None:
    try:
        text_el = node.query_selector("[data-testid='tweetText']")
        if not text_el:
            return None
        text = _clean(text_el.inner_text())
        if not text or len(text) < 3:
            return None

        tweet_id = None
        tweet_url = None
        for link in node.query_selector_all("a[href*='/status/']"):
            href = link.get_attribute("href") or ""
            tid = _extract_tweet_id(href)
            if tid:
                tweet_id = tid
                tweet_url = (
                    f"https://x.com{href}"
                    if href.startswith("/")
                    else href
                )
                break

        if not tweet_id:
            return None

        author = None
        user_el = node.query_selector("[data-testid='User-Name']")
        if user_el:
            for part in user_el.inner_text().split("\n"):
                part = part.strip()
                if part.startswith("@"):
                    author = part[1:]
                    break

        return {
            "text": text,
            "source": "twitter",
            "platform": "social",
            "external_id": f"twitter:{tweet_id}",
            "url": tweet_url or f"https://x.com/i/web/status/{tweet_id}",
            "author": author,
        }

    except Exception as e:
        logger.debug("Failed to parse tweet node: %s", e)
        return None


def _scrape_keyword(
    page: Any,
    keyword: str,
    limit: int,
) -> list[dict[str, Any]]:
    from playwright.sync_api import TimeoutError as PWTimeout

    encoded = urllib.parse.quote(keyword)
    url = f"https://x.com/search?q={encoded}&src=typed_query&f=live"
    logger.info("X: searching '%s'", keyword)

    try:
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
    except PWTimeout:
        logger.warning("X: page load timeout for '%s'", keyword)
        return []

    # Detect login wall
    if "login" in page.url or "flow" in page.url:
        logger.error(
            "X: redirected to login — cookies may have expired. "
            "Re-export cookies from Cookie-Editor and update x_cookies.json"
        )
        return []

    try:
        page.wait_for_selector("[data-testid='tweet']", timeout=10000)
    except PWTimeout:
        logger.warning("X: no tweets rendered for '%s'", keyword)
        return []

    # Scroll to load more tweets
    for _ in range(3):
        page.mouse.wheel(0, 1000)
        page.wait_for_timeout(1200)

    nodes = page.query_selector_all("[data-testid='tweet']")
    logger.info("X: found %d tweet nodes for '%s'", len(nodes), keyword)

    rows: list[dict[str, Any]] = []
    seen: set[str] = set()

    for node in nodes:
        if len(rows) >= limit:
            break
        row = _parse_tweet_node(node)
        if not row:
            continue
        if row["external_id"] in seen:
            continue
        seen.add(row["external_id"])
        rows.append(row)
        logger.info("  @%s: %r", row["author"], row["text"][:60])

    logger.info("X: extracted %d rows for '%s'", len(rows), keyword)
    return rows


def fetch_x_comments(
    keywords: list[str],
    max_per_keyword: int = 20,
) -> list[dict[str, Any]]:
    """
    Main entry point called by pipeline.py.
    Searches X for each keyword and returns normalized tweet rows.
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        logger.warning("Playwright not installed — X scraping skipped.")
        return []

    cookies = _load_cookies()
    if not cookies:
        return []

    all_rows: list[dict[str, Any]] = []

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

        # Inject cookies before any navigation
        context.add_cookies(cookies)

        page = context.new_page()

        # Block images/media to speed up
        page.route(
            "**/*.{png,jpg,jpeg,gif,svg,mp4,webm,woff,woff2}",
            lambda route: route.abort(),
        )

        for keyword in keywords:
            kw = keyword.strip()
            if not kw:
                continue
            rows = _scrape_keyword(page, kw, max_per_keyword)
            all_rows.extend(rows)
            time.sleep(2)

        context.close()
        browser.close()

    logger.info("X scraper total: %d rows", len(all_rows))
    return all_rows
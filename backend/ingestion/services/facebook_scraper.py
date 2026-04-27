"""
ingestion/services/facebook_scraper.py

Playwright-based Facebook comment scraper.
Extracts comments from the latest post on a Facebook page.
Uses headless browser — no login required for public pages.
"""

import logging
import time
from typing import List, Dict

from playwright.sync_api import sync_playwright

logger = logging.getLogger(__name__)


def clean(text: str) -> str:
    if not text:
        return ""
    return " ".join(text.split())


def is_valid(author: str, text: str) -> bool:
    if not text or len(text.strip()) < 3:
        return False
    junk = ["like", "reply", "see more", "voir plus"]
    if text.lower() in junk:
        return False
    return True


def fetch_last_post_comments(page_url: str) -> List[Dict]:
    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        logger.info("Opening Facebook page: %s", page_url)
        page.goto(page_url, timeout=60000)
        time.sleep(5)

        # --- Find latest post ---
        posts = page.query_selector_all("div[role='article']")
        if not posts:
            logger.warning("No posts found on %s", page_url)
            browser.close()
            return []

        latest_post = posts[0]
        logger.info("Found latest post")

        # --- Open post ---
        try:
            link = latest_post.query_selector("a[href*='/posts/']")
            if link:
                post_url = link.get_attribute("href")
                page.goto(post_url)
                time.sleep(5)
            else:
                post_url = page_url
        except Exception:
            post_url = page_url

        # --- Expand comments ---
        logger.info("Expanding comments...")
        for _ in range(5):
            buttons = page.query_selector_all("div[role='button']")
            for b in buttons:
                try:
                    txt = (b.inner_text() or "").lower()
                    if any(k in txt for k in ["more comments", "voir plus", "view more"]):
                        b.click()
                        time.sleep(1)
                except Exception:
                    continue

        # --- Scroll ---
        logger.info("Scrolling...")
        for _ in range(8):
            page.mouse.wheel(0, 3000)
            time.sleep(2)

        # --- Extract comments ---
        logger.info("Extracting comments...")
        comment_blocks = page.query_selector_all("div[role='article']")
        logger.info("Found %d comment blocks", len(comment_blocks))

        seen = set()
        comments = []

        for block in comment_blocks:
            try:
                full_text = clean(block.inner_text())

                # Skip post content / stickers / big blocks
                if len(full_text) > 500:
                    continue

                # Author
                author_el = block.query_selector("a span span")
                author = clean(author_el.inner_text()) if author_el else "Unknown"

                # Text
                text_el = block.query_selector("div[dir='auto']")
                if not text_el:
                    continue
                text = clean(text_el.inner_text())

                if len(text.strip()) < 3:
                    continue

                skip_keywords = ["see more", "voir plus", "comment", "répondre"]
                if any(k in text.lower() for k in skip_keywords):
                    continue

                if text in full_text and len(text) > 80:
                    continue

                if not is_valid(author, text):
                    continue

                if author.lower() == "mobilis":
                    continue

                if "reply" in text.lower():
                    continue

                key = (author, text)
                if key not in seen:
                    seen.add(key)
                    comments.append({"author": author, "text": text})

            except Exception:
                continue

        browser.close()

        logger.info(
            "Facebook scrape done: %d comments from %s",
            len(comments), post_url,
        )
        results.append({"post_url": post_url, "comments": comments})

    return results
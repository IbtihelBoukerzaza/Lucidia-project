import time
from typing import List, Dict
from playwright.sync_api import sync_playwright


# ------------------------
# Utils
# ------------------------

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


# ------------------------
# Main scraper
# ------------------------

def fetch_last_post_comments(page_url: str) -> List[Dict]:

    results = []

    with sync_playwright() as p:

        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        print("Opening page...")
        page.goto(page_url, timeout=60000)
        time.sleep(5)

        # ------------------------
        # STEP 1: get latest post
        # ------------------------
        posts = page.query_selector_all("div[role='article']")

        if not posts:
            print("❌ No posts found")
            browser.close()
            return []

        latest_post = posts[0]
        print("✅ Found latest post")

        # ------------------------
        # STEP 2: open post
        # ------------------------
        try:
            link = latest_post.query_selector("a[href*='/posts/']")
            if link:
                post_url = link.get_attribute("href")
                page.goto(post_url)
                time.sleep(5)
            else:
                post_url = page_url
        except:
            post_url = page_url

        # ------------------------
        # STEP 3: expand comments
        # ------------------------
        print("Expanding comments...")

        for _ in range(5):
            buttons = page.query_selector_all("div[role='button']")
            for b in buttons:
                try:
                    txt = (b.inner_text() or "").lower()
                    if any(k in txt for k in ["more comments", "voir plus", "view more"]):
                        b.click()
                        time.sleep(1)
                except:
                    continue

        # ------------------------
        # STEP 4: scroll
        # ------------------------
        print("Scrolling...")

        for _ in range(8):
            page.mouse.wheel(0, 3000)
            time.sleep(2)

        # ------------------------
        # STEP 5: extract comments (FIXED)
        # ------------------------
        print("Extracting comments...")

        comment_blocks = page.query_selector_all("div[role='article']")
        print(f"Found {len(comment_blocks)} blocks")

        seen = set()
        comments = []

        for block in comment_blocks:

            try:
                full_text = clean(block.inner_text())

                # ------------------------
                # FIX 1: skip post content / stickers / big blocks
                # ------------------------
                if len(full_text) > 500:
                    continue

                # ------------------------
                # AUTHOR
                # ------------------------
                author_el = block.query_selector("a span span")
                author = clean(author_el.inner_text()) if author_el else "Unknown"

                # ------------------------
                # TEXT
                # ------------------------
                text_el = block.query_selector("div[dir='auto']")

                if not text_el:
                    continue

                text = clean(text_el.inner_text())

                # ------------------------
                # FIX 2: remove empty / UI text
                # ------------------------
                if len(text.strip()) < 3:
                    continue

                skip_keywords = [
                    "see more",
                    "voir plus",
                    "comment",
                    "répondre"
                ]

                if any(k in text.lower() for k in skip_keywords):
                    continue

                # ------------------------
                # FIX 3: remove post duplication
                # ------------------------
                if text in full_text and len(text) > 80:
                    continue

                # ------------------------
                # YOUR ORIGINAL FILTERS
                # ------------------------
                if not is_valid(author, text):
                    continue

                if author.lower() == "mobilis":
                    continue

                if "reply" in text.lower():
                    continue

                # ------------------------
                # DEDUP
                # ------------------------
                key = (author, text)

                if key not in seen:
                    seen.add(key)
                    comments.append({
                        "author": author,
                        "text": text
                    })

            except:
                continue

        browser.close()

        results.append({
            "post_url": post_url,
            "comments": comments
        })

    return results
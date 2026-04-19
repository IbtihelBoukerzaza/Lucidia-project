import time
from typing import List, Dict
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SESSION_PATH = BASE_DIR / "fb_session.json"


# ----------------------------
# helpers
# ----------------------------

def clean(text: str) -> str:
    if not text:
        return ""
    return " ".join(text.split()).strip()


def is_valid_comment(text: str) -> bool:
    if not text:
        return False

    text = text.strip()

    # filter junk / UI artifacts
    if len(text) < 3:
        return False

    if text.lower() in ["like", "reply", "répondre", "j’aime"]:
        return False

    if "see more" in text.lower():
        return False

    return True


def is_reply_container(text: str) -> bool:
    # Facebook replies often contain very short or name-only blocks
    return len(text.strip().split()) <= 1


# ----------------------------
# main scraper
# ----------------------------

def fetch_last_5_posts_comments(page_url: str, max_posts: int = 5) -> List[Dict]:

    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # ✅ FIX SESSION PATH
        context = browser.new_context(storage_state=str(SESSION_PATH))
        page = context.new_page()

        print("Opening page...")
        page.goto(page_url, timeout=60000)
        time.sleep(5)

        print("Scrolling to load posts...")

        for _ in range(6):
            page.mouse.wheel(0, 3000)
            time.sleep(2)

        post_elements = page.query_selector_all("div[role='article']")
        print(f"Found {len(post_elements)} posts")

        # take last 5 posts (latest)
        post_elements = post_elements[:max_posts]

        for i, post in enumerate(post_elements):
            print(f"\n➡️ Processing post {i+1}")

            try:
                comments = []
                seen = set()

                # expand comments buttons safely
                try:
                    buttons = post.query_selector_all("div[role='button']")
                    for b in buttons:
                        try:
                            txt = (b.inner_text() or "").lower()
                            if "comment" in txt or "répondre" in txt:
                                b.click()
                                time.sleep(1)
                        except:
                            continue
                except:
                    pass

                print("Scrolling comments section...")
                for _ in range(3):
                    page.mouse.wheel(0, 2000)
                    time.sleep(1)

                print("Extracting comments...")

                # IMPORTANT: re-query fresh DOM (avoid stale handles)
                blocks = page.query_selector_all("div[dir='auto']")

                print(f"Found {len(blocks)} blocks")

                for b in blocks:
                    try:
                        text = clean(b.inner_text())

                        if not is_valid_comment(text):
                            continue

                        # ❌ ignore replies or single-word junk
                        if is_reply_container(text):
                            continue

                        # try author extraction (safe fallback)
                        parent = b.query_selector("xpath=ancestor::div[1]")
                        author_el = None

                        try:
                            author_el = parent.query_selector("a span span") if parent else None
                        except:
                            author_el = None

                        author = clean(author_el.inner_text()) if author_el else "Unknown"

                        # remove duplicate comments
                        key = (author, text)
                        if key in seen:
                            continue

                        seen.add(key)

                        comments.append({
                            "author": author,
                            "text": text
                        })

                    except:
                        continue

                results.append({
                    "post_url": page.url,
                    "comments": comments
                })

            except Exception as e:
                print(f"⚠️ Post error: {e}")

        browser.close()

    return results
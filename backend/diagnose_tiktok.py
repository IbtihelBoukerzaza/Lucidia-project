"""
diagnose_tiktok.py v2 — with cookie injection and comment panel opening.
Run: python diagnose_tiktok.py
"""
import os
import json
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

PROFILE_URL = "https://www.tiktok.com/@mobilis.dz"
COOKIES_FILE = Path("tiktok_cookies.json")
SCREENSHOT_DIR = Path("debug_screenshots")
SCREENSHOT_DIR.mkdir(exist_ok=True)


def load_cookies(path: Path) -> list:
    if not path.exists():
        print(f"❌ {path} not found — export from Cookie-Editor first")
        return []
    raw = json.loads(path.read_text(encoding="utf-8"))
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
    print(f"Loaded {len(cookies)} cookies")
    return cookies


with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=False,
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

    # Inject cookies
    cookies = load_cookies(COOKIES_FILE)
    if cookies:
        context.add_cookies(cookies)

    page = context.new_page()

    # --- Profile page ---
    print(f"\nOpening profile: {PROFILE_URL}")
    page.goto(PROFILE_URL, wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(3000)
    page.screenshot(path=str(SCREENSHOT_DIR / "tiktok_01_profile.png"))

    # Get video links
    video_links = page.eval_on_selector_all(
        "a[href*='/video/']",
        "els => [...new Set(els.map(e => e.href))].slice(0, 3)"
    )
    print(f"Video links: {len(video_links)}")
    for v in video_links:
        print(f"  {v}")

    if not video_links:
        print("❌ No videos found")
        input("Press Enter...")
        context.close()
        browser.close()
        exit()

    # --- Open first video ---
    first_video = video_links[0]
    print(f"\nOpening video: {first_video}")
    page.goto(first_video, wait_until="domcontentloaded", timeout=30000)
    page.wait_for_timeout(3000)
    page.screenshot(path=str(SCREENSHOT_DIR / "tiktok_02_before_comments.png"))

    # --- Try to open comment panel ---
    print("\nTrying to open comment panel...")
    for selector in [
        "[data-e2e='comment-icon']",
        "[data-e2e='comment-count']",
        "button[aria-label*='comment' i]",
        "span[data-e2e='comment-icon']",
    ]:
        try:
            el = page.locator(selector).first
            if el.is_visible(timeout=2000):
                print(f"  Clicking: {selector}")
                el.click()
                page.wait_for_timeout(3000)
                break
        except PWTimeout:
            continue

    page.screenshot(path=str(SCREENSHOT_DIR / "tiktok_03_after_click.png"))

    # --- Probe comment selectors after click ---
    print("\n--- Selectors after clicking comment icon ---")
    for sel in [
        "[data-e2e='comment-list']",
        "[data-e2e='comment-item']",
        "[data-e2e='comment-level-1']",
        "[data-e2e='comment-username-1']",
        "[data-e2e='comment-content-1']",
        "[data-e2e='comment-text']",
        "div[class*='CommentList']",
        "div[class*='CommentItem']",
        "div[class*='comment']",
        "ul",
        "li",
        "span[dir='auto']",
    ]:
        count = page.locator(sel).count()
        marker = " ◄◄◄" if count > 0 else ""
        print(f"  {sel:<45} → {count}{marker}")

    # Dump ALL data-e2e values now
    print("\n--- data-e2e values after comment click ---")
    e2e_vals = page.eval_on_selector_all(
        "[data-e2e]",
        "els => [...new Set(els.map(e => e.getAttribute('data-e2e')))]"
    )
    for v in sorted(e2e_vals):
        print(f"  data-e2e='{v}'")

    print("\nScreenshots saved in debug_screenshots/")
    input("Press Enter to close...")
    context.close()
    browser.close()
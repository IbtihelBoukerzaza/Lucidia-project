"""
x_login.py — correctly imports cookies into persistent Playwright session.
Run: python x_login.py
"""

import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

import json
from pathlib import Path
from playwright.sync_api import sync_playwright

SESSION_DIR = "playwright_x_session"
COOKIES_FILE = "x_cookies.json"

cookies_path = Path(COOKIES_FILE)
if not cookies_path.exists():
    print(f"ERROR: {COOKIES_FILE} not found.")
    exit(1)

raw = json.loads(cookies_path.read_text(encoding="utf-8"))

# Convert Cookie-Editor format to Playwright format
cookies = []
for c in raw:
    name = c.get("name", "")
    value = c.get("value", "")
    if not name or not value:
        continue

    # Fix domain — must start with dot for cross-subdomain cookies
    domain = c.get("domain", "x.com")
    if not domain.startswith("."):
        domain = "." + domain

        # Playwright only accepts: "Strict", "Lax", or "None"
    raw_same_site = (c.get("sameSite") or "no_restriction").lower()
    if "strict" in raw_same_site:
        same_site = "Strict"
    elif "lax" in raw_same_site:
        same_site = "Lax"
    else:
        same_site = "None"  # covers "no_restriction", "none", empty, unknown

    cookies.append({
        "name": name,
        "value": value,
        "domain": domain,
        "path": c.get("path", "/"),
        "secure": c.get("secure", True),
        "httpOnly": c.get("httpOnly", False),
        "sameSite": same_site,
    })
print(f"Loaded {len(cookies)} cookies from {COOKIES_FILE}")

with sync_playwright() as p:
    context = p.chromium.launch_persistent_context(
        SESSION_DIR,
        headless=False,
        viewport={"width": 1280, "height": 900},
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/123.0.0.0 Safari/537.36"
        ),
    )
    page = context.new_page()

    # Step 1: navigate to x.com first so domain is established
    print("Step 1: establishing x.com domain...")
    page.goto("https://x.com", wait_until="domcontentloaded")
    page.wait_for_timeout(2000)

    # Step 2: inject cookies into the live context
    print("Step 2: injecting cookies...")
    context.add_cookies(cookies)

    # Step 3: navigate to home to activate session
    print("Step 3: navigating to home...")
    page.goto("https://x.com/home", wait_until="domcontentloaded")
    page.wait_for_timeout(4000)

    print(f"Current URL: {page.url}")
    print(f"Page title: {page.title()}")

    if "home" in page.url:
        print("\n✅ Logged in successfully!")
        # Step 4: navigate around to force Playwright to write session to disk
        print("Step 4: saving session to disk...")
        page.goto("https://x.com/explore", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)
        page.goto("https://x.com/home", wait_until="domcontentloaded")
        page.wait_for_timeout(2000)
        print("✅ Session written to disk.")
    elif "login" in page.url:
        print("\n❌ Still on login page.")
        print("Your cookies may have expired. Log out and back in on real Chrome,")
        print("then re-export cookies with Cookie-Editor and run this again.")
    else:
        print(f"\n⚠️  Unexpected URL: {page.url}")

    Path("debug_screenshots").mkdir(exist_ok=True)
    page.screenshot(path="debug_screenshots/x_login_result.png")
    print("Screenshot saved: debug_screenshots/x_login_result.png")

    input("\nPress Enter to close and finalize session save...")
    context.close()

print(f"\nDone. Session saved to: {SESSION_DIR}/")
"""
Run from backend/ directory:
    python refresh_fb_session.py

Opens a real browser window — log in to Facebook manually,
then press Enter in the terminal to save the session.
"""
from playwright.sync_api import sync_playwright

SESSION_PATH = "fb_session.json"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    context = browser.new_context(
        viewport={"width": 1280, "height": 800},
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
    )
    page = context.new_page()
    page.goto("https://www.facebook.com/login", timeout=60_000)

    print("\n✅ Browser opened.")
    print("👉 Log in to Facebook in the browser window.")
    print("👉 Once fully logged in and on the home feed, come back here.")
    input("\nPress ENTER to save the session...\n")

    context.storage_state(path=SESSION_PATH)
    browser.close()

print(f"✅ Session saved to {SESSION_PATH}")
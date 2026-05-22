# backend/test_tiktok_engagement.py
import django, os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from engagement.scrapers.tiktok_engagement import scrape_tiktok_engagement

results = scrape_tiktok_engagement(
    profile_url="https://www.tiktok.com/@mobilis.dz",
    cookies_path="tiktok_cookies.json",
    video_limit=3,
)
for r in results:
    print(r)
"""
Run from backend/ directory:
    python test_youtube_engagement.py
"""
import django, os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.conf import settings
from engagement.scrapers.youtube_engagement import scrape_youtube_engagement

results = scrape_youtube_engagement(
    "https://www.youtube.com/@ATM-MOBILIS",
    settings.YOUTUBE_API_KEY,
    video_limit=3,
)

print(f"\nTotal videos returned: {len(results)}\n")
for r in results:
    print(r)
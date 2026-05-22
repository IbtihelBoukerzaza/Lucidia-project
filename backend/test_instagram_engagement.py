# backend/test_instagram_engagement.py
import django, os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from engagement.scrapers.instagram_engagement import scrape_instagram_engagement

urls = [
    "https://www.instagram.com/mobilis.dz/reel/DYE0M8Mmj00",
    "https://www.instagram.com/mobilis.dz/p/DYHLLqMDEV2",
]
for url in urls:
    print(scrape_instagram_engagement(url))
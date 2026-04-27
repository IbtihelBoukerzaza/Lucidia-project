"""
test_x.py — test X scraper
Run: python test_x.py
"""
import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

from ingestion.services.x_scraper import fetch_x_comments

rows = fetch_x_comments(
    keywords=["Mobilis", "Algérie Télécom"],
    max_per_keyword=10,
)

print(f"\n{'='*50}")
print(f"Results: {len(rows)} rows")
print(f"{'='*50}\n")

for r in rows:
    print(f"  [{r['external_id']}]")
    print(f"  author : {r['author']}")
    print(f"  text   : {r['text'][:80]}")
    print()
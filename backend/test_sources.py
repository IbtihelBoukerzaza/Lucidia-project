"""
test_rss_feeds.py — verify which Algerian RSS feeds are alive
Run: python test_rss_feeds.py
"""
import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

import requests
import feedparser

CANDIDATE_FEEDS = {
    "TSA Algérie":       "https://www.tsa-algerie.com/feed/",
    "Algérie 360":       "https://www.algerie360.com/feed/",
    "El Watan":          "https://www.elwatan.com/feed/",
    "Liberté":           "https://www.liberte-algerie.com/feed",
    "El Moudjahid":      "https://www.elmoudjahid.com/feed",
    "Echorouk Arabic":   "https://www.echoroukonline.com/feed",
    "Echorouk French":   "https://www.echoroukonline.com/feed/?lang=fr",
    "Ennahar":           "https://www.ennaharonline.com/feed/",
    "El Khabar":         "https://www.elkhabar.com/press/feed/",
    "Tout Sur l'Algérie":"https://www.tsa-algerie.com/feed/",
    "Maghreb Emergent":  "https://maghrebemergent.info/feed/",
    "Jeune Afrique DZ":  "https://www.jeuneafrique.com/tag/algerie/feed/",
    "APS":               "https://www.aps.dz/rss",
}

print(f"Testing {len(CANDIDATE_FEEDS)} feeds...\n")

working = []
for name, url in CANDIDATE_FEEDS.items():
    try:
        r = requests.get(url, timeout=10, headers={
            "User-Agent": "Mozilla/5.0 (compatible; SentivyaDZ/1.0)"
        })
        if r.status_code == 200:
            parsed = feedparser.parse(r.content)
            entry_count = len(parsed.entries)
            if entry_count > 0:
                sample = parsed.entries[0].get("title", "")[:60]
                print(f"  ✅ {name:<25} {entry_count} entries | {sample}")
                working.append(url)
            else:
                print(f"  ⚠️  {name:<25} 200 OK but 0 entries")
        else:
            print(f"  ❌ {name:<25} HTTP {r.status_code}")
    except Exception as e:
        print(f"  ❌ {name:<25} ERROR: {str(e)[:60]}")

print(f"\nWorking feeds: {len(working)}")
for url in working:
    print(f"  {url}")
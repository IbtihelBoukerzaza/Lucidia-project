import django, os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from engagement.scrapers.facebook_engagement import scrape_facebook_engagement

result = scrape_facebook_engagement(
    post_url="https://www.facebook.com/MobilisOfficielle/",   # use a real URL from your DB
    session_path="fb_session.json",
)
print(result)
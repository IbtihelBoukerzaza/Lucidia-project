from django.core.management.base import BaseCommand
from ingestion.services.facebook_scraper import fetch_last_post_comments
import json


class Command(BaseCommand):

    def handle(self, *args, **kwargs):
        url = "https://www.facebook.com/MobilisOfficielle/"

        data = fetch_last_post_comments(url)

        print(json.dumps(data, indent=2, ensure_ascii=False))

        self.stdout.write(self.style.SUCCESS("Scraper finished"))
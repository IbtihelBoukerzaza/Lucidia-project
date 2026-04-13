from django.core.management.base import BaseCommand
from ingestion.scheduler import start_scheduler


class Command(BaseCommand):
    help = "Run ingestion scheduler (every 30 minutes)"

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS("Starting ingestion scheduler..."))
        start_scheduler()
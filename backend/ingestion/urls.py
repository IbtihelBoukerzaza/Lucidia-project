from django.urls import path
from .views import TriggerIngestionView

urlpatterns = [
    path("<int:company_id>/ingest/", TriggerIngestionView.as_view(), name="trigger-ingestion"),
]
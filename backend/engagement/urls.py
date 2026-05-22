from django.urls import path
from .views import (
    EngagementListView,
    EngagementStatsView,
    EngagementTopView,
    EngagementScrapeView,
)

urlpatterns = [
    path("",        EngagementListView.as_view()),
    path("stats/",  EngagementStatsView.as_view()),
    path("top/",    EngagementTopView.as_view()),
    path("scrape/", EngagementScrapeView.as_view()),
]
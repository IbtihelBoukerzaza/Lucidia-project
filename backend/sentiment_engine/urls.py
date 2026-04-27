from django.urls import path
from .views import (
    SentimentDashboardView,
    SentimentTimelineView,
    SentimentPostsView,
    SentimentKeywordsView,
)

urlpatterns = [
    path("dashboard/", SentimentDashboardView.as_view(), name="sentiment-dashboard"),
    path("timeline/", SentimentTimelineView.as_view(), name="sentiment-timeline"),
    path("posts/", SentimentPostsView.as_view(), name="sentiment-posts"),
    path("keywords/", SentimentKeywordsView.as_view(), name="sentiment-keywords"),
]
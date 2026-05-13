from django.urls import path
from .views import (
    EngagementListView,
    EngagementStatsView,
    EngagementTopView,
)

urlpatterns = [
    path("", EngagementListView.as_view()),
    path("stats/", EngagementStatsView.as_view()),
    path("top/", EngagementTopView.as_view()),
]
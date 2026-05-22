from django.urls import path
from .views import GenerateInsightView, LatestInsightView, InsightHistoryView

urlpatterns = [
    path("generate/", GenerateInsightView.as_view()),
    path("latest/",   LatestInsightView.as_view()),
    path("history/",  InsightHistoryView.as_view()),
]
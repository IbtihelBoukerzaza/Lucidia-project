from django.urls import path
from .views import TopKeywordsView, KeywordTrendsView, KeywordsBySourceView, CoOccurrenceView

urlpatterns = [
    path("top/",           TopKeywordsView.as_view(),       name="topics-top"),
    path("trends/",        KeywordTrendsView.as_view(),     name="topics-trends"),
    path("by-source/",     KeywordsBySourceView.as_view(),  name="topics-by-source"),
    path("co-occurrence/", CoOccurrenceView.as_view(),      name="topics-co-occurrence"),
]
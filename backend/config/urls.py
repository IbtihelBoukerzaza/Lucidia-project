from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/accounts/", include("accounts.urls")),
    path("api/companies/", include("companies.urls")),
    path("api/posts/", include("posts.urls")),
    path("api/companies/", include("ingestion.urls")),
    path("api/sentiment/", include("sentiment_engine.urls")),
    path("api/alerts/",    include("alerts.urls")),
    path("api/topics/",    include("topics.urls")),
    path("api/surveys/", include("surveys.urls")),
    path("api/engagement/", include("engagement.urls")),
    path("api/feedback/", include("feedback.urls")),
    path("api/insights/", include("insights.urls")),
    path("api/chatbot/", include("chatbot.urls")),
]
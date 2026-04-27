from django.urls import path
from .views import (
    AlertRuleListCreateView,
    AlertRuleDetailView,
    AlertListView,
    AlertUnreadCountView,
    AlertMarkReadView,
    AlertMarkAllReadView,
)

urlpatterns = [
    # Rules
    path("rules/",             AlertRuleListCreateView.as_view()),
    path("rules/<int:pk>/",    AlertRuleDetailView.as_view()),

    # Notifications
    path("notifications/",                    AlertListView.as_view()),
    path("notifications/unread-count/",       AlertUnreadCountView.as_view()),
    path("notifications/read-all/",           AlertMarkAllReadView.as_view()),
    path("notifications/<int:pk>/read/",      AlertMarkReadView.as_view()),
]
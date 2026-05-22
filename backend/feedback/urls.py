from django.urls import path
from .views import FeedbackSubmitView, TestimonialsView, FeedbackStatsView

urlpatterns = [
    path("mine/",          FeedbackSubmitView.as_view(), name="feedback-mine"),
    path("testimonials/",  TestimonialsView.as_view(),   name="feedback-testimonials"),
    path("stats/",         FeedbackStatsView.as_view(),  name="feedback-stats"),
]
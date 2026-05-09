from django.urls import path
from .views import (
    SurveyListCreateView,
    SurveyDetailView,
    SurveyQuestionListCreateView,
    SurveyQuestionDetailView,
    SurveyResponseListView,
    SurveyAnalyticsView,
    PublicSurveyView,
)

urlpatterns = [
    # Survey CRUD
    path("",                                SurveyListCreateView.as_view()),
    path("<int:pk>/",                       SurveyDetailView.as_view()),

    # Questions
    path("<int:pk>/questions/",             SurveyQuestionListCreateView.as_view()),
    path("<int:pk>/questions/<int:question_pk>/", SurveyQuestionDetailView.as_view()),

    # Responses + Analytics (admin)
    path("<int:pk>/responses/",             SurveyResponseListView.as_view()),
    path("<int:pk>/analytics/",             SurveyAnalyticsView.as_view()),

    # Public (no auth)
    path("public/<str:token>/",             PublicSurveyView.as_view()),
]
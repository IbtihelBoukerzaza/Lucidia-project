from django.urls import path

from .views import CompanyDetailView, MyCompaniesListView

urlpatterns = [
    path("", MyCompaniesListView.as_view(), name="company-list-mine"),
    path("<int:pk>/", CompanyDetailView.as_view(), name="company-detail"),
]

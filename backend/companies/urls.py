from django.urls import path

from .views import (
    CompanyDetailView,
    CompanyMemberDetailView,
    CompanyMembersView,
    MyCompaniesListView,
    CompanyKeywordsView,
    CompanyKeywordDetailView,
    CompanySocialProfilesView,
    CompanySocialProfileDetailView,
)

urlpatterns = [
    path("", MyCompaniesListView.as_view(), name="company-list-mine"),
    path("<int:pk>/", CompanyDetailView.as_view(), name="company-detail"),
    path("<int:company_id>/members/", CompanyMembersView.as_view(), name="company-members"),
    path(
        "<int:company_id>/members/<int:membership_id>/",
        CompanyMemberDetailView.as_view(),
        name="company-member-detail",
    ),
    path("<int:company_id>/keywords/", CompanyKeywordsView.as_view(), name="company-keywords"),
    path(
        "<int:company_id>/keywords/<int:keyword_id>/",
        CompanyKeywordDetailView.as_view(),
        name="company-keyword-detail",
    ),
    path("<int:company_id>/social-profiles/", CompanySocialProfilesView.as_view(), name="company-social-profiles"),
    path(
        "<int:company_id>/social-profiles/<int:profile_id>/",
        CompanySocialProfileDetailView.as_view(),
        name="company-social-profile-detail",
    ),
]
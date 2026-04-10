from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView,
    health_check,
    create_access_request,
    verify_activation_token,
    set_password_with_token,
    me,
    logout_user,
)

urlpatterns = [
    path("health/", health_check, name="health-check"),
    path("request-access/", create_access_request, name="request-access"),
    path("activation/verify/", verify_activation_token, name="activation-verify"),
    path("activation/set-password/", set_password_with_token, name="activation-set-password"),
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", me, name="me"),
    path("logout/", logout_user, name="logout"),
]
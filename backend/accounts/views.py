from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    AccessRequestSerializer,
    EmailTokenObtainPairSerializer,
    ActivationTokenVerifySerializer,
    SetPasswordWithTokenSerializer,
)
from .models import AccessRequest
from companies.models import Company
from companies.serializers import CompanyWithRoleSerializer


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = EmailTokenObtainPairSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"message": "SentivyaDZ API is running."}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def create_access_request(request):
    serializer = AccessRequestSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(
            {
                "message": "Access request submitted successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(
        {
            "message": "Validation failed.",
            "errors": serializer.errors,
        },
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_activation_token(request):
    serializer = ActivationTokenVerifySerializer(data=request.data)

    if serializer.is_valid():
        activation_token = serializer.validated_data["activation_token"]
        return Response(
            {
                "message": "Activation token is valid.",
                "email": activation_token.user.email,
                "first_name": activation_token.user.first_name,
            },
            status=status.HTTP_200_OK,
        )

    return Response(
        {
            "message": "Validation failed.",
            "errors": serializer.errors,
        },
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def set_password_with_token(request):
    serializer = SetPasswordWithTokenSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(
            {"message": "Password set successfully. You can now log in."},
            status=status.HTTP_200_OK,
        )

    return Response(
        {
            "message": "Validation failed.",
            "errors": serializer.errors,
        },
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    companies_qs = (
        Company.objects.filter(memberships__user=request.user)
        .distinct()
        .order_by("name")
    )
    companies_data = CompanyWithRoleSerializer(
        companies_qs,
        many=True,
        context={"request": request},
    ).data

    return Response(
        {
            "user": {
                "id": request.user.id,
                "email": request.user.email,
                "username": request.user.username,
                "first_name": request.user.first_name,
            },
            "companies": companies_data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_user(request):
    refresh_token = request.data.get("refresh")

    if not refresh_token:
        return Response(
            {"message": "Refresh token is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response(
            {"message": "Logout successful."},
            status=status.HTTP_200_OK,
        )
    except Exception:
        return Response(
            {"message": "Invalid or expired refresh token."},
            status=status.HTTP_400_BAD_REQUEST,
        )
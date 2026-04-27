from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from .serializers import (
    AccessRequestSerializer,
    EmailTokenObtainPairSerializer,
    ActivationTokenVerifySerializer,
    SetPasswordWithTokenSerializer,
)
from .models import AccessRequest, ActivationToken
from companies.models import Company, Membership
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
def invite_member(request):
    from django.core.mail import send_mail

    email = request.data.get("email", "").lower().strip()
    first_name = request.data.get("first_name", "").strip()
    company_id = request.data.get("company_id")

    # Validate required fields
    if not email or not first_name or not company_id:
        return Response(
            {"message": "email, first_name, and company_id are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check caller is admin of this company
    membership = Membership.objects.filter(
        user=request.user,
        company_id=company_id,
        role=Membership.Role.ADMIN,
    ).first()
    if not membership:
        return Response(
            {"message": "You are not an admin of this company."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Check if user already exists and is already a member
    User = get_user_model()
    existing_user = User.objects.filter(email__iexact=email).first()
    if existing_user:
        already_member = Membership.objects.filter(
            user=existing_user,
            company_id=company_id,
        ).exists()
        if already_member:
            return Response(
                {"message": "This user is already a member of this company."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # Create user if not exists (inactive until password is set)
    if not existing_user:
        username = email
        user = User.objects.create(
            email=email,
            username=username,
            first_name=first_name,
            is_active=True,
        )
        user.set_unusable_password()
        user.save()
    else:
        user = existing_user

    # Create membership as analyst
    Membership.objects.get_or_create(
        user=user,
        company_id=company_id,
        defaults={"role": Membership.Role.ANALYST},
    )

    # Create activation token
    token_obj, raw_token = ActivationToken.create_token(
        user=user,
        access_request=None,
        expires_in_hours=72,
    )

    # Send invitation email
    company_name = membership.company.name
    activation_url = f"http://localhost:5173/set-password?token={raw_token}"

    try:
        send_mail(
            subject=f"دعوة للانضمام إلى {company_name} على SentivyaDZ",
            message=(
                f"مرحباً {first_name}،\n\n"
                f"تمت دعوتك للانضمام إلى شركة {company_name} كمحلل على منصة SentivyaDZ.\n\n"
                f"انقر على الرابط التالي لتفعيل حسابك وتعيين كلمة المرور:\n"
                f"{activation_url}\n\n"
                f"الرابط صالح لمدة 72 ساعة.\n\n"
                f"فريق SentivyaDZ"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as e:
        # Don't fail the whole request if email fails — log it
        print(f"[invite_member] Email failed: {e}")

    return Response(
        {"message": f"Invitation sent to {email}."},
        status=status.HTTP_201_CREATED,
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
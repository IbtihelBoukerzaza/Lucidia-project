from django.contrib import admin, messages
from django.contrib.auth import get_user_model

from django.conf import settings

from .email_service import send_activation_email
from .models import AccessRequest, ActivationToken

User = get_user_model()


@admin.action(description="Approve selected access requests")
def approve_requests(modeladmin, request, queryset):
    approved_count = 0
    existing_count = 0
    email_success_count = 0
    email_fail_count = 0

    for access_request in queryset:
        if access_request.is_reviewed and access_request.is_approved:
            continue

        existing_user = User.objects.filter(
            username=access_request.professional_email
        ).first()

        if existing_user:
            user = existing_user
            existing_count += 1
        else:
            user = User.objects.create_user(
                username=access_request.professional_email,
                email=access_request.professional_email,
                password=None,
                first_name=access_request.full_name,
                is_active=True,
            )

        access_request.is_reviewed = True
        access_request.is_approved = True
        access_request.approved_user = user.email
        access_request.save()

        token, raw_token = ActivationToken.create_token(
            user=user,
            access_request=access_request,
        )

        activation_url = f"{settings.FRONTEND_URL}/set-password?token={raw_token}"

        try:
            send_activation_email(
                recipient_email=user.email,
                recipient_name=user.first_name,
                activation_url=activation_url,
            )
            email_success_count += 1
        except Exception as exc:
            email_fail_count += 1
            modeladmin.message_user(
                request,
                f"Email send failed for {user.email}. Activation link: {activation_url}. Error: {exc}",
                level=messages.ERROR,
            )

        approved_count += 1

    if approved_count:
        modeladmin.message_user(
            request,
            f"{approved_count} request(s) approved successfully.",
            level=messages.SUCCESS,
        )

    if existing_count:
        modeladmin.message_user(
            request,
            f"{existing_count} approved request(s) already had an existing user.",
            level=messages.INFO,
        )

    if email_success_count:
        modeladmin.message_user(
            request,
            f"{email_success_count} activation email(s) sent successfully.",
            level=messages.SUCCESS,
        )

    if email_fail_count:
        modeladmin.message_user(
            request,
            f"{email_fail_count} activation email(s) failed to send.",
            level=messages.WARNING,
        )


@admin.action(description="Reject selected access requests")
def reject_requests(modeladmin, request, queryset):
    updated_count = queryset.update(
        is_reviewed=True,
        is_approved=False,
    )

    modeladmin.message_user(
        request,
        f"{updated_count} request(s) rejected successfully.",
        level=messages.WARNING,
    )


@admin.register(AccessRequest)
class AccessRequestAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "company_name",
        "full_name",
        "professional_email",
        "sector",
        "company_size",
        "is_reviewed",
        "is_approved",
        "approved_user",
        "created_at",
    )
    search_fields = ("company_name", "full_name", "professional_email")
    list_filter = (
        "sector",
        "company_size",
        "is_reviewed",
        "is_approved",
        "created_at",
    )
    actions = [approve_requests, reject_requests]


@admin.register(ActivationToken)
class ActivationTokenAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "access_request",
        "expires_at",
        "used_at",
        "created_at",
    )
    search_fields = ("user__email", "access_request__professional_email")
    list_filter = ("created_at", "expires_at", "used_at")
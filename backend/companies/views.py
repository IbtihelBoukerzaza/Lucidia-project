from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Company, Membership, CompanyKeyword, CompanySocialProfile
from .serializers import (
    CompanySerializer,
    CompanyWithRoleSerializer,
    CompanyMembershipSerializer,
    CompanyMembershipUpsertSerializer,
)

User = get_user_model()


def _get_membership_or_403(user, company_id: int) -> Membership:
    membership = Membership.objects.filter(user=user, company_id=company_id).first()
    if not membership:
        raise PermissionDenied("You are not a member of this company.")
    return membership


class MyCompaniesListView(generics.ListAPIView):
    """
    Companies the authenticated user belongs to, with their role in each.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = CompanyWithRoleSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def get_queryset(self):
        return (
            Company.objects.filter(memberships__user=self.request.user)
            .distinct()
            .order_by("name")
        )


class CompanyDetailView(generics.RetrieveAPIView):
    """Single company if the user is a member."""

    permission_classes = [IsAuthenticated]
    serializer_class = CompanyWithRoleSerializer
    lookup_field = "pk"

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def get_queryset(self):
        return Company.objects.filter(memberships__user=self.request.user).distinct()


class CompanyMembersView(APIView):
    """
    GET: list company members (admin + analyst can view).
    POST: add/update a member role (admin only).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, company_id: int):
        _get_membership_or_403(request.user, company_id)
        memberships = (
            Membership.objects.filter(company_id=company_id)
            .select_related("user")
            .order_by("created_at")
        )
        data = CompanyMembershipSerializer(memberships, many=True).data
        return Response({"members": data}, status=status.HTTP_200_OK)

    def post(self, request, company_id: int):
        actor_membership = _get_membership_or_403(request.user, company_id)
        if actor_membership.role != Membership.Role.ADMIN:
            raise PermissionDenied("Only company admins can manage members.")

        serializer = CompanyMembershipUpsertSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        role = serializer.validated_data["role"]

        user = User.objects.filter(email__iexact=email).first()
        membership, created = Membership.objects.get_or_create(
            user=user,
            company_id=company_id,
            defaults={"role": role},
        )
        if not created and membership.role != role:
            membership.role = role
            membership.save(update_fields=["role"])

        out = CompanyMembershipSerializer(membership).data
        return Response(
            {
                "message": (
                    "Member added successfully."
                    if created
                    else "Member role updated successfully."
                ),
                "member": out,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class CompanyMemberDetailView(APIView):
    """
    PATCH: update role (admin only).
    DELETE: remove member (admin only; cannot remove last admin).
    """

    permission_classes = [IsAuthenticated]

    def patch(self, request, company_id: int, membership_id: int):
        actor_membership = _get_membership_or_403(request.user, company_id)
        if actor_membership.role != Membership.Role.ADMIN:
            raise PermissionDenied("Only company admins can manage members.")

        target = Membership.objects.filter(
            id=membership_id,
            company_id=company_id,
        ).select_related("user").first()
        if not target:
            return Response(
                {"message": "Member not found for this company."},
                status=status.HTTP_404_NOT_FOUND,
            )

        role = request.data.get("role")
        if role not in dict(Membership.Role.choices):
            return Response(
                {"message": "Invalid role. Use 'admin' or 'analyst'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if target.role == Membership.Role.ADMIN and role != Membership.Role.ADMIN:
            admin_count = Membership.objects.filter(
                company_id=company_id,
                role=Membership.Role.ADMIN,
            ).count()
            if admin_count <= 1:
                return Response(
                    {"message": "Cannot demote the last admin of the company."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        target.role = role
        target.save(update_fields=["role"])
        return Response(
            {
                "message": "Member role updated successfully.",
                "member": CompanyMembershipSerializer(target).data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, company_id: int, membership_id: int):
        actor_membership = _get_membership_or_403(request.user, company_id)
        if actor_membership.role != Membership.Role.ADMIN:
            raise PermissionDenied("Only company admins can manage members.")

        target = Membership.objects.filter(
            id=membership_id,
            company_id=company_id,
        ).first()
        if not target:
            return Response(
                {"message": "Member not found for this company."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if target.role == Membership.Role.ADMIN:
            admin_count = Membership.objects.filter(
                company_id=company_id,
                role=Membership.Role.ADMIN,
            ).count()
            if admin_count <= 1:
                return Response(
                    {"message": "Cannot remove the last admin of the company."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        target.delete()
        return Response(
            {"message": "Member removed successfully."},
            status=status.HTTP_200_OK,
        )
class CompanyKeywordsView(APIView):
    """
    GET: list keywords (admin + analyst).
    POST: add keyword (admin only).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, company_id: int):
        _get_membership_or_403(request.user, company_id)
        keywords = CompanyKeyword.objects.filter(company_id=company_id)
        data = [{"id": k.id, "keyword": k.keyword} for k in keywords]
        return Response({"keywords": data}, status=status.HTTP_200_OK)

    def post(self, request, company_id: int):
        actor = _get_membership_or_403(request.user, company_id)
        if actor.role != Membership.Role.ADMIN:
            raise PermissionDenied("Only admins can manage keywords.")
        keyword = request.data.get("keyword", "").strip()
        if not keyword:
            return Response(
                {"message": "keyword is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        obj, created = CompanyKeyword.objects.get_or_create(
            company_id=company_id,
            keyword=keyword,
        )
        return Response(
            {
                "message": "Keyword added." if created else "Keyword already exists.",
                "keyword": {"id": obj.id, "keyword": obj.keyword},
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class CompanyKeywordDetailView(APIView):
    """DELETE: remove keyword (admin only)."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, company_id: int, keyword_id: int):
        actor = _get_membership_or_403(request.user, company_id)
        if actor.role != Membership.Role.ADMIN:
            raise PermissionDenied("Only admins can manage keywords.")
        keyword = CompanyKeyword.objects.filter(
            id=keyword_id, company_id=company_id
        ).first()
        if not keyword:
            return Response(
                {"message": "Keyword not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        keyword.delete()
        return Response(
            {"message": "Keyword removed."},
            status=status.HTTP_200_OK,
        )


class CompanySocialProfilesView(APIView):
    """
    GET: list social profiles (admin + analyst).
    POST: add social profile (admin only).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, company_id: int):
        _get_membership_or_403(request.user, company_id)
        profiles = CompanySocialProfile.objects.filter(company_id=company_id)
        data = [
            {
                "id": p.id,
                "platform": p.platform,
                "url": p.url,
                "is_active": p.is_active,
            }
            for p in profiles
        ]
        return Response({"social_profiles": data}, status=status.HTTP_200_OK)

    def post(self, request, company_id: int):
        actor = _get_membership_or_403(request.user, company_id)
        if actor.role != Membership.Role.ADMIN:
            raise PermissionDenied("Only admins can manage social profiles.")
        platform = request.data.get("platform", "").strip()
        url = request.data.get("url", "").strip()
        if not platform or not url:
            return Response(
                {"message": "platform and url are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        valid_platforms = [p.value for p in CompanySocialProfile.Platform]
        if platform not in valid_platforms:
            return Response(
                {"message": f"Invalid platform. Choose from: {valid_platforms}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        obj, created = CompanySocialProfile.objects.get_or_create(
            company_id=company_id,
            platform=platform,
            url=url,
            defaults={"is_active": True},
        )
        return Response(
            {
                "message": "Profile added." if created else "Profile already exists.",
                "social_profile": {
                    "id": obj.id,
                    "platform": obj.platform,
                    "url": obj.url,
                    "is_active": obj.is_active,
                },
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class CompanySocialProfileDetailView(APIView):
    """DELETE: remove social profile (admin only)."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, company_id: int, profile_id: int):
        actor = _get_membership_or_403(request.user, company_id)
        if actor.role != Membership.Role.ADMIN:
            raise PermissionDenied("Only admins can manage social profiles.")
        profile = CompanySocialProfile.objects.filter(
            id=profile_id, company_id=company_id
        ).first()
        if not profile:
            return Response(
                {"message": "Social profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        profile.delete()
        return Response(
            {"message": "Social profile removed."},
            status=status.HTTP_200_OK,
        )
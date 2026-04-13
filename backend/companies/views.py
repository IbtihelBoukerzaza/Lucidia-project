from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Company
from .serializers import CompanySerializer, CompanyWithRoleSerializer


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

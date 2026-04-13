from rest_framework import serializers

from .models import Company, Membership


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ("id", "name", "industry", "created_at")
        read_only_fields = ("id", "created_at")


class CompanyWithRoleSerializer(CompanySerializer):
    role = serializers.SerializerMethodField()

    class Meta(CompanySerializer.Meta):
        fields = ("id", "name", "industry", "created_at", "role")

    def get_role(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        m = (
            Membership.objects.filter(user=request.user, company=obj)
            .only("role")
            .first()
        )
        return m.role if m else None

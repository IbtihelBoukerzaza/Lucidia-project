from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Company, Membership

User = get_user_model()


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


class MembershipUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "first_name")
        read_only_fields = fields


class CompanyMembershipSerializer(serializers.ModelSerializer):
    user = MembershipUserSerializer(read_only=True)

    class Meta:
        model = Membership
        fields = ("id", "user", "role", "created_at")
        read_only_fields = fields


class CompanyMembershipUpsertSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=Membership.Role.choices)

    def validate_email(self, value):
        email = value.strip().lower()
        if not User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "No user found with this email. User must have an account first.",
            )
        return email

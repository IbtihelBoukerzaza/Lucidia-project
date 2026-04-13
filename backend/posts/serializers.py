import uuid

from django.db import IntegrityError
from rest_framework import serializers

from companies.models import Company
from .models import Post
from .services import user_can_access_company


class PostSerializer(serializers.ModelSerializer):
    company_id = serializers.IntegerField(source="company.id", read_only=True)

    class Meta:
        model = Post
        fields = (
            "id",
            "text",
            "source",
            "platform",
            "created_at",
            "company_id",
            "external_id",
            "url",
            "author",
        )
        read_only_fields = ("id", "created_at", "company_id")


class PostCreateSerializer(serializers.ModelSerializer):
    company = serializers.PrimaryKeyRelatedField(queryset=Company.objects.all())

    class Meta:
        model = Post
        fields = (
            "text",
            "source",
            "platform",
            "company",
            "external_id",
            "url",
            "author",
        )

    def validate_company(self, company):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required.")
        if not user_can_access_company(request.user, company.pk):
            raise serializers.ValidationError(
                "You do not have access to this company.",
            )
        return company

    def validate(self, attrs):
        ext = attrs.get("external_id")
        if ext is not None and str(ext).strip() == "":
            attrs["external_id"] = None
        external_id = attrs.get("external_id")
        if attrs.get("source") == Post.Source.MANUAL and not external_id:
            attrs["external_id"] = f"manual-{uuid.uuid4()}"
        return attrs

    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except IntegrityError as exc:
            raise serializers.ValidationError(
                {
                    "external_id": [
                        "A post with this external_id already exists for this company.",
                    ],
                },
            ) from exc

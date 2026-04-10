from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import AccessRequest, ActivationToken

User = get_user_model()


class AccessRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccessRequest
        fields = [
            "id",
            "full_name",
            "professional_email",
            "company_name",
            "sector",
            "company_size",
            "goal",
            "created_at",
        ]

    def validate_full_name(self, value):
        value = value.strip()
        if len(value) < 3:
            raise serializers.ValidationError("Full name must be at least 3 characters.")
        return value

    def validate_company_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Company name is too short.")
        return value

    def validate_goal(self, value):
        value = value.strip()
        if len(value) < 10:
            raise serializers.ValidationError("Goal must be at least 10 characters.")
        return value

    def validate_professional_email(self, value):
        return value.lower().strip()


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields.pop("username", None)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        if not email or not password:
            raise serializers.ValidationError({
                "message": "Email and password are required."
            })

        data = super().validate({
            "username": email,
            "password": password,
        })

        data["user"] = {
            "id": self.user.id,
            "email": self.user.email,
            "username": self.user.username,
            "first_name": self.user.first_name,
        }

        return data


class ActivationTokenVerifySerializer(serializers.Serializer):
    token = serializers.CharField()

    def validate(self, attrs):
        raw_token = attrs.get("token")
        token_hash = ActivationToken.hash_token(raw_token)

        try:
            activation_token = ActivationToken.objects.select_related("user").get(
                token_hash=token_hash
            )
        except ActivationToken.DoesNotExist:
            raise serializers.ValidationError({
                "token": ["Invalid activation token."]
            })

        if activation_token.is_used:
            raise serializers.ValidationError({
                "token": ["This activation token has already been used."]
            })

        if activation_token.is_expired:
            raise serializers.ValidationError({
                "token": ["This activation token has expired."]
            })

        attrs["activation_token"] = activation_token
        return attrs


class SetPasswordWithTokenSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        raw_token = attrs.get("token")
        password = attrs.get("password")
        confirm_password = attrs.get("confirm_password")

        if password != confirm_password:
            raise serializers.ValidationError({
                "confirm_password": ["Passwords do not match."]
            })

        token_hash = ActivationToken.hash_token(raw_token)

        try:
            activation_token = ActivationToken.objects.select_related("user").get(
                token_hash=token_hash
            )
        except ActivationToken.DoesNotExist:
            raise serializers.ValidationError({
                "token": ["Invalid activation token."]
            })

        if activation_token.is_used:
            raise serializers.ValidationError({
                "token": ["This activation token has already been used."]
            })

        if activation_token.is_expired:
            raise serializers.ValidationError({
                "token": ["This activation token has expired."]
            })

        validate_password(password, user=activation_token.user)

        attrs["activation_token"] = activation_token
        return attrs

    def save(self, **kwargs):
        activation_token = self.validated_data["activation_token"]
        password = self.validated_data["password"]

        user = activation_token.user
        user.set_password(password)
        user.save()

        activation_token.mark_as_used()
        return user
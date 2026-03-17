from rest_framework import serializers

from .models import User


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """For PATCH /users/me/ - first_name, last_name, email only."""

    class Meta:
        model = User
        fields = ("first_name", "last_name", "email")


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=8)


class UserSerializer(serializers.ModelSerializer):
    groups = serializers.SlugRelatedField(
        many=True, read_only=True, slug_field="name"
    )
    permissions = serializers.SerializerMethodField()
    avatar = serializers.ImageField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "avatar",
            "is_staff",
            "is_superuser",
            "mfa_enabled",
            "mfa_method",
            "groups",
            "permissions",
        )
        read_only_fields = ("username",)

    def get_permissions(self, obj):
        perms = obj.get_all_permissions()
        return list(perms)


class CreateUserSerializer(serializers.ModelSerializer):
    def create(self, validated_data):
        # call create_user on user object. Without this
        # the password will be stored in plain text.
        user = User.objects.create_user(**validated_data)
        return user

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "password",
            "first_name",
            "last_name",
            "email",
            "auth_token",
        )
        read_only_fields = ("auth_token",)
        extra_kwargs = {"password": {"write_only": True}}

from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers

User = get_user_model()


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get("request"),
            username=attrs["username"],
            password=attrs["password"],
        )
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        if not user.is_active:
            raise serializers.ValidationError("This account is disabled.")
        attrs["user"] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "pk",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_staff",
            "role",
            "must_change_password",
        )
        read_only_fields = fields


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("username", "first_name", "last_name")


class PasswordChangeSerializer(serializers.Serializer):
    # Not required when the user is replacing a temporary password
    old_password = serializers.CharField(
        write_only=True, required=False, style={"input_type": "password"}
    )
    new_password1 = serializers.CharField(write_only=True, style={"input_type": "password"})
    new_password2 = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.must_change_password and "old_password" not in attrs:
            raise serializers.ValidationError({"old_password": "This field is required."})
        if attrs["new_password1"] != attrs["new_password2"]:
            raise serializers.ValidationError({"new_password2": "Passwords do not match."})
        return attrs


_assignable_roles = [(User.Role.ADMIN, "Admin"), (User.Role.USER, "User")]


class UserManagementSerializer(serializers.ModelSerializer):
    """Used by admins and the owner to list, create and update other users."""

    role = serializers.ChoiceField(choices=_assignable_roles, default=User.Role.USER)

    class Meta:
        model = User
        fields = (
            "pk",
            "username",
            "first_name",
            "last_name",
            "role",
            "must_change_password",
            "last_login",
            "date_joined",
        )
        read_only_fields = ("pk", "must_change_password", "last_login", "date_joined")

    def to_representation(self, instance):
        # The owner role cannot be assigned through this serializer but must still be displayed
        data = super().to_representation(instance)
        data["role"] = instance.role
        return data


class UserManagementUpdateSerializer(UserManagementSerializer):
    class Meta(UserManagementSerializer.Meta):
        read_only_fields = UserManagementSerializer.Meta.read_only_fields + ("username",)


class UserCreatedSerializer(UserManagementSerializer):
    temp_password = serializers.CharField(read_only=True)

    class Meta(UserManagementSerializer.Meta):
        fields = UserManagementSerializer.Meta.fields + ("temp_password",)


class TempPasswordSerializer(serializers.Serializer):
    username = serializers.CharField(read_only=True)
    temp_password = serializers.CharField(read_only=True)

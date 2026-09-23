import logging
import secrets

from django.contrib.auth import get_user_model, login, logout, update_session_auth_hash
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from drf_spectacular.utils import extend_schema, extend_schema_view, inline_serializer
from rest_framework import mixins, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from sesy.models import ApiKey, Project

from .permissions import IsAdminOrOwner, IsOwner
from .serializers import (
    LoginSerializer,
    PasswordChangeSerializer,
    TempPasswordSerializer,
    UserCreatedSerializer,
    UserManagementSerializer,
    UserManagementUpdateSerializer,
    UserSerializer,
    UserUpdateSerializer,
)

logger = logging.getLogger(__name__)

User = get_user_model()

_detail_response = inline_serializer(
    name="DetailResponse",
    fields={"detail": serializers.CharField()},
)


class LoginView(APIView):
    permission_classes = (AllowAny,)

    @extend_schema(request=LoginSerializer, responses={200: UserSerializer})
    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        login(request, user)
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(request=None, responses={204: None})
    def post(self, request: Request) -> Response:
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(responses={200: UserSerializer, 403: _detail_response})
    def get(self, request: Request) -> Response:
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)

    @extend_schema(request=UserUpdateSerializer, responses={200: UserSerializer})
    def put(self, request: Request) -> Response:
        serializer = UserUpdateSerializer(request.user, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


class PasswordChangeView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(
        request=PasswordChangeSerializer,
        responses={200: _detail_response, 400: _detail_response},
    )
    def post(self, request: Request) -> Response:
        serializer = PasswordChangeSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        new_password = serializer.validated_data["new_password1"]
        try:
            validate_password(new_password, user=request.user)
        except ValidationError as e:
            return Response({"detail": e.messages}, status=status.HTTP_400_BAD_REQUEST)
        if request.user.must_change_password and request.user.check_password(new_password):
            return Response(
                {"detail": "The new password must be different from the temporary password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.set_password(new_password)
        request.user.must_change_password = False
        request.user.save()
        update_session_auth_hash(request, request.user)
        logger.info("Password changed for user %s", request.user.username)
        return Response({"detail": "Password changed successfully."}, status=status.HTTP_200_OK)


def _generate_temp_password() -> str:
    return secrets.token_urlsafe(12)


@extend_schema_view(
    list=extend_schema(tags=["Users"], description="List all users."),
    retrieve=extend_schema(tags=["Users"], description="Retrieve a user."),
    create=extend_schema(
        tags=["Users"],
        request=UserManagementSerializer,
        responses={201: UserCreatedSerializer},
        description="Create a user with a temporary password they must change on first login.",
    ),
    partial_update=extend_schema(
        tags=["Users"],
        request=UserManagementUpdateSerializer,
        responses={200: UserManagementSerializer},
        description="Update a user's name or role. The owner cannot be modified here.",
    ),
    destroy=extend_schema(
        tags=["Users"],
        description="Delete a user. Their projects and API keys are reassigned to the requesting user.",
    ),
)
class UserViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = (IsAdminOrOwner,)
    queryset = User.objects.order_by("date_joined", "pk")
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_serializer_class(self):
        if self.action in ("update", "partial_update"):
            return UserManagementUpdateSerializer
        return UserManagementSerializer

    def _check_can_manage(self, target) -> None:
        if target.is_owner:
            raise PermissionDenied("The owner cannot be modified. Transfer ownership first.")
        if target.pk == self.request.user.pk:
            raise PermissionDenied("You cannot perform this action on your own account.")

    def create(self, request: Request, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        temp_password = _generate_temp_password()
        user = User(**serializer.validated_data, must_change_password=True)
        user.set_password(temp_password)
        user.save()
        user.temp_password = temp_password
        logger.info("User %s created by %s", user.username, request.user.username)
        return Response(UserCreatedSerializer(user).data, status=status.HTTP_201_CREATED)

    def perform_update(self, serializer) -> None:
        self._check_can_manage(serializer.instance)
        serializer.save()

    @transaction.atomic
    def perform_destroy(self, instance) -> None:
        self._check_can_manage(instance)
        # Keep shared workspace data when its creator is removed
        Project.objects.filter(owner=instance).update(owner=self.request.user)
        ApiKey.objects.filter(user=instance).update(user=self.request.user)
        logger.info("User %s deleted by %s", instance.username, self.request.user.username)
        instance.delete()

    @extend_schema(
        tags=["Users"],
        request=None,
        responses={200: TempPasswordSerializer},
        description="Generate a new temporary password. The user must change it on next login.",
    )
    @action(detail=True, methods=["post"], url_path="reset-password")
    def reset_password(self, request: Request, pk=None) -> Response:
        user = self.get_object()
        self._check_can_manage(user)
        temp_password = _generate_temp_password()
        user.set_password(temp_password)
        user.must_change_password = True
        user.save()
        logger.info("Password reset for user %s by %s", user.username, request.user.username)
        return Response(
            {"username": user.username, "temp_password": temp_password},
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        tags=["Users"],
        request=None,
        responses={200: UserManagementSerializer},
        description="Make this user the owner. The current owner is downgraded to admin.",
    )
    @action(
        detail=True,
        methods=["post"],
        url_path="transfer-ownership",
        permission_classes=(IsOwner,),
    )
    def transfer_ownership(self, request: Request, pk=None) -> Response:
        user = self.get_object()
        if user.pk == request.user.pk:
            raise PermissionDenied("You are already the owner.")
        if not user.is_active:
            raise PermissionDenied("Ownership cannot be transferred to an inactive user.")
        with transaction.atomic():
            # Demote first so the single-owner constraint is never violated
            User.objects.filter(pk=request.user.pk).update(role=User.Role.ADMIN)
            User.objects.filter(pk=user.pk).update(role=User.Role.OWNER)
        logger.info("Ownership transferred from %s to %s", request.user.username, user.username)
        user.refresh_from_db()
        return Response(UserManagementSerializer(user).data, status=status.HTTP_200_OK)

from rest_framework.permissions import BasePermission


class IsAdminOrOwner(BasePermission):
    message = "Only admins and the owner can perform this action."

    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.is_admin_or_owner)


class IsOwner(BasePermission):
    message = "Only the owner can perform this action."

    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.is_owner)

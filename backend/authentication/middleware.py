from django.http import JsonResponse

# URL names that remain reachable while a user still has to replace their temporary password
PASSWORD_CHANGE_ALLOWED_URL_NAMES = {
    "auth-login",
    "auth-logout",
    "auth-me",
    "auth-password-change",
}


class MustChangePasswordMiddleware:
    """Block API access for users that must change their password until they do so."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_view(self, request, view_func, view_args, view_kwargs):
        user = getattr(request, "user", None)
        if not (user and user.is_authenticated and user.must_change_password):
            return None
        if request.resolver_match.url_name in PASSWORD_CHANGE_ALLOWED_URL_NAMES:
            return None
        return JsonResponse(
            {"detail": "You must change your password before continuing.", "code": "password_change_required"},
            status=403,
        )

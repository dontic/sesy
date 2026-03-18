from django.urls import path

from . import views

urlpatterns = [
    path("login/", views.LoginView.as_view(), name="auth-login"),
    path("logout/", views.LogoutView.as_view(), name="auth-logout"),
    path("session/", views.SessionView.as_view(), name="auth-session"),
    path("password-change/", views.PasswordChangeView.as_view(), name="auth-password-change"),
]

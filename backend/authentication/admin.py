from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = UserAdmin.list_display + ("role", "must_change_password")
    list_filter = UserAdmin.list_filter + ("role",)
    fieldsets = UserAdmin.fieldsets + (("Sesy", {"fields": ("role", "must_change_password")}),)

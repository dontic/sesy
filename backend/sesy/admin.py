from django.contrib import admin
from .models import Project, Tag, AudienceMember


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["name", "owner", "created_at"]
    list_filter = ["owner"]
    search_fields = ["name", "owner__username"]


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ["name", "project"]
    list_filter = ["project"]
    search_fields = ["name"]


@admin.register(AudienceMember)
class AudienceMemberAdmin(admin.ModelAdmin):
    list_display = ["email", "first_name", "last_name", "project"]
    list_filter = ["project", "tags"]
    search_fields = ["email", "first_name", "last_name"]
    filter_horizontal = ["tags"]

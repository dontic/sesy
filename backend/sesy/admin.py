from django.contrib import admin
from solo.admin import SingletonModelAdmin
from .models import Project, Tag, AudienceMember, SESConfiguration, EmailTemplate, Campaign, VerifiedDomain


@admin.register(SESConfiguration)
class SESConfigurationAdmin(SingletonModelAdmin):
    pass


@admin.register(VerifiedDomain)
class VerifiedDomainAdmin(admin.ModelAdmin):
    list_display = ["domain", "project", "status", "last_checked_at", "created_at"]
    list_filter = ["status"]
    search_fields = ["domain"]
    readonly_fields = ["verification_token", "dkim_tokens", "last_checked_at"]


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


@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ["name", "project", "subject", "created_at"]
    list_filter = ["project"]
    search_fields = ["name", "subject"]


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ["name", "project", "template", "from_email", "status", "send_to_all", "sent_at"]
    list_filter = ["project", "status"]
    search_fields = ["name", "from_email"]
    filter_horizontal = ["tags"]



from django.urls import path
from rest_framework_nested import routers
from .views import (
    ProjectViewSet,
    TagViewSet,
    AudienceMemberViewSet,
    SESConfigurationView,
    SESConfigurationCheckProductionStatusView,
    EmailTemplateViewSet,
    CampaignViewSet,
    ProjectDomainView,
    ProjectDomainCheckView,
    UnsubscribeView,
)

router = routers.DefaultRouter()
router.register(r"projects", ProjectViewSet, basename="project")

projects_router = routers.NestedDefaultRouter(router, r"projects", lookup="project")
projects_router.register(r"tags", TagViewSet, basename="project-tag")
projects_router.register(r"members", AudienceMemberViewSet, basename="project-member")
projects_router.register(r"templates", EmailTemplateViewSet, basename="project-template")
projects_router.register(r"campaigns", CampaignViewSet, basename="project-campaign")

urlpatterns = (
    router.urls
    + projects_router.urls
    + [
        path(
            "ses-configuration/",
            SESConfigurationView.as_view(),
            name="ses-configuration",
        ),
        path(
            "ses-configuration/check-production-status/",
            SESConfigurationCheckProductionStatusView.as_view(),
            name="ses-configuration-check-production-status",
        ),
        path(
            "projects/<int:project_pk>/domain/",
            ProjectDomainView.as_view(),
            name="project-domain",
        ),
        path(
            "projects/<int:project_pk>/domain/check/",
            ProjectDomainCheckView.as_view(),
            name="project-domain-check",
        ),
        path(
            "projects/<int:project_pk>/unsubscribe/",
            UnsubscribeView.as_view(),
            name="project-unsubscribe",
        ),
    ]
)

from django.urls import path
from rest_framework_nested import routers
from .views import (
    ApiKeyViewSet,
    ProjectViewSet,
    TagViewSet,
    AudienceMemberViewSet,
    SESConfigurationView,
    CampaignViewSet,
    ProjectDomainView,
    PublicAudienceMemberView,
    UnsubscribeView,
    OnboardingView,
    CsvImportTaskStatusView,
)

router = routers.DefaultRouter()
router.register(r"api-keys", ApiKeyViewSet, basename="api-key")
router.register(r"projects", ProjectViewSet, basename="project")

projects_router = routers.NestedDefaultRouter(router, r"projects", lookup="project")
projects_router.register(r"tags", TagViewSet, basename="project-tag")
projects_router.register(r"members", AudienceMemberViewSet, basename="project-member")
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
            "projects/<int:project_pk>/domain/",
            ProjectDomainView.as_view(),
            name="project-domain",
        ),
        path(
            "projects/<int:project_pk>/unsubscribe/",
            UnsubscribeView.as_view(),
            name="project-unsubscribe",
        ),
        path(
            "public/members/",
            PublicAudienceMemberView.as_view(),
            name="public-members",
        ),
        path(
            "onboarding/",
            OnboardingView.as_view(),
            name="onboarding",
        ),
        path(
            "tasks/<str:task_id>/",
            CsvImportTaskStatusView.as_view(),
            name="csv-import-task-status",
        ),
    ]
)

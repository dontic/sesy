from rest_framework_nested import routers
from .views import ProjectViewSet, TagViewSet, AudienceMemberViewSet

router = routers.DefaultRouter()
router.register(r"projects", ProjectViewSet, basename="project")

projects_router = routers.NestedDefaultRouter(router, r"projects", lookup="project")
projects_router.register(r"tags", TagViewSet, basename="project-tag")
projects_router.register(r"members", AudienceMemberViewSet, basename="project-member")

urlpatterns = router.urls + projects_router.urls

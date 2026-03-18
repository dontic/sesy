from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from drf_spectacular.utils import extend_schema, extend_schema_view
from .models import Project, Tag, AudienceMember
from .serializers import ProjectSerializer, TagSerializer, AudienceMemberSerializer


@extend_schema_view(
    list=extend_schema(tags=["Projects"]),
    create=extend_schema(tags=["Projects"]),
    retrieve=extend_schema(tags=["Projects"]),
    update=extend_schema(tags=["Projects"]),
    partial_update=extend_schema(tags=["Projects"]),
    destroy=extend_schema(tags=["Projects"]),
)
class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(owner=self.request.user)


@extend_schema_view(
    list=extend_schema(tags=["Tags"]),
    create=extend_schema(tags=["Tags"]),
    retrieve=extend_schema(tags=["Tags"]),
    update=extend_schema(tags=["Tags"]),
    partial_update=extend_schema(tags=["Tags"]),
    destroy=extend_schema(tags=["Tags"]),
)
class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _get_project(self):
        project = Project.objects.filter(
            pk=self.kwargs["project_pk"],
            owner=self.request.user,
        ).first()
        if not project:
            raise PermissionDenied()
        return project

    def get_queryset(self):
        return Tag.objects.filter(project=self._get_project())

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["project"] = self._get_project()
        return context


@extend_schema_view(
    list=extend_schema(tags=["Audience Members"]),
    create=extend_schema(tags=["Audience Members"]),
    retrieve=extend_schema(tags=["Audience Members"]),
    update=extend_schema(tags=["Audience Members"]),
    partial_update=extend_schema(tags=["Audience Members"]),
    destroy=extend_schema(tags=["Audience Members"]),
)
class AudienceMemberViewSet(viewsets.ModelViewSet):
    serializer_class = AudienceMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _get_project(self):
        project = Project.objects.filter(
            pk=self.kwargs["project_pk"],
            owner=self.request.user,
        ).first()
        if not project:
            raise PermissionDenied()
        return project

    def get_queryset(self):
        return AudienceMember.objects.filter(project=self._get_project()).prefetch_related("tags")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["project"] = self._get_project()
        return context

import django_filters
from drf_spectacular.contrib.django_filters import DjangoFilterExtension  # noqa: F401 — registers the filter inspector
from rest_framework.filters import SearchFilter

from .models import AudienceMember


class UnaccentSearchFilter(SearchFilter):
    def construct_search(self, field_name, source_queryset):
        return f"{field_name}__unaccent__icontains"


class AudienceMemberFilter(django_filters.FilterSet):
    tag = django_filters.CharFilter(field_name="tags__name", lookup_expr="exact")
    subscribed = django_filters.BooleanFilter(field_name="subscribed")

    class Meta:
        model = AudienceMember
        fields = ["tag", "subscribed"]

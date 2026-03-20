import django_filters
from django.db.models import Q, Value
from django.db.models.functions import Concat
from drf_spectacular.contrib.django_filters import DjangoFilterExtension  # noqa: F401 — registers the filter inspector

from .models import AudienceMember


class AudienceMemberFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method="filter_search")
    tag = django_filters.CharFilter(field_name="tags__name", lookup_expr="exact")
    subscribed = django_filters.BooleanFilter(field_name="subscribed")

    class Meta:
        model = AudienceMember
        fields = ["search", "tag", "subscribed"]

    def filter_search(self, queryset, name, value):
        return queryset.annotate(
            full_name=Concat("first_name", Value(" "), "last_name")
        ).filter(Q(email__icontains=value) | Q(full_name__icontains=value))

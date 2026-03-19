"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.conf import settings
from django.conf.urls.static import static
from health_check.views import HealthCheckView
from redis.asyncio import Redis as RedisClient


urlpatterns = [
    path("auth/", include("authentication.urls")),
    path("sesy/", include("sesy.urls")),
    path(
        "ht/",
        HealthCheckView.as_view(
            checks=[
                "health_check.Cache",
                "health_check.Database",
                "health_check.Storage",
                # 3rd party checks
                (
                    "health_check.contrib.redis.Redis",
                    {"client_factory": lambda: RedisClient.from_url(settings.REDIS_URL)},
                ),
                "health_check.contrib.celery.Ping",
            ]
        ),
    ),
    path("ht/startup-probe/", HealthCheckView.as_view(checks=["health_check.Database"])),
    path("ht/liveness-probe/", HealthCheckView.as_view(checks=["health_check.Database"])),
    path(
        "ht/celery-probe/",
        HealthCheckView.as_view(checks=["health_check.contrib.celery.Ping"]),
    ),
    path(
        "ht/redis/",
        HealthCheckView.as_view(
            checks=[
                (
                    "health_check.contrib.redis.Redis",
                    {"client_factory": lambda: RedisClient.from_url(settings.REDIS_URL)},
                ),
            ]
        ),
    ),
    path("admin/", admin.site.urls),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Show the drf-spectacular UI in debug mode
if settings.DEBUG:
    urlpatterns += [
        path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
        path(
            "api/schema/swagger-ui/",
            SpectacularSwaggerView.as_view(url_name="schema"),
            name="swagger-ui",
        ),
    ]

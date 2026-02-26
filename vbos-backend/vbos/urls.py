from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.authtoken import views

admin.site.site_header = "VBoS MIS"
API_BASE_URL = "api/v1"

api_urls = [
    path(
        f"{API_BASE_URL}/",
        include(("vbos.users.urls", "vbos.users"), namespace="users"),
    ),
    path(
        f"{API_BASE_URL}/",
        include(("vbos.datasets.urls", "vbos.datasets"), namespace="datasets"),
    ),
]

urlpatterns = [
    path("admin", RedirectView.as_view(url="/admin/", permanent=True)),
    path("admin/", admin.site.urls),
    path("", include(api_urls)),
    path("api-token-auth/", views.obtain_auth_token),
    path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),
    # API-Docs
    path(f"{API_BASE_URL}/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        f"{API_BASE_URL}/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

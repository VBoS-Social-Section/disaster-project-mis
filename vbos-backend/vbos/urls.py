from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import HttpResponseRedirect
from django.urls import include, path, re_path
from django.views.generic import RedirectView

from vbos.datasets.admin_views import icon_picker
from vbos.datasets.tile_serve import serve_tile
from vbos.land_accounts.admin_views import (
    add_land_accounts,
    delete_land_accounts,
    download_land_accounts_template,
    edit_land_accounts,
    import_land_accounts,
    list_land_accounts,
)
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.response import Response

from vbos.users.models import TokenActivity

admin.site.site_header = "VBoS MIS"
API_BASE_URL = "api/v1"


class TokenLoginView(ObtainAuthToken):
    """Dashboard sign-in: exchange username + password for an API token.

    Session authentication is switched off here. Otherwise a browser that is also signed
    in to /admin/ sends its session cookie and DRF demands a CSRF token, so the dashboard
    login fails with "CSRF Failed: CSRF token missing".
    """

    authentication_classes = []

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        # Issue a fresh token on every sign-in so the 8h limit counts from login
        # and any previously issued token stops working.
        Token.objects.filter(user=user).delete()
        token = Token.objects.create(user=user)
        TokenActivity.objects.create(token=token, last_used=token.created)
        return Response({"token": token.key})


def admin_append_slash_redirect(request, path):
    """Redirect admin paths without trailing slash to version with slash."""
    return HttpResponseRedirect(f"/admin/{path}/", permanent=True)


api_urls = [
    path(
        f"{API_BASE_URL}/",
        include(("vbos.users.urls", "vbos.users"), namespace="users"),
    ),
    path(
        f"{API_BASE_URL}/",
        include(("vbos.datasets.urls", "vbos.datasets"), namespace="datasets"),
    ),
    path(
        f"{API_BASE_URL}/",
        include(("vbos.land_accounts.urls", "vbos.land_accounts"), namespace="land_accounts"),
    ),
]

urlpatterns = [
    path("admin", RedirectView.as_view(url="/admin/", permanent=True)),
    # Redirect admin paths without trailing slash (APPEND_SLASH=False)
    re_path(
        r"^admin/(?P<path>.*[^/])$",
        admin_append_slash_redirect,
    ),
    path("admin/datasets/icon-picker/", admin.site.admin_view(icon_picker), name="admin_icon_picker"),
    path("admin/land-accounts/", admin.site.admin_view(list_land_accounts), name="admin_land_accounts_list"),
    path("admin/land-accounts/add/", admin.site.admin_view(add_land_accounts), name="admin_land_accounts_add"),
    path("admin/land-accounts/import/", admin.site.admin_view(import_land_accounts), name="admin_land_accounts_import"),
    path("admin/land-accounts/template/", admin.site.admin_view(download_land_accounts_template), name="admin_land_accounts_template"),
    path("admin/land-accounts/<int:object_id>/edit/", admin.site.admin_view(edit_land_accounts), name="admin_land_accounts_edit"),
    path("admin/land-accounts/<int:object_id>/delete/", admin.site.admin_view(delete_land_accounts), name="admin_land_accounts_delete"),
    path("admin/", admin.site.urls),
    path("", include(api_urls)),
    path("api-token-auth/", TokenLoginView.as_view()),
    path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),
    # API-Docs
    path(f"{API_BASE_URL}/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        f"{API_BASE_URL}/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    # Precomputed tiles: serve from media, transparent PNG for tiles outside extent
    path(
        "media/tiles/landcover/<str:year>/<str:z>/<str:x>/<str:y>.png",
        serve_tile,
        name="serve_tile",
    ),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

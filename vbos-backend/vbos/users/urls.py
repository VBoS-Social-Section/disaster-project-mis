from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import appearance, auth_views, views

app_name = "users"

router = DefaultRouter()
router.register(r"users", views.UserViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("auth/logout/", auth_views.logout, name="logout"),
    path("appearance/", appearance.appearance, name="appearance"),
    path("appearance/me/", appearance.appearance_me, name="appearance-me"),
    path("appearance/org/", appearance.appearance_org, name="appearance-org"),
]

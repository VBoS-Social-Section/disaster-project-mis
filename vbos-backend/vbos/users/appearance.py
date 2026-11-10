"""Appearance settings API: each user's own choices, on top of an organisation default.

GET  /api/v1/appearance/      -> {"org": {...}, "user": {...}, "can_set_org": bool}
PUT  /api/v1/appearance/me/   -> replace the signed-in user's choices ({} = follow the default)
PUT  /api/v1/appearance/org/  -> replace the organisation default (staff only)
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import OrgAppearance

ALLOWED = {
    "preset": {"drmis-blue", "ocean", "violet", "emerald", "teal", "amber", "rose", "graphite"},
    "mode": {"light", "dark", "system"},
    "corners": {"sharp", "default", "rounded"},
    "fontSize": {"small", "default", "large", "xlarge"},
}


def clean(data):
    """Keep only known settings with known values; anything else is dropped."""
    if not isinstance(data, dict):
        return {}
    return {k: v for k, v in data.items() if k in ALLOWED and v in ALLOWED[k]}


def payload(user):
    return {
        "org": clean(OrgAppearance.get_solo().data),
        "user": clean(user.appearance),
        "can_set_org": bool(user.is_staff),
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def appearance(request):
    return Response(payload(request.user))


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def appearance_me(request):
    request.user.appearance = clean(request.data)
    request.user.save(update_fields=["appearance"])
    return Response(payload(request.user))


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def appearance_org(request):
    if not request.user.is_staff:
        return Response({"detail": "Only staff can set the organisation default."},
                        status=status.HTTP_403_FORBIDDEN)
    org = OrgAppearance.get_solo()
    org.data = clean(request.data)
    org.save()
    return Response(payload(request.user))

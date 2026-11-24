from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import TokenActivity

# Don't write last_used on every request; once a minute is plenty for a 30 min limit.
ACTIVITY_WRITE_INTERVAL = timedelta(seconds=60)


class ExpiringTokenAuthentication(TokenAuthentication):
    """Token auth that also enforces an idle timeout and an absolute lifetime."""

    def authenticate_credentials(self, key):
        user, token = super().authenticate_credentials(key)
        now = timezone.now()

        absolute = timedelta(seconds=settings.AUTH_ABSOLUTE_TIMEOUT_SECONDS)
        idle = timedelta(seconds=settings.AUTH_IDLE_TIMEOUT_SECONDS)

        if now - token.created > absolute:
            token.delete()
            raise AuthenticationFailed("Session expired.")

        activity, _ = TokenActivity.objects.get_or_create(
            token=token, defaults={"last_used": token.created}
        )
        if now - activity.last_used > idle:
            token.delete()
            raise AuthenticationFailed("Session expired due to inactivity.")

        if now - activity.last_used > ACTIVITY_WRITE_INTERVAL:
            activity.last_used = now
            activity.save(update_fields=["last_used"])

        return user, token

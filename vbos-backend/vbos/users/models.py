import uuid
from django.db import models
from django.conf import settings
from django.dispatch import receiver
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from rest_framework.authtoken.models import Token


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Personal appearance choices (theme, mode, corners, text size); empty = organisation default
    appearance = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.username


class OrgAppearance(models.Model):
    """Organisation-wide default appearance. Single row (pk=1), set by staff."""

    data = models.JSONField(default=dict, blank=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Organisation appearance"
        verbose_name_plural = "Organisation appearance"

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    if created:
        Token.objects.create(user=instance)

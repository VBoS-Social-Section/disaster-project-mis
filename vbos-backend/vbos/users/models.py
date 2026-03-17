import uuid
from django.db import models
from django.conf import settings
from django.dispatch import receiver
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from rest_framework.authtoken.models import Token

MFA_EMAIL = "email"
MFA_TOTP = "totp"
MFA_CHOICES = [(MFA_EMAIL, "Email code"), (MFA_TOTP, "Authenticator app")]


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    mfa_enabled = models.BooleanField(default=False)
    mfa_method = models.CharField(
        max_length=10, choices=MFA_CHOICES, blank=True
    )

    def __str__(self):
        return self.username


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    if created:
        Token.objects.create(user=instance)

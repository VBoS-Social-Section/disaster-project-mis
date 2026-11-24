import factory
import pytest
from django.contrib.auth.hashers import check_password
from django.urls import reverse
from faker import Faker
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import User
from .factories import UserFactory

fake = Faker()


@pytest.mark.django_db
class TestUserListTestCase(APITestCase):
    """
    Tests /users list operations.
    """

    def setUp(self):
        self.url = reverse("users:user-list")
        self.user_data = factory.build(dict, FACTORY_CLASS=UserFactory)

    def test_post_request_with_no_data_fails(self):
        response = self.client.post(self.url, {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_post_request_with_valid_data_succeeds(self):
        response = self.client.post(self.url, self.user_data)
        assert response.status_code == status.HTTP_201_CREATED

        user = User.objects.get(pk=response.data.get("id"))
        assert user.username == self.user_data.get("username")
        assert check_password(self.user_data.get("password"), user.password)


class TestUserDetailTestCase(APITestCase):
    """
    Tests /users detail operations.
    """

    def setUp(self):
        self.user = UserFactory()
        self.url = reverse("users:user-detail", kwargs={"pk": self.user.pk})
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.user.auth_token}")

    def test_get_request_returns_a_given_user(self):
        response = self.client.get(self.url)
        assert response.status_code == status.HTTP_200_OK

    def test_put_request_updates_a_user(self):
        new_first_name = fake.first_name()
        payload = {"first_name": new_first_name}
        response = self.client.put(self.url, payload)
        assert response.status_code == status.HTTP_200_OK

        user = User.objects.get(pk=self.user.id)
        assert user.first_name == new_first_name


@pytest.mark.django_db
class TestTokenSessionLimits(APITestCase):
    """Idle (30 min) and absolute (8 h) limits on API tokens, plus logout."""

    def setUp(self):
        from rest_framework.authtoken.models import Token

        self.Token = Token
        self.user = UserFactory()
        self.user.set_password("pw-12345-Abc")
        self.user.save()
        self.me = reverse("users:user-me")

    def _login(self):
        resp = self.client.post(
            "/api-token-auth/",
            {"username": self.user.username, "password": "pw-12345-Abc"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        return resp.data["token"]

    def _get(self, key):
        return self.client.get(self.me, HTTP_AUTHORIZATION=f"Token {key}")

    def test_login_issues_fresh_token_and_revokes_old(self):
        first = self._login()
        second = self._login()
        assert first != second
        assert self._get(first).status_code == status.HTTP_401_UNAUTHORIZED
        assert self._get(second).status_code == status.HTTP_200_OK

    def test_idle_timeout_rejects_token(self):
        from datetime import timedelta

        from django.utils import timezone

        from ..models import TokenActivity

        key = self._login()
        TokenActivity.objects.update(last_used=timezone.now() - timedelta(minutes=31))
        assert self._get(key).status_code == status.HTTP_401_UNAUTHORIZED
        assert not self.Token.objects.filter(key=key).exists()

    def test_activity_keeps_token_alive(self):
        from datetime import timedelta

        from django.utils import timezone

        from ..models import TokenActivity

        key = self._login()
        TokenActivity.objects.update(last_used=timezone.now() - timedelta(minutes=29))
        assert self._get(key).status_code == status.HTTP_200_OK
        # last_used was refreshed, so another 29 minutes of idleness is still fine
        TokenActivity.objects.update(last_used=timezone.now() - timedelta(minutes=29))
        assert self._get(key).status_code == status.HTTP_200_OK

    def test_absolute_timeout_rejects_even_active_token(self):
        from datetime import timedelta

        from django.utils import timezone

        key = self._login()
        self.Token.objects.update(created=timezone.now() - timedelta(hours=8, minutes=1))
        assert self._get(key).status_code == status.HTTP_401_UNAUTHORIZED

    def test_logout_deletes_token(self):
        key = self._login()
        resp = self.client.post(
            reverse("users:logout"), HTTP_AUTHORIZATION=f"Token {key}"
        )
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert self._get(key).status_code == status.HTTP_401_UNAUTHORIZED

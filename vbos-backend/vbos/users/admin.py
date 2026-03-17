from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin, UserAdmin
from django.contrib.auth.models import Group

from .models import User


class Role(Group):
    """Proxy model to display as 'Role' instead of 'Group' in admin."""

    class Meta:
        proxy = True
        verbose_name = "Role"
        verbose_name_plural = "Roles"


@admin.register(User)
class UserAdmin(UserAdmin):
    pass


# Replace Group with Role in admin (Roles and Permissions section)
admin.site.unregister(Group)


@admin.register(Role)
class RoleAdmin(BaseGroupAdmin):
    pass

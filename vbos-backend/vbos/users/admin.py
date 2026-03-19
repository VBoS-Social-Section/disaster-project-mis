from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin, UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group
from unfold.admin import ModelAdmin as UnfoldModelAdmin
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm

from .models import User


class Role(Group):
    """Proxy model to display as 'Role' instead of 'Group' in admin."""

    class Meta:
        proxy = True
        verbose_name = "Role"
        verbose_name_plural = "Roles"


@admin.register(User)
class UserAdmin(BaseUserAdmin, UnfoldModelAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm


# Replace Group with Role in admin (Roles and Permissions section)
admin.site.unregister(Group)


@admin.register(Role)
class RoleAdmin(BaseGroupAdmin, UnfoldModelAdmin):
    pass

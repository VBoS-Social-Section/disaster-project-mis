from django import forms
from django.contrib import admin
from django.shortcuts import redirect
from django.urls import reverse

from .models import LandAccountsData


class LandAccountsDataForm(forms.ModelForm):
    class Meta:
        model = LandAccountsData
        fields = ["data"]

    def clean_data(self):
        data = self.cleaned_data.get("data")
        if not isinstance(data, dict):
            raise forms.ValidationError("Data must be a JSON object.")
        if "provinces" not in data:
            raise forms.ValidationError("Data must have a 'provinces' key.")
        return data


@admin.register(LandAccountsData)
class LandAccountsDataAdmin(admin.ModelAdmin):
    form = LandAccountsDataForm
    list_display = ["id", "updated_display", "provinces_count"]
    readonly_fields = ["updated_at"]
    ordering = ["-updated_at"]

    def updated_display(self, obj):
        return obj.updated_at.strftime("%Y-%m-%d %H:%M") if obj.updated_at else "-"

    updated_display.short_description = "Last updated"

    def provinces_count(self, obj):
        provinces = obj.data.get("provinces", {})
        return len(provinces)

    provinces_count.short_description = "Provinces"

    def changelist_view(self, request, extra_context=None):
        """Redirect to custom form-based list view."""
        return redirect("admin_land_accounts_list")

    def changeform_view(self, request, object_id=None, form_url="", extra_context=None):
        """Redirect to custom form-based edit view."""
        if object_id:
            return redirect("admin_land_accounts_edit", object_id=object_id)
        return redirect("admin_land_accounts_list")

    def has_add_permission(self, request):
        return True

    def has_delete_permission(self, request, obj=None):
        return True

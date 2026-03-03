from django import forms
from django.forms import formset_factory
from django.urls import reverse
from django.utils.safestring import mark_safe

from .models import TabularDataset, VectorDataset


class IconPickerWidget(forms.TextInput):
    """Text input with Browse button that opens Flaticon icon picker."""

    def render(self, name, value, attrs=None, renderer=None):
        attrs = attrs or {}
        attrs.setdefault("placeholder", "e.g. fi-sr-hospital or droplet")
        html = super().render(name, value, attrs, renderer)
        picker_url = reverse("admin_icon_picker")
        html += mark_safe(
            f' <a href="{picker_url}" id="icon-browse-btn" target="_blank" '
            'rel="noopener" onclick="event.preventDefault();'
            f'window.open(this.href,\'iconpicker\',\'width=600,height=500\');'
            'return false;" class="button">Browse icons</a>'
        )
        return html


class FileDatasetRowForm(forms.Form):
    """Single row for file-dataset mapping (Option 3)."""

    file = forms.FileField(
        label="File",
        required=False,
        help_text="Leave empty to skip this row",
    )
    dataset = forms.ModelChoiceField(
        queryset=TabularDataset.objects.all(),
        empty_label="Select a dataset",
        required=False,
    )


FileDatasetFormSet = formset_factory(
    FileDatasetRowForm,
    extra=1,
    min_num=1,
    validate_min=True,
)


class CSVImportOptionsForm(forms.Form):
    """Global options for CSV import (applies to all files in the formset)."""

    format_style = forms.ChoiceField(
        label="CSV format",
        choices=[
            ("long", "Long format (Year, Attribute, Value per row)"),
            ("wide", "Wide format (Region per row, metrics as columns)"),
        ],
        initial="long",
        help_text="Wide format: first column = Region, other columns = attribute names with values",
    )
    year = forms.IntegerField(
        label="Year (for wide format)",
        required=False,
        min_value=1900,
        max_value=2100,
        initial=2024,
        help_text="Used when CSV has no Year column (wide format)",
    )


class CSVUploadForm(forms.Form):
    file = forms.FileField(label="File")
    dataset = forms.ModelChoiceField(
        queryset=TabularDataset.objects.all(),
        empty_label="Select a dataset",
    )
    format_style = forms.ChoiceField(
        label="CSV format",
        choices=[
            ("long", "Long format (Year, Attribute, Value per row)"),
            ("wide", "Wide format (Region per row, metrics as columns)"),
        ],
        initial="long",
        help_text="Wide format: first column = Region, other columns = attribute names with values",
    )
    year = forms.IntegerField(
        label="Year (for wide format)",
        required=False,
        min_value=1900,
        max_value=2100,
        initial=2024,
        help_text="Used when CSV has no Year column (wide format)",
    )


VECTOR_COLOR_CHOICES = [
    ("", "Auto (cluster or index)"),
    ("#3d4aff", "Blue"),
    ("#10b981", "Emerald"),
    ("#f09000", "Orange"),
    ("#8b5cf6", "Violet"),
    ("#e34a33", "Red"),
    ("#06b6d4", "Cyan"),
    ("#6366f1", "Indigo"),
    ("#14b8a6", "Teal"),
]


class GeoJSONUploadForm(forms.Form):
    file = forms.FileField(label="File")
    dataset = forms.ModelChoiceField(
        queryset=VectorDataset.objects.all(), empty_label="Select a dataset"
    )
    icon = forms.CharField(
        label="Icon to display",
        required=False,
        widget=IconPickerWidget,
        help_text="Lucide key (e.g. droplet) or Flaticon class (e.g. fi-sr-hospital). Use Browse to pick from 50,000+ icons.",
    )
    color = forms.ChoiceField(
        label="Color",
        choices=VECTOR_COLOR_CHOICES,
        required=False,
        help_text="Set the marker color for this dataset (e.g. Primary=blue, Secondary=emerald).",
    )

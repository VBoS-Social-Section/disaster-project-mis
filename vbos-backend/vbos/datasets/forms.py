from django import forms
from django.forms import formset_factory

from .models import TabularDataset, VectorDataset


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


class GeoJSONUploadForm(forms.Form):
    file = forms.FileField(label="File")
    dataset = forms.ModelChoiceField(
        queryset=VectorDataset.objects.all(), empty_label="Select a dataset"
    )

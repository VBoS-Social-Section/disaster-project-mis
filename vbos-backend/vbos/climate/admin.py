"""Climate admin: Raster, PMTiles, Vector, Vector Items with Display-in-modules checkboxes."""

import json
from io import TextIOWrapper

from django import forms
from django.contrib import admin
from django.contrib.gis import admin as gis_admin
from django.contrib import messages
from django.contrib.gis.geos.geometry import GEOSGeometry
from django.db.models import Q
from django.shortcuts import redirect, render
from django.urls import path, reverse

from vbos.datasets.admin import (
    PMTilesDatasetAdmin,
    RasterDatasetAdmin,
    RasterFileAdmin,
    VectorDatasetAdmin,
)
from vbos.datasets.models import AreaCouncil, Cluster, Province, VectorDataset, VectorItem
from vbos.datasets.utils import GeoJSONProperties

from .constants import CLIMATE_DISPLAY_MODULE_CHOICES
from .forms import ClimateGeoJSONUploadForm
from .models import (
    ClimatePMTilesDataset,
    ClimateRasterDataset,
    ClimateRasterFile,
    ClimateVectorDataset,
    ClimateVectorItem,
)


@admin.register(ClimateRasterDataset)
class ClimateRasterDatasetAdmin(RasterDatasetAdmin):
    """Raster datasets for Climate (Land cover). URL: /admin/climate/climaterasterdataset/"""


@admin.register(ClimateRasterFile)
class ClimateRasterFileAdmin(RasterFileAdmin):
    """Raster files for Climate. URL: /admin/climate/climaterasterfile/"""


class ClimatePMTilesDatasetForm(forms.ModelForm):
    display_in = forms.MultipleChoiceField(
        choices=CLIMATE_DISPLAY_MODULE_CHOICES,
        required=False,
        widget=forms.CheckboxSelectMultiple,
        label="Display in",
        help_text="Select modules where this dataset appears (Land cover, Coastal changes, etc.).",
    )

    class Meta:
        model = ClimatePMTilesDataset
        fields = "__all__"
        exclude = ["climate_module", "climate_modules"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            mods = getattr(self.instance, "climate_modules", None) or []
            if not mods and getattr(self.instance, "climate_module", None):
                mods = [self.instance.climate_module]
            self.initial["display_in"] = mods

    def save(self, commit=True):
        obj = super().save(commit=False)
        mods = list(self.cleaned_data.get("display_in") or [])
        obj.climate_modules = mods
        obj.climate_module = mods[0] if mods else None
        if commit:
            obj.save()
        return obj


class ClimateVectorDatasetForm(forms.ModelForm):
    display_in = forms.MultipleChoiceField(
        choices=CLIMATE_DISPLAY_MODULE_CHOICES,
        required=False,
        widget=forms.CheckboxSelectMultiple,
        label="Display in",
        help_text="Select modules where this dataset appears (Land cover, Coastal changes, etc.).",
    )

    class Meta:
        model = ClimateVectorDataset
        fields = "__all__"
        exclude = ["climate_module", "climate_modules"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            mods = getattr(self.instance, "climate_modules", None) or []
            if not mods and getattr(self.instance, "climate_module", None):
                mods = [self.instance.climate_module]
            self.initial["display_in"] = mods

    def save(self, commit=True):
        obj = super().save(commit=False)
        mods = list(self.cleaned_data.get("display_in") or [])
        obj.climate_modules = mods
        obj.climate_module = mods[0] if mods else None
        if commit:
            obj.save()
        return obj


@admin.register(ClimatePMTilesDataset)
class ClimatePMTilesDatasetAdmin(PMTilesDatasetAdmin):
    form = ClimatePMTilesDatasetForm
    list_display = ["id", "name", "type", "display_modules", "updated"]
    list_editable = []

    def get_queryset(self, request):
        qs = super(PMTilesDatasetAdmin, self).get_queryset(request)
        return qs.filter(
            Q(climate_module__in=["land_accounts", "coastal_changes"])
            | ~Q(climate_modules=[])
        )

    def get_fieldsets(self, request, obj=None):
        fieldsets = list(super().get_fieldsets(request, obj))
        result = []
        for name, data in fieldsets:
            if name == "Section":
                result.append((
                    "Display in modules",
                    {
                        "fields": ("display_in",),
                        "description": "Select where this dataset appears in Climate.",
                    },
                ))
                continue
            if name == "PMTiles":
                # Climate dashboard: no cyclone fields (disaster-only)
                fields = tuple(
                    f for f in data.get("fields", ())
                    if f not in ("cyclone_name", "intensity_data")
                )
                if fields:
                    result.append((name, {**data, "fields": fields}))
                continue
            result.append((name, data))
        return result

    def save_model(self, request, obj, form, change):
        if hasattr(form, "cleaned_data") and "display_in" in form.cleaned_data:
            obj.climate_modules = list(form.cleaned_data.get("display_in") or [])
        if obj.climate_modules:
            obj.climate_module = obj.climate_modules[0]
        else:
            obj.climate_module = None
        if not obj.cluster_id:
            obj.cluster = Cluster.objects.get_or_create(name="Land Accounts", defaults={"order": 100})[0]
        super().save_model(request, obj, form, change)

    @admin.display(description="Display in")
    def display_modules(self, obj):
        mods = getattr(obj, "climate_modules", None) or []
        if not mods and getattr(obj, "climate_module", None):
            mods = [obj.climate_module]
        labels = dict(CLIMATE_DISPLAY_MODULE_CHOICES)
        return ", ".join(labels.get(m, m) for m in mods) or "—"


@admin.register(ClimateVectorDataset)
class ClimateVectorDatasetAdmin(VectorDatasetAdmin):
    form = ClimateVectorDatasetForm
    list_display = ["id", "name", "type", "display_modules", "icon", "color", "updated"]
    list_editable = ["icon", "color"]

    def get_queryset(self, request):
        qs = super(VectorDatasetAdmin, self).get_queryset(request)
        return qs.filter(
            Q(climate_module__in=["land_accounts", "coastal_changes"])
            | ~Q(climate_modules=[])
        )

    def get_fieldsets(self, request, obj=None):
        fieldsets = list(super().get_fieldsets(request, obj))
        result = []
        for name, data in fieldsets:
            if name == "Section":
                result.append((
                    "Display in modules",
                    {
                        "fields": ("display_in",),
                        "description": "Select where this dataset appears in Climate.",
                    },
                ))
                continue
            if name == "Map display":
                # Climate dashboard: no cyclone name (disaster-only)
                fields = tuple(f for f in data.get("fields", ()) if f != "cyclone_name")
                if fields:
                    result.append((name, {**data, "fields": fields}))
                continue
            result.append((name, data))
        return result

    def save_model(self, request, obj, form, change):
        if hasattr(form, "cleaned_data") and "display_in" in form.cleaned_data:
            obj.climate_modules = list(form.cleaned_data.get("display_in") or [])
        if obj.climate_modules:
            obj.climate_module = obj.climate_modules[0]
        else:
            obj.climate_module = None
        if not obj.cluster_id:
            obj.cluster = Cluster.objects.get_or_create(name="Land Accounts", defaults={"order": 100})[0]
        super().save_model(request, obj, form, change)

    @admin.display(description="Display in")
    def display_modules(self, obj):
        mods = getattr(obj, "climate_modules", None) or []
        if not mods and getattr(obj, "climate_module", None):
            mods = [obj.climate_module]
        labels = dict(CLIMATE_DISPLAY_MODULE_CHOICES)
        return ", ".join(labels.get(m, m) for m in mods) or "—"


def _climate_vector_dataset_queryset():
    """Vector datasets for Climate (Land Accounts, Coastal Changes)."""
    return VectorDataset.objects.filter(
        Q(climate_module__in=["land_accounts", "coastal_changes"])
        | ~Q(climate_modules=[])
    ).order_by("name")


@admin.register(ClimateVectorItem)
class ClimateVectorItemAdmin(gis_admin.GISModelAdmin):
    """Vector items for Climate datasets. Lists items, Add vector item, Import File (GeoJSON)."""

    list_display = [
        "id",
        "dataset",
        "location_display",
        "coords_display",
        "name",
        "attribute",
    ]
    list_editable = ["name", "attribute"]
    list_filter = ["dataset", "province", "area_council"]
    search_fields = ["id", "name", "attribute"]
    list_per_page = 50
    change_list_template = "admin/climate/climatevectoritem/change_list.html"

    @admin.display(description="Location")
    def location_display(self, obj):
        parts = []
        if obj.province:
            parts.append(str(obj.province.name))
        if obj.area_council:
            parts.append(str(obj.area_council.name))
        return " / ".join(parts) if parts else "—"

    @admin.display(description="Coords")
    def coords_display(self, obj):
        if obj.geometry:
            try:
                centroid = obj.geometry.centroid
                return f"{centroid.y:.4f}, {centroid.x:.4f}"
            except Exception:
                pass
        return "—"

    fieldsets = (
        (
            "Main info",
            {
                "fields": ("dataset", "name", "attribute"),
                "description": "Edit name and attribute to fix missing or incorrect data.",
            },
        ),
        ("Location", {"fields": ("province", "area_council")}),
        ("Geometry", {"fields": ("geometry",)}),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.filter(dataset__in=_climate_vector_dataset_queryset())

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "dataset":
            kwargs["queryset"] = _climate_vector_dataset_queryset()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "import-file/",
                self.admin_site.admin_view(self.import_file),
                name="climate_climatevectoritem_import_file",
            ),
        ]
        return custom_urls + urls

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context["upload_file"] = reverse("admin:climate_climatevectoritem_import_file")
        return super().changelist_view(request, extra_context=extra_context)

    def import_file(self, request):
        """Import GeoJSON for Climate vector datasets. Same flow as Disaster Import File."""
        if request.method == "POST":
            form = ClimateGeoJSONUploadForm(request.POST, request.FILES)
            if form.is_valid():
                uploaded_file = request.FILES["file"]
                if not uploaded_file.name.endswith(".geojson"):
                    messages.error(request, "Please upload a GeoJSON file")
                    return redirect("admin:climate_climatevectoritem_import_file")

                try:
                    dataset = form.cleaned_data["dataset"]
                    icon = (form.cleaned_data.get("icon") or "").strip()
                    color = (form.cleaned_data.get("color") or "").strip()
                    update_fields = []
                    if icon:
                        dataset.icon = icon
                        update_fields.append("icon")
                    if color:
                        dataset.color = color
                        update_fields.append("color")
                    if update_fields:
                        dataset.save(update_fields=update_fields)

                    decoded = TextIOWrapper(uploaded_file.file, encoding="utf-8")
                    geojson_content = json.loads(decoded.read())

                    created_count = 0
                    error_count = 0
                    first_error = None
                    for item in geojson_content.get("features", []):
                        props = item.get("properties") or {}
                        metadata = GeoJSONProperties(props.copy())
                        try:
                            province_name = str(metadata.province or "").strip()
                            province = (
                                Province.objects.filter(name__iexact=province_name).first()
                                if province_name
                                else None
                            )
                            ac_name = str(metadata.area_council or "").strip()
                            area_council = (
                                AreaCouncil.objects.filter(name__iexact=ac_name).first()
                                if ac_name
                                else None
                            )
                            attribute = str(metadata.attribute or "").strip() or None
                            name = str(metadata.name or "").strip() or None
                            ref = str(metadata.ref or "").strip() or None
                            if ref and len(ref) > 50:
                                ref = ref[:50]

                            geom = item.get("geometry")
                            if not geom:
                                raise ValueError("Feature has no geometry")

                            geos_geom = GEOSGeometry(json.dumps(geom))
                            if geos_geom.geom_type in ("Polygon", "MultiPolygon"):
                                try:
                                    n = geos_geom.num_coords
                                except (AttributeError, TypeError):
                                    n = 0
                                if n > 500:
                                    geos_geom = geos_geom.simplify(
                                        tolerance=0.01, preserve_topology=True
                                    )

                            VectorItem.objects.create(
                                dataset=dataset,
                                metadata=metadata.properties,
                                name=name,
                                ref=ref,
                                attribute=attribute,
                                province=province,
                                area_council=area_council,
                                geometry=geos_geom,
                            )
                            created_count += 1
                        except Exception as e:
                            error_count += 1
                            if first_error is None:
                                first_error = str(e)

                    if created_count > 0:
                        messages.success(
                            request, f"Successfully created {created_count} new records"
                        )
                    if error_count > 0:
                        msg = f"Failed to create {error_count} items."
                        if first_error:
                            msg += f" First error: {first_error}"
                        messages.warning(request, msg)

                except Exception as e:
                    messages.error(request, f"Error processing GeoJSON: {str(e)}")

                return redirect("admin:climate_climatevectoritem_changelist")
        else:
            dataset_id = request.GET.get("dataset")
            initial = {}
            if dataset_id:
                try:
                    ds = _climate_vector_dataset_queryset().get(pk=int(dataset_id))
                    initial["dataset"] = ds
                except (ValueError, VectorDataset.DoesNotExist):
                    pass
            form = ClimateGeoJSONUploadForm(initial=initial)

        dataset_meta = {
            str(d.id): {"icon": d.icon or "", "color": d.color or ""}
            for d in _climate_vector_dataset_queryset().only("id", "icon", "color")
        }

        context = {
            "form": form,
            "opts": self.model._meta,
            "title": "Import GeoJSON File",
            "dataset_meta_json": json.dumps(dataset_meta),
        }
        return render(request, "admin/geojson_upload.html", context)

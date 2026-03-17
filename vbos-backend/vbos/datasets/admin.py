import csv
import json
from io import TextIOWrapper

from adminsortable2.admin import SortableAdminMixin
from django import forms
from django.contrib.admin import SimpleListFilter
from django.contrib import messages
from django.contrib.gis import admin
from django.contrib.gis.geos.geometry import GEOSGeometry
from django.shortcuts import redirect, render, reverse
from django.urls import path

from .forms import GeoJSONUploadForm, IconPickerWidget
from .models import (
    AreaCouncil,
    Cluster,
    PMTilesDataset,
    Province,
    RasterDataset,
    RasterFile,
    TabularDataset,
    TabularItem,
    VectorDataset,
    VectorItem,
)
from .utils import (
    CSVRow,
    GeoJSONProperties,
    clean_redundant_tabular_items,
    create_tabular_item,
    import_wide_format_csv,
)


class YearListFilter(SimpleListFilter):
    title = "Year"
    parameter_name = "year"

    def lookups(self, request, model_admin):
        years = (
            TabularItem.objects.filter(date__isnull=False)
            .dates("date", "year", order="DESC")
        )
        return [(d.year, str(d.year)) for d in years]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(date__year=self.value())
        return queryset


@admin.register(Cluster)
class ClusterAdmin(SortableAdminMixin, admin.ModelAdmin):
    list_display = ["id", "name"]


class RasterFileAdmin(admin.ModelAdmin):
    """Base admin for RasterFile. Registered in climate app as ClimateRasterFileAdmin."""
    list_display = ["id", "name", "created", "file"]


class RasterDatasetAdmin(admin.ModelAdmin):
    """Base admin for RasterDataset. Registered in climate app as ClimateRasterDatasetAdmin."""
    list_display = ["id", "name", "type", "is_land_cover", "updated", "filename_id"]
    list_filter = ["type", "is_land_cover"]
    list_editable = ["is_land_cover"]
    fieldsets = (
        (
            None,
            {
                "fields": ("name", "type", "description", "source"),
                "description": "Raster datasets are Climate-mode only. They appear in the Land cover tab regardless of selected cluster.",
            },
        ),
        (
            "Raster / TiTiler",
            {
                "fields": ("filename_id", "titiler_url_params", "is_land_cover"),
                "description": "filename_id is used for VRT path: {MEDIA_URL}/{filename_id}_{year}.vrt. "
                "Check is_land_cover for categorical land cover rasters (Climate mode).",
            },
        ),
        (
            "Precomputed tiles",
            {
                "fields": ("precomputed_tile_url",),
                "description": "Optional URL template for precomputed raster+tabular tiles. Use {z}, {x}, {y}, {year}. When set, used instead of TiTiler.",
            },
        ),
    )


@admin.register(PMTilesDataset)
class PMTilesDatasetAdmin(admin.ModelAdmin):
    def get_queryset(self, request):
        from django.db.models import Q
        qs = super().get_queryset(request)
        return qs.filter(Q(climate_module__isnull=True) | Q(climate_module=""))
    list_display = ["id", "name", "cluster", "type", "climate_module", "updated"]
    list_filter = ["cluster", "type", "climate_module"]
    list_editable = ["climate_module"]

    fieldsets = (
        (None, {"fields": ("name", "type", "description", "source", "cluster")}),
        (
            "Section",
            {
                "fields": ("climate_module",),
                "description": "Disaster only = show in Disaster section. Land Accounts / Coastal Changes = show in Climate under that module.",
            },
        ),
        (
            "PMTiles",
            {"fields": ("url", "source_layer", "cyclone_name", "intensity_data")},
        ),
    )

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if "intensity_data" in form.base_fields:
            form.base_fields["intensity_data"].help_text = (
                "For cyclone datasets: JSON array of {acname, Province, Intensity, intensity_color}. "
                "Export from RAP GeoJSON features.properties."
            )
        return form


@admin.register(VectorDataset)
class VectorDatasetAdmin(admin.ModelAdmin):
    def get_queryset(self, request):
        from django.db.models import Q
        qs = super().get_queryset(request)
        return qs.filter(Q(climate_module__isnull=True) | Q(climate_module=""))
    list_display = ["id", "name", "cluster", "type", "climate_module", "icon", "color", "updated"]
    list_filter = ["cluster", "type", "climate_module"]
    list_editable = ["climate_module", "icon", "color"]
    change_form_template = "admin/datasets/vectordataset/change_form.html"

    fieldsets = (
        (None, {"fields": ("name", "type", "description", "source", "cluster")}),
        (
            "Section",
            {
                "fields": ("climate_module",),
                "description": "Disaster only = show in Disaster section. Land Accounts / Coastal Changes = show in Climate under that module.",
            },
        ),
        (
            "Map display",
            {"fields": ("icon", "color", "cyclone_name")},
        ),
    )

    def formfield_for_dbfield(self, db_field, request, **kwargs):
        if db_field.name == "icon":
            kwargs["widget"] = IconPickerWidget
        return super().formfield_for_dbfield(db_field, request, **kwargs)


@admin.register(VectorItem)
class VectorItemAdmin(admin.GISModelAdmin):
    """Vector items for Disaster datasets only. Climate items are under Climate > Vector Items."""

    def get_queryset(self, request):
        from django.db.models import Q
        qs = super().get_queryset(request)
        # Exclude items from climate datasets (Land Accounts, Coastal Changes)
        return qs.exclude(
            Q(dataset__climate_module__in=["land_accounts", "coastal_changes"])
            | ~Q(dataset__climate_modules=[])  # climate_modules has items
        )

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

    @admin.display(description="Location")
    def location_display(self, obj):
        """Province / Area council - match this to the map popup to identify which school."""
        parts = []
        if obj.province:
            parts.append(str(obj.province.name))
        if obj.area_council:
            parts.append(str(obj.area_council.name))
        return " / ".join(parts) if parts else "—"

    @admin.display(description="Coords")
    def coords_display(self, obj):
        """Lat, lng - helps match to the map when multiple schools share the same area."""
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

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "upload-file/",
                self.admin_site.admin_view(self.import_file),
                name="datasets_vectoritem_import_file",
            ),
        ]
        return custom_urls + urls

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context["upload_file"] = reverse("admin:datasets_vectoritem_import_file")
        return super().changelist_view(request, extra_context=extra_context)

    def import_file(self, request):
        if request.method == "POST":
            form = GeoJSONUploadForm(request.POST, request.FILES)
            if form.is_valid():
                uploaded_file = request.FILES["file"]

                # Check if the file is a CSV
                if not uploaded_file.name.endswith(".geojson"):
                    messages.error(request, "Please upload a GeoJSON file")
                    return redirect("admin:datasets_vectoritem_import_file")

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

                    decoded_file = TextIOWrapper(uploaded_file.file, encoding="utf-8")
                    geojson_content = json.loads(decoded_file.read())

                    created_count = 0
                    error_count = 0

                    first_error = None
                    for item in geojson_content["features"]:
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
                            attribute = (
                                str(metadata.attribute or "").strip() or None
                            )
                            name = str(metadata.name or "").strip() or None
                            ref = str(metadata.ref or "").strip() or None
                            if ref and len(ref) > 50:
                                ref = ref[:50]

                            geom = item.get("geometry")
                            if not geom:
                                raise ValueError("Feature has no geometry")

                            geos_geom = GEOSGeometry(json.dumps(geom))
                            # Simplify polygon geometries to prevent browser crash (heavy coastlines)
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

                return redirect("admin:datasets_vectoritem_import_file")
        else:
            dataset_id = request.GET.get("dataset")
            initial = {}
            if dataset_id:
                try:
                    ds = VectorDataset.objects.get(pk=int(dataset_id))
                    initial["dataset"] = ds
                except (ValueError, VectorDataset.DoesNotExist):
                    pass
            form = GeoJSONUploadForm(initial=initial)

        # Dataset icon/color for auto-load when user selects a dataset
        dataset_meta = {
            str(d.id): {"icon": d.icon or "", "color": d.color or ""}
            for d in VectorDataset.objects.all().only("id", "icon", "color")
        }

        context = {
            "form": form,
            "opts": self.model._meta,
            "title": "Import GeoJSON File",
            "dataset_meta_json": json.dumps(dataset_meta),
        }
        return render(request, "admin/geojson_upload.html", context)


@admin.register(TabularDataset)
class TabularDatasetAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "cluster", "type", "updated"]
    list_filter = ["cluster", "type"]
    actions = ["clean_redundant_items"]

    @admin.action(description="Clean redundant TabularItems for dataset")
    def clean_redundant_items(self, request, queryset):
        for dataset in queryset:
            clean_redundant_tabular_items(dataset)

        dataset_names = list(queryset.values_list("name", flat=True))
        if len(dataset_names) == 1:
            message = f"Cleaned redundant values for: {dataset_names[0]}."
        else:
            # Join all but last with commas, then add "and" before last item
            message = f"Cleaned redundant values for: {', '.join(dataset_names[:-1])} and {dataset_names[-1]}."

        messages.success(request, message)


@admin.register(TabularItem)
class TabularItemAdmin(admin.GISModelAdmin):
    list_display = [
        "id",
        "dataset",
        "province",
        "area_council",
        "attribute",
        "value",
        "year_column",
    ]
    list_filter = [
        "dataset__cluster",
        "dataset",
        YearListFilter,
        "province",
        "area_council",
        "attribute",
    ]

    @admin.display(description="Year")
    def year_column(self, obj):
        return obj.date.year if obj.date else None

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "upload-file/",
                self.admin_site.admin_view(self.import_file),
                name="datasets_tabularitem_import_file",
            ),
        ]
        return custom_urls + urls

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context["upload_file"] = reverse("admin:datasets_tabularitem_import_file")
        return super().changelist_view(request, extra_context=extra_context)

    def import_file(self, request):
        upload_url = reverse("admin:datasets_tabularitem_import_file")
        datasets = list(
            TabularDataset.objects.select_related("cluster").values(
                "id", "name", "type", "cluster__name"
            )
        )
        for d in datasets:
            cluster = d.get("cluster__name") or ""
            ds_type = d.get("type") or ""
            d["display"] = f"{d['name']} - {cluster} / {ds_type}" if cluster else d["name"]

        if request.method == "POST":
            pairs = []
            format_style = request.POST.get("format_style", "long")
            year = int(request.POST.get("year") or 2024)
            try:
                file_count = int(request.POST.get("file_count", 0))
            except ValueError:
                file_count = 0

            for i in range(file_count):
                f_key = f"file_{i}"
                ds_key = f"dataset_{i}"
                uploaded_file = request.FILES.get(f_key)
                dataset_id = request.POST.get(ds_key)
                if uploaded_file and dataset_id:
                    try:
                        dataset = TabularDataset.objects.get(pk=int(dataset_id))
                        pairs.append((uploaded_file, dataset))
                    except (TabularDataset.DoesNotExist, ValueError):
                        pass

            if not pairs:
                messages.error(
                    request,
                    "Please add at least one file and select a dataset for it.",
                )
            else:
                total_created = 0
                total_errors = 0
                first_error = None
                for uploaded_file, dataset in pairs:
                    if not uploaded_file.name.endswith(".csv"):
                        messages.error(
                            request,
                            f"'{uploaded_file.name}' is not a CSV file. "
                            "Only CSV files are accepted.",
                        )
                        continue
                    try:
                        decoded_file = TextIOWrapper(
                            uploaded_file.file, encoding="utf-8"
                        )
                        reader = csv.DictReader(decoded_file)
                        created_count = 0
                        error_count = 0
                        if format_style == "wide":
                            created_count, error_count, err = (
                                import_wide_format_csv(reader, dataset, year)
                            )
                            if err and first_error is None:
                                first_error = err
                        else:
                            for row in reader:
                                try:
                                    csv_row = CSVRow(row)
                                    create_tabular_item(csv_row, dataset)
                                    created_count += 1
                                except Exception as e:
                                    error_count += 1
                                    if first_error is None:
                                        first_error = str(e)
                        total_created += created_count
                        total_errors += error_count
                    except Exception as e:
                        messages.error(
                            request,
                            f"Error processing '{uploaded_file.name}': {str(e)}",
                        )
                if total_created > 0:
                    messages.success(
                        request,
                        f"Successfully created {total_created} new records",
                    )
                if total_errors > 0:
                    msg = f"Failed to create {total_errors} items."
                    if first_error:
                        msg += f" First error: {first_error}"
                    messages.warning(request, msg)
                if pairs:
                    return redirect(upload_url)

        context = {
            "opts": self.model._meta,
            "title": "Import CSV Files",
            "datasets_json": json.dumps(datasets),
            "upload_url": upload_url,
        }
        return render(request, "admin/csv_import.html", context)

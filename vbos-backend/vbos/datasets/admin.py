import csv
import json
from io import TextIOWrapper

from django.contrib import messages
from django.contrib.gis import admin
from django.contrib.gis.geos.geometry import GEOSGeometry
from django.shortcuts import redirect, render, reverse
from django.urls import path

from .forms import CSVUploadForm, GeoJSONUploadForm
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


@admin.register(Cluster)
class ClusterAdmin(admin.ModelAdmin):
    list_display = ["id", "name"]


@admin.register(RasterFile)
class RasterFileAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "created", "file"]


@admin.register(RasterDataset)
class RasterDatasetAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "cluster", "type", "updated", "filename_id"]
    list_filter = ["cluster", "type"]


@admin.register(PMTilesDataset)
class PMTilesDatasetAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "cluster", "type", "updated"]
    list_filter = ["cluster", "type"]


@admin.register(VectorDataset)
class VectorDatasetAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "cluster", "type", "updated"]
    list_filter = ["cluster", "type"]


@admin.register(VectorItem)
class VectorItemAdmin(admin.GISModelAdmin):
    list_display = ["id", "dataset", "name", "attribute", "province", "area_council"]
    list_filter = ["dataset", "province", "area_council"]

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
                    decoded_file = TextIOWrapper(uploaded_file.file, encoding="utf-8")
                    geojson_content = json.loads(decoded_file.read())

                    created_count = 0
                    error_count = 0

                    for item in geojson_content["features"]:
                        metadata = GeoJSONProperties(item["properties"])
                        try:
                            province = (
                                Province.objects.filter(
                                    name__iexact=metadata.province.strip()
                                ).first()
                                if metadata.province
                                else None
                            )
                            area_council = (
                                AreaCouncil.objects.filter(
                                    name__iexact=metadata.area_council.strip()
                                ).first()
                                if metadata.province
                                else None
                            )
                            attribute = (
                                metadata.attribute.strip()
                                if metadata.attribute
                                else None
                            )
                            VectorItem.objects.create(
                                dataset=form.cleaned_data["dataset"],
                                metadata=metadata.properties,
                                name=metadata.name.strip() if metadata.name else None,
                                ref=metadata.ref,
                                attribute=attribute,
                                province=province,
                                area_council=area_council,
                                geometry=GEOSGeometry(json.dumps(item["geometry"])),
                            )
                            created_count += 1
                        except Exception as e:
                            print(e)
                            error_count += 1

                    if created_count > 0:
                        messages.success(
                            request, f"Successfully created {created_count} new records"
                        )

                    if error_count > 0:
                        messages.warning(
                            request, f"Failed to create {error_count} items."
                        )

                except Exception as e:
                    messages.error(request, f"Error processing GeoJSON: {str(e)}")

                return redirect("admin:datasets_vectoritem_import_file")
        else:
            form = GeoJSONUploadForm()

        context = {
            "form": form,
            "opts": self.model._meta,
            "title": "Import GeoJSON File",
        }
        return render(request, "admin/file_upload.html", context)


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
    list_display = ["id", "dataset", "province", "area_council", "attribute", "value"]
    list_filter = ["dataset", "province", "area_council"]

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
        if request.method == "POST":
            form = CSVUploadForm(request.POST, request.FILES)
            if form.is_valid():
                uploaded_file = request.FILES["file"]

                # Check if the file is a CSV
                if not uploaded_file.name.endswith(".csv"):
                    messages.error(request, "Please upload a CSV file")
                    return redirect("admin:datasets_tabularitem_import_file")

                try:
                    decoded_file = TextIOWrapper(uploaded_file.file, encoding="utf-8")
                    reader = csv.DictReader(decoded_file)

                    created_count = 0
                    error_count = 0
                    first_error = None

                    if form.cleaned_data.get("format_style") == "wide":
                        year = form.cleaned_data.get("year") or 2024
                        created_count, error_count, first_error = import_wide_format_csv(
                            reader,
                            form.cleaned_data["dataset"],
                            year,
                        )
                    else:
                        for row in reader:
                            try:
                                csv_row = CSVRow(row)
                                create_tabular_item(
                                    csv_row, form.cleaned_data["dataset"]
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
                    messages.error(request, f"Error processing CSV: {str(e)}")

                return redirect("admin:datasets_tabularitem_import_file")
        else:
            form = CSVUploadForm()

        context = {
            "form": form,
            "opts": self.model._meta,
            "title": "Import CSV File",
        }
        return render(request, "admin/file_upload.html", context)

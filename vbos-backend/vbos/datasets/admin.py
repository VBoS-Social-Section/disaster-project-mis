import csv
import json
from io import TextIOWrapper

from adminsortable2.admin import SortableAdminMixin
from django.contrib.admin import SimpleListFilter
from django.contrib import messages
from django.contrib.gis import admin
from django.contrib.gis.geos.geometry import GEOSGeometry
from django.shortcuts import redirect, render, reverse
from django.urls import path

from .forms import GeoJSONUploadForm
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

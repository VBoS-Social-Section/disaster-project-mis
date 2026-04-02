from django.contrib import admin
from django.contrib.admin import ModelAdmin
from django.shortcuts import render
from django.urls import reverse
from django.utils.html import format_html
from django.utils import timezone

from .models import FieldCheckRecord, FieldCheckAssignment


@admin.register(FieldCheckRecord)
class FieldCheckRecordAdmin(ModelAdmin):
    list_display = ["id", "content_type", "object_id", "status", "observed_value", "verified_by", "verified_at"]
    list_filter = ["status", "content_type"]
    search_fields = ["notes", "verified_by__username"]
    readonly_fields = ["verified_at"]
    date_hierarchy = "verified_at"
    ordering = ["-verified_at"]

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context["show_dashboard_link"] = True
        return super().changelist_view(request, extra_context)


PRIORITY_COLORS = {
    "critical": "#dc2626",
    "high": "#ea580c",
    "medium": "#ca8a04",
    "low": "#16a34a",
}

STATUS_COLORS = {
    "pending": "#6b7280",
    "in_progress": "#2563eb",
    "completed": "#16a34a",
    "skipped": "#9ca3af",
}


@admin.register(FieldCheckAssignment)
class FieldCheckAssignmentAdmin(ModelAdmin):
    list_display = [
        "priority_badge",
        "area_council",
        "item_display",
        "status_badge",
        "assigned_by",
        "assigned_at",
        "record_link",
    ]
    list_filter = [
        "status",
        "priority",
        "area_council__province",
        "area_council",
    ]
    search_fields = [
        "admin_notes",
        "area_council__name",
        "assigned_by__username",
    ]
    readonly_fields = [
        "assigned_by",
        "assigned_at",
        "completed_at",
        "item_display",
        "record_link",
    ]
    date_hierarchy = "assigned_at"
    ordering = ["-assigned_at"]

    fieldsets = [
        (
            "What to verify",
            {
                "fields": ["content_type", "object_id", "item_display"],
                "description": (
                    "Select the RAP damage estimate item that needs field verification. "
                    "Set <em>content_type</em> to the <strong>tabularitem</strong> row and "
                    "<em>object_id</em> to the TabularItem primary key."
                ),
            },
        ),
        (
            "Assignment details",
            {
                "fields": ["area_council", "priority", "admin_notes"],
            },
        ),
        (
            "Status & outcome",
            {
                "fields": ["status", "field_check_record", "record_link", "assigned_by", "assigned_at", "completed_at"],
            },
        ),
    ]

    # ── display helpers ──────────────────────────────────────────────────────

    @admin.display(description="Priority", ordering="priority")
    def priority_badge(self, obj):
        color = PRIORITY_COLORS.get(obj.priority, "#6b7280")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600">{}</span>',
            color,
            obj.get_priority_display(),
        )

    @admin.display(description="Status", ordering="status")
    def status_badge(self, obj):
        color = STATUS_COLORS.get(obj.status, "#6b7280")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:10px;font-size:11px">{}</span>',
            color,
            obj.get_status_display(),
        )

    @admin.display(description="RAP item")
    def item_display(self, obj):
        try:
            item = obj.content_object
            if item is None:
                return f"#{obj.object_id} (deleted)"
            ds = getattr(item, "dataset", None)
            if ds:
                return format_html(
                    "<strong>{}</strong><br/><small>{} — {} | value: {}</small>",
                    ds.name,
                    getattr(ds, "rap_sector_family", "") or ds.type,
                    getattr(item, "intensity", "") or "—",
                    getattr(item, "value", "—"),
                )
            return str(item)
        except Exception:
            return f"#{obj.object_id}"

    @admin.display(description="Field check record")
    def record_link(self, obj):
        if not obj.field_check_record_id:
            return "—"
        url = reverse("admin:field_check_fieldcheckrecord_change", args=[obj.field_check_record_id])
        return format_html('<a href="{}">Record #{}</a>', url, obj.field_check_record_id)

    # ── auto-set assigned_by on create ───────────────────────────────────────

    def save_model(self, request, obj, form, change):
        if not change:
            obj.assigned_by = request.user
        super().save_model(request, obj, form, change)

    # ── bulk actions ─────────────────────────────────────────────────────────

    actions = ["mark_skipped", "mark_pending"]

    @admin.action(description="Mark selected assignments as Skipped")
    def mark_skipped(self, request, queryset):
        updated = queryset.update(status=FieldCheckAssignment.STATUS_SKIPPED)
        self.message_user(request, f"{updated} assignment(s) marked as skipped.")

    @admin.action(description="Reset selected assignments to Pending")
    def mark_pending(self, request, queryset):
        updated = queryset.update(status=FieldCheckAssignment.STATUS_PENDING, completed_at=None)
        self.message_user(request, f"{updated} assignment(s) reset to pending.")


def field_check_dashboard(request):
    """Admin view: field check coverage and improvement over time."""
    from django.contrib.contenttypes.models import ContentType
    from vbos.datasets.models import (
        DatasetPublicationStatus,
        TabularItem,
        TabularDataset,
    )
    from django.db.models import OuterRef, Subquery
    from django.utils import timezone
    from datetime import timedelta

    tabular_ct = ContentType.objects.get_for_model(TabularItem)
    damage_types = ["estimated_damage", "estimate_financial_damage"]
    damage_datasets = TabularDataset.objects.filter(
        type__in=damage_types,
        publication_status=DatasetPublicationStatus.PUBLISHED,
    )
    item_ids = list(
        TabularItem.objects.filter(dataset__in=damage_datasets).values_list("id", flat=True)
    )

    latest_subq = (
        FieldCheckRecord.objects.filter(
            content_type=tabular_ct,
            object_id=OuterRef("pk"),
        )
        .order_by("-verified_at")
        .values("status")[:1]
    )
    items_with_latest = TabularItem.objects.filter(
        dataset__in=damage_datasets
    ).annotate(
        latest_status=Subquery(latest_subq)
    )

    model_count = sum(1 for i in items_with_latest if i.latest_status is None)
    verified_count = sum(1 for i in items_with_latest if i.latest_status == FieldCheckRecord.STATUS_VERIFIED)
    adjusted_count = sum(1 for i in items_with_latest if i.latest_status == FieldCheckRecord.STATUS_ADJUSTED)
    rejected_count = sum(1 for i in items_with_latest if i.latest_status == FieldCheckRecord.STATUS_REJECTED)

    total = model_count + verified_count + adjusted_count + rejected_count
    field_checked = verified_count + adjusted_count + rejected_count
    coverage_pct = (field_checked / total * 100) if total else 0

    # Weighted confidence: verified=100, adjusted=75, rejected=0, model=0
    weighted_score = verified_count * 100 + adjusted_count * 75
    confidence_pct = (weighted_score / total * 100) if total else 0

    now = timezone.now()
    weekly = []
    for i in range(7, -1, -1):
        week_end = now - timedelta(weeks=i)
        week_start = week_end - timedelta(weeks=1)
        count = FieldCheckRecord.objects.filter(
            content_type=tabular_ct,
            object_id__in=item_ids,
            verified_at__gte=week_start,
            verified_at__lt=week_end,
        ).count()
        weekly.append({"week": week_start.strftime("%Y-%m-%d"), "count": count})

    context = {
        "title": "Field Check Coverage",
        "total_items": total,
        "model_count": model_count,
        "verified_count": verified_count,
        "adjusted_count": adjusted_count,
        "rejected_count": rejected_count,
        "field_checked": field_checked,
        "coverage_percent": round(coverage_pct, 1),
        "confidence_percent": round(confidence_pct, 1),
        "weekly": weekly,
    }
    return render(request, "admin/field_check/dashboard.html", context)

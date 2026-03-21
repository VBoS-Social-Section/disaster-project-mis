"""
Admin dashboard callback: provides stats, charts, and context for the custom index page.
"""

import json
from datetime import timedelta

from django.contrib.admin.models import ADDITION, CHANGE, DELETION, LogEntry
from django.contrib.auth import get_user_model
from django.db.models.functions import TruncDate
from django.utils import timezone

from vbos.datasets.models import (
    Cluster,
    PMTilesDataset,
    RasterDataset,
    TabularDataset,
    TabularItem,
    VectorDataset,
    VectorItem,
)
from vbos.feedback.models import Feedback
from vbos.area_submissions.models import AreaDataSubmission
from vbos.field_check.models import FieldCheckRecord

User = get_user_model()


def dashboard_callback(request, context):
    """Add dashboard stats and enriched recent actions to admin index context."""
    # Stats (only count what user has permission to view)
    stats = {}

    if request.user.has_perm("datasets.view_cluster"):
        stats["clusters"] = Cluster.objects.count()
    if request.user.has_perm("datasets.view_pmtilesdataset"):
        stats["pmtiles_datasets"] = PMTilesDataset.objects.count()
    if request.user.has_perm("datasets.view_rasterdataset"):
        stats["raster_datasets"] = RasterDataset.objects.count()
    if request.user.has_perm("datasets.view_vectordataset"):
        stats["vector_datasets"] = VectorDataset.objects.count()
    if request.user.has_perm("datasets.view_vectoritem"):
        stats["vector_items"] = VectorItem.objects.count()
    if request.user.has_perm("datasets.view_tabulardataset"):
        stats["tabular_datasets"] = TabularDataset.objects.count()
    if request.user.has_perm("datasets.view_tabularitem"):
        stats["tabular_items"] = TabularItem.objects.count()
    if request.user.has_perm("users.view_user"):
        stats["users"] = User.objects.count()
    if request.user.has_perm("feedback.view_feedback"):
        stats["feedback"] = Feedback.objects.count()
    if request.user.has_perm("area_submissions.view_areadatasubmission"):
        stats["area_submissions"] = AreaDataSubmission.objects.count()
    if request.user.has_perm("field_check.view_fieldcheckrecord"):
        stats["field_checks"] = FieldCheckRecord.objects.count()

    context["dashboard_stats"] = stats

    # Admin UI mode banner (Disaster / Climate / Compare) — visual only, from query string
    mode = (request.GET.get("mode") or "disaster").lower()
    if mode not in ("disaster", "climate", "compare"):
        mode = "disaster"
    context["admin_mode"] = mode

    # Summary indicators
    total_datasets = (
        stats.get("vector_datasets", 0)
        + stats.get("pmtiles_datasets", 0)
        + stats.get("raster_datasets", 0)
        + stats.get("tabular_datasets", 0)
    )
    total_items = stats.get("vector_items", 0) + stats.get("tabular_items", 0)
    now = timezone.now()
    week_ago = now - timedelta(days=7)
    actions_this_week = LogEntry.objects.filter(
        user=request.user, action_time__gte=week_ago
    ).count()
    context["dashboard_summary"] = {
        "total_datasets": total_datasets,
        "total_items": total_items,
        "actions_this_week": actions_this_week,
    }

    # Activity chart: admin actions per day (last 14 days)
    activity_qs = (
        LogEntry.objects.filter(user=request.user)
        .annotate(day=TruncDate("action_time"))
        .values("day", "action_flag")
        .order_by("day")
    )
    days = [(now - timedelta(days=i)).date() for i in range(13, -1, -1)]
    add_counts = {d: 0 for d in days}
    change_counts = {d: 0 for d in days}
    delete_counts = {d: 0 for d in days}
    for row in activity_qs:
        if row["day"] in add_counts:
            if row["action_flag"] == ADDITION:
                add_counts[row["day"]] += 1
            elif row["action_flag"] == CHANGE:
                change_counts[row["day"]] += 1
            elif row["action_flag"] == DELETION:
                delete_counts[row["day"]] += 1
    context["activity_chart_data"] = json.dumps(
        {
            "labels": [d.strftime("%b %d") for d in days],
            "datasets": [
                {
                    "label": "Added",
                    "data": [add_counts[d] for d in days],
                    "backgroundColor": "rgba(34, 197, 94, 0.7)",
                    "borderColor": "rgb(34, 197, 94)",
                },
                {
                    "label": "Changed",
                    "data": [change_counts[d] for d in days],
                    "backgroundColor": "rgba(59, 130, 246, 0.7)",
                    "borderColor": "rgb(59, 130, 246)",
                },
                {
                    "label": "Deleted",
                    "data": [delete_counts[d] for d in days],
                    "backgroundColor": "rgba(239, 68, 68, 0.7)",
                    "borderColor": "rgb(239, 68, 68)",
                },
            ],
        }
    )
    context["activity_chart_options"] = json.dumps(
        {
            "scales": {
                "x": {"stacked": True},
                "y": {"stacked": True, "beginAtZero": True},
            },
            "plugins": {"legend": {"position": "bottom"}},
        }
    )

    # Dataset distribution pie chart
    ds_labels = []
    ds_data = []
    ds_colors = []
    if request.user.has_perm("datasets.view_vectordataset"):
        c = VectorDataset.objects.count()
        if c > 0:
            ds_labels.append("Vector")
            ds_data.append(c)
            ds_colors.append("rgba(59, 130, 246, 0.8)")
    if request.user.has_perm("datasets.view_pmtilesdataset"):
        c = PMTilesDataset.objects.count()
        if c > 0:
            ds_labels.append("PMTiles")
            ds_data.append(c)
            ds_colors.append("rgba(34, 197, 94, 0.8)")
    if request.user.has_perm("datasets.view_rasterdataset"):
        c = RasterDataset.objects.count()
        if c > 0:
            ds_labels.append("Raster")
            ds_data.append(c)
            ds_colors.append("rgba(234, 179, 8, 0.8)")
    if request.user.has_perm("datasets.view_tabulardataset"):
        c = TabularDataset.objects.count()
        if c > 0:
            ds_labels.append("Tabular")
            ds_data.append(c)
            ds_colors.append("rgba(168, 85, 247, 0.8)")
    if ds_labels:
        context["dataset_chart_data"] = json.dumps(
            {
                "labels": ds_labels,
                "datasets": [{"data": ds_data, "backgroundColor": ds_colors}],
            }
        )
    else:
        context["dataset_chart_data"] = None

    # Enriched recent actions (last 15, with change details)
    log_entries = (
        LogEntry.objects.filter(user=request.user)
        .select_related("content_type", "user")
        .order_by("-action_time")[:15]
    )

    enriched_log = []
    for entry in log_entries:
        change_detail = ""
        if entry.is_change and entry.change_message:
            # get_change_message() returns translated, human-readable summary
            try:
                change_detail = entry.get_change_message()
            except Exception:
                change_detail = str(entry.change_message)[:200] if entry.change_message else ""

        action_label = "Added" if entry.is_addition else "Changed" if entry.is_change else "Deleted"

        enriched_log.append(
            {
                "entry": entry,
                "action_label": action_label,
                "change_detail": change_detail,
                "action_class": "addlink" if entry.is_addition else "changelink" if entry.is_change else "deletelink",
            }
        )

    context["admin_log"] = enriched_log

    # RAP import summary (disaster-project-rap → MIS)
    try:
        from vbos.rap_import.models import RAPImportBatch

        latest_batch = (
            RAPImportBatch.objects.filter(status="complete").order_by("-imported_at").first()
        )
        pending_batches = RAPImportBatch.objects.filter(status="pending").count()
        context["rap_latest_batch"] = latest_batch
        context["rap_pending_count"] = pending_batches
        if latest_batch:
            context["rap_affected_provinces"] = latest_batch.provinces_affected or []
            context["rap_max_intensity"] = latest_batch.max_intensity
            context["rap_cyclone_name"] = latest_batch.cyclone_name
        else:
            context["rap_affected_provinces"] = []
            context["rap_max_intensity"] = None
            context["rap_cyclone_name"] = None
    except Exception:
        context["rap_latest_batch"] = None
        context["rap_pending_count"] = 0
        context["rap_affected_provinces"] = []
        context["rap_max_intensity"] = None
        context["rap_cyclone_name"] = None

    return context

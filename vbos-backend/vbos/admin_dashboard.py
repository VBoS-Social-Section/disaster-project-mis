"""
Custom DRMIS admin dashboard view.
"""
from django.contrib import admin
from django.http import HttpRequest
from django.shortcuts import render
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta


def dashboard_view(request: HttpRequest):
    from vbos.datasets.models import (
        PMTilesDataset, VectorDataset, RasterDataset,
        TabularDataset, VectorItem, TabularItem,
        Cluster, CycloneEvent, DatasetPublicationStatus,
    )
    from vbos.alerts.models import Alert
    from vbos.area_submissions.models import AreaDataSubmission
    from vbos.users.models import User
    from vbos.audit.models import AuditLog
    from vbos.rap_import.models import RAPImportBatch

    try:
        from vbos.climate.models import (
            ClimateRasterDataset, ClimatePMTilesDataset, ClimateVectorDataset,
        )
        climate_total = (
            ClimateRasterDataset.objects.count()
            + ClimatePMTilesDataset.objects.count()
            + ClimateVectorDataset.objects.count()
        )
    except Exception:
        climate_total = 0

    # Dataset counts
    pmtiles_count  = PMTilesDataset.objects.count()
    vector_count   = VectorDataset.objects.count()
    raster_count   = RasterDataset.objects.count()
    tabular_count  = TabularDataset.objects.count()
    total_datasets = pmtiles_count + vector_count + raster_count + tabular_count

    published_datasets = (
        PMTilesDataset.objects.filter(publication_status=DatasetPublicationStatus.PUBLISHED).count()
        + VectorDataset.objects.filter(publication_status=DatasetPublicationStatus.PUBLISHED).count()
        + RasterDataset.objects.filter(publication_status=DatasetPublicationStatus.PUBLISHED).count()
        + TabularDataset.objects.filter(publication_status=DatasetPublicationStatus.PUBLISHED).count()
    )
    draft_datasets = (
        PMTilesDataset.objects.filter(publication_status=DatasetPublicationStatus.DRAFT).count()
        + VectorDataset.objects.filter(publication_status=DatasetPublicationStatus.DRAFT).count()
        + RasterDataset.objects.filter(publication_status=DatasetPublicationStatus.DRAFT).count()
        + TabularDataset.objects.filter(publication_status=DatasetPublicationStatus.DRAFT).count()
    )

    dataset_breakdown = [
        {"label": "PMTiles",  "count": pmtiles_count,  "icon": "fas fa-map",          "url": "/admin/datasets/pmtilesdataset/",  "add_url": "/admin/datasets/pmtilesdataset/add/",  "color": "#4680ff"},
        {"label": "Vector",   "count": vector_count,   "icon": "fas fa-draw-polygon",  "url": "/admin/datasets/vectordataset/",   "add_url": "/admin/datasets/vectordataset/add/",   "color": "#17c964"},
        {"label": "Raster",   "count": raster_count,   "icon": "fas fa-image",         "url": "/admin/datasets/rasterdataset/",   "add_url": "/admin/datasets/rasterdataset/add/",   "color": "#f5a524"},
        {"label": "Tabular",  "count": tabular_count,  "icon": "fas fa-table",         "url": "/admin/datasets/tabulardataset/",  "add_url": "/admin/datasets/tabulardataset/add/",  "color": "#06b7db"},
    ]

    # Submissions
    pending_submissions = AreaDataSubmission.objects.filter(status=AreaDataSubmission.STATUS_SUBMITTED).count()
    approved_submissions = AreaDataSubmission.objects.filter(status=AreaDataSubmission.STATUS_APPROVED).count()
    rejected_submissions = AreaDataSubmission.objects.filter(status=AreaDataSubmission.STATUS_REJECTED).count()
    total_submissions    = AreaDataSubmission.objects.count()

    # Alerts
    active_alerts   = Alert.objects.filter(is_active=True).count()
    total_alerts    = Alert.objects.count()
    critical_alerts = Alert.objects.filter(is_active=True, severity="critical").count()
    high_alerts     = Alert.objects.filter(is_active=True, severity="high").count()

    # Users
    total_users  = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()

    # RAP
    total_rap = RAPImportBatch.objects.count()

    # Items
    vector_items  = VectorItem.objects.count()
    tabular_items = TabularItem.objects.count()

    # Cyclone Events & Clusters
    cyclone_events = CycloneEvent.objects.order_by("-season_year", "-id")[:5]
    total_clusters = Cluster.objects.count()

    # Recent audit log (distinct object changes, not per-field)
    recent_audits = (
        AuditLog.objects
        .select_related("user", "content_type")
        .order_by("-timestamp")[:12]
    )

    # Audit activity last 7 days (for sparkline data)
    seven_days_ago = timezone.now() - timedelta(days=6)
    audit_by_day = (
        AuditLog.objects
        .filter(timestamp__gte=seven_days_ago)
        .extra(select={"day": "date(timestamp)"})
        .values("day")
        .annotate(count=Count("id"))
        .order_by("day")
    )
    audit_days   = [str(r["day"]) for r in audit_by_day]
    audit_counts = [r["count"] for r in audit_by_day]

    context = {
        **admin.site.each_context(request),
        "title": "Dashboard",
        # KPI
        "total_datasets":       total_datasets,
        "published_datasets":   published_datasets,
        "draft_datasets":       draft_datasets,
        "pending_submissions":  pending_submissions,
        "approved_submissions": approved_submissions,
        "rejected_submissions": rejected_submissions,
        "total_submissions":    total_submissions,
        "active_alerts":        active_alerts,
        "critical_alerts":      critical_alerts,
        "high_alerts":          high_alerts,
        "total_alerts":         total_alerts,
        "total_users":          total_users,
        "active_users":         active_users,
        "total_rap":            total_rap,
        "vector_items":         vector_items,
        "tabular_items":        tabular_items,
        "cyclone_events":       cyclone_events,
        "total_clusters":       total_clusters,
        "climate_total":        climate_total,
        "dataset_breakdown":    dataset_breakdown,
        "recent_audits":        recent_audits,
        "audit_days_json":      audit_days,
        "audit_counts_json":    audit_counts,
    }
    return render(request, "admin/drmis_dashboard.html", context)

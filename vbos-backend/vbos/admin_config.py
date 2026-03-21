"""
Unfold admin helpers (badges, navigation, etc.). Import paths referenced from UNFOLD
settings must stay lazy where noted to avoid circular imports at startup.
"""

from __future__ import annotations

from typing import Any


def pending_rap_batches_badge(request):
    """Sidebar badge: count of RAP batches awaiting import."""
    try:
        from vbos.rap_import.models import RAPImportBatch

        count = RAPImportBatch.objects.filter(status="pending").count()
        return str(count) if count else None
    except Exception:
        return None


def get_navigation(request) -> list[dict[str, Any]]:
    """
    Unfold sidebar navigation (Disaster / RAP / Climate / Modules / Settings).
    Referenced from UNFOLD["SIDEBAR"]["navigation"].
    """
    return [
        {
            "title": "Dashboard",
            "separator": True,
            "collapsible": False,
            "items": [
                {"title": "Dashboard", "icon": "dashboard", "link": "/admin/"},
            ],
        },
        {
            "title": "Disaster",
            "icon": "warning",
            "separator": True,
            "collapsible": True,
            "items": [
                {"title": "Clusters", "link": "/admin/datasets/cluster/", "icon": "category"},
                {"title": "PMTiles Datasets", "link": "/admin/datasets/pmtilesdataset/", "icon": "map"},
                {"title": "Vector Datasets", "link": "/admin/datasets/vectordataset/", "icon": "layers"},
                {"title": "Vector Items", "link": "/admin/datasets/vectoritem/", "icon": "place"},
                {"title": "Raster Datasets", "link": "/admin/datasets/rasterdataset/", "icon": "image"},
                {"title": "Tabular Datasets", "link": "/admin/datasets/tabulardataset/", "icon": "table_chart"},
                {"title": "Tabular Items", "link": "/admin/datasets/tabularitem/", "icon": "grid_on"},
            ],
        },
        {
            "title": "RAP Pipeline",
            "separator": True,
            "collapsible": True,
            "items": [
                {
                    "title": "Upload RAP CSVs",
                    "icon": "upload_file",
                    "link": "/admin/rap-import/upload/",
                    "badge": "vbos.admin_config.pending_rap_batches_badge",
                },
                {
                    "title": "Import Batches",
                    "icon": "batch_prediction",
                    "link": "/admin/rap_import/rapimportbatch/",
                },
                {
                    "title": "Compare RAP batches",
                    "icon": "compare_arrows",
                    "link": "/admin/compare/event/",
                },
            ],
        },
        {
            "title": "Climate",
            "icon": "thermostat",
            "separator": True,
            "collapsible": True,
            "items": [
                {"title": "Climate Dashboard", "link": "/admin/climate/", "icon": "dashboard"},
                {"title": "Raster Datasets", "link": "/admin/climate/climaterasterdataset/", "icon": "image"},
                {"title": "PMTiles Datasets", "link": "/admin/climate/climatepmtilesdataset/", "icon": "map"},
                {"title": "Vector Datasets", "link": "/admin/climate/climatevectordataset/", "icon": "layers"},
                {"title": "Vector Items", "link": "/admin/climate/climatevectoritem/", "icon": "place"},
            ],
        },
        {
            "title": "Modules",
            "icon": "folder",
            "separator": True,
            "collapsible": True,
            "items": [
                {"title": "Land Accounts", "link": "/admin/land-accounts/", "icon": "landscape"},
                {"title": "Coastal Changes", "link": "/admin/coastal-changes/", "icon": "water"},
                {"title": "Area Administrators", "link": "/admin/area_submissions/areaadministrator/", "icon": "manage_accounts"},
                {"title": "Area Submissions", "link": "/admin/area_submissions/areadatasubmission/", "icon": "upload_file"},
                {"title": "Field Check", "link": "/admin/field-check/", "icon": "fact_check"},
                {"title": "Feedback", "link": "/admin/feedback/feedback/", "icon": "feedback"},
            ],
        },
        {
            "title": "Settings",
            "icon": "settings",
            "separator": True,
            "collapsible": True,
            "items": [
                {"title": "Users", "link": "/admin/users/user/", "icon": "people"},
                {"title": "Roles", "link": "/admin/users/role/", "icon": "admin_panel_settings"},
                {"title": "SMTP Settings", "link": "/admin/users/smtpsettings/", "icon": "email"},
                {"title": "Integration Sources", "link": "/admin/integrations/integrationsource/", "icon": "hub"},
                {"title": "API Keys", "link": "/admin/integrations/integrationapikey/", "icon": "key"},
                {"title": "External Data Sources", "link": "/admin/integrations/externaldatasource/", "icon": "cloud_sync"},
                {"title": "RAP Import Batches", "link": "/admin/rap_import/rapimportbatch/", "icon": "upload"},
                {"title": "RAP Import Files", "link": "/admin/rap_import/rapimportfile/", "icon": "description"},
                {"title": "Changelog", "link": "/admin/admin/logentry/", "icon": "history"},
                {"title": "Backup & Restore", "link": "/admin/maintenance/", "icon": "backup"},
                {"title": "Backup History", "link": "/admin/maintenance/backuplog/", "icon": "folder"},
            ],
        },
    ]

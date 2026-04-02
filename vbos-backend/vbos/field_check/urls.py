from django.urls import path

from . import views

urlpatterns = [
    # ── Deployment stats (command centre KPI) ─────────────────────────────────
    path("field-checks/", views.FieldTeamDeploymentStatsView.as_view(), name="field-checks-stats"),

    # ── Mobile auth & profile ─────────────────────────────────────────────────
    # GET  — returns logged-in user profile + area council assignments
    path("field-check/me/", views.MobileUserProfileView.as_view(), name="field-check-me"),

    # ── Assignments (admin creates; mobile reads) ──────────────────────────────
    # GET  — list assignments for the authenticated user's area council(s)
    # POST — staff only: create a new assignment
    path("field-check/assignments/", views.FieldCheckAssignmentListCreateView.as_view(), name="field-check-assignments"),
    # GET   — single assignment detail
    # PATCH — mobile marks in_progress / completed
    path("field-check/assignments/<int:pk>/", views.FieldCheckAssignmentDetailView.as_view(), name="field-check-assignment-detail"),

    # ── Assignable items browser (SPA admin page) ────────────────────────────
    # GET — list TabularItems from published damage datasets, with assignment status
    path("field-check/assignable-items/", views.AssignableTabularItemsView.as_view(), name="field-check-assignable-items"),

    # ── Field check records ───────────────────────────────────────────────────
    path("field-check/content-types/", views.FieldCheckContentTypesView.as_view(), name="field-check-content-types"),
    path("field-check/records/", views.FieldCheckRecordListCreateView.as_view(), name="field-check-records"),
    # Mobile rich-observation endpoint — maps observation to TabularItem(s)
    path("field-check/records/mobile/", views.MobileFieldCheckSubmitView.as_view(), name="field-check-records-mobile"),

    # ── Coverage & confidence ─────────────────────────────────────────────────
    path("field-check/coverage/", views.FieldCheckCoverageView.as_view(), name="field-check-coverage"),
    path("field-check/confidence-history/", views.ConfidenceHistoryView.as_view(), name="field-check-confidence-history"),
    path(
        "field-check/items/<str:content_type_app>/<str:content_type_model>/<int:object_id>/",
        views.FieldCheckItemConfidenceView.as_view(),
        name="field-check-item-confidence",
    ),
]

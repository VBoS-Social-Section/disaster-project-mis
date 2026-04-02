import json

from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.generics import ListCreateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from vbos.area_submissions.permissions import user_is_area_admin, user_can_manage_area

from .models import FieldCheckRecord, FieldCheckAssignment
from .permissions import IsAreaAdminOrStaff
from .serializers import (
    FieldCheckRecordSerializer,
    FieldCheckRecordCreateSerializer,
    FieldCheckAssignmentSerializer,
    FieldCheckAssignmentCreateSerializer,
)
from .mobile_serializers import MobileFieldCheckSubmitSerializer


class FieldCheckContentTypesView(APIView):
    """List allowed content types for field check (tabularitem, vectoritem). Area admins and staff only."""
    permission_classes = [IsAreaAdminOrStaff]

    def get(self, request):
        cts = ContentType.objects.filter(
            model__in=("tabularitem", "vectoritem")
        ).order_by("app_label", "model")
        return Response([
            {"id": ct.id, "app_label": ct.app_label, "model": ct.model}
            for ct in cts
        ])


def confidence_from_status(status_value):
    """Map record status to confidence level."""
    if status_value is None:
        return "model"
    if status_value == FieldCheckRecord.STATUS_VERIFIED:
        return "field_verified"
    if status_value == FieldCheckRecord.STATUS_ADJUSTED:
        return "field_adjusted"
    if status_value == FieldCheckRecord.STATUS_REJECTED:
        return "rejected"
    return "model"


def _item_belongs_to_area_admin(item, user):
    """Check if TabularItem or VectorItem belongs to an area the area admin can manage."""
    if not user_is_area_admin(user):
        return False
    province = getattr(item, "province", None)
    area_council = getattr(item, "area_council", None)
    if not province:
        return False
    return user_can_manage_area(user, province, area_council)


class FieldCheckRecordListCreateView(ListCreateAPIView):
    """
    List: staff see all; area admins see their own records.
    Create: area administrators only (they perform field checks). Item must be in their area.
    """
    permission_classes = [IsAreaAdminOrStaff]

    def get_queryset(self):
        qs = FieldCheckRecord.objects.select_related(
            "content_type", "verified_by"
        ).order_by("-verified_at")
        if not self.request.user.is_staff:
            return qs.filter(verified_by=self.request.user)
        return qs

    def get_serializer_class(self):
        if self.request.method == "POST":
            return FieldCheckRecordCreateSerializer
        return FieldCheckRecordSerializer

    def create(self, request, *args, **kwargs):
        serializer = FieldCheckRecordCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ct = serializer.validated_data["content_type"]
        object_id = serializer.validated_data["object_id"]
        if not request.user.is_staff:
            model_class = ct.model_class()
            if model_class is None:
                return Response(
                    {"detail": "Invalid content type."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            item = model_class.objects.filter(pk=object_id).first()
            if item is None:
                return Response(
                    {"detail": "Item not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            if not _item_belongs_to_area_admin(item, request.user):
                return Response(
                    {"detail": "You can only add field checks for items in your assigned areas."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        serializer.save(verified_by=request.user)
        return Response(
            FieldCheckRecordSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )


class FieldCheckCoverageView(APIView):
    """
    Summary of field check coverage for damage estimates.
    Returns counts by confidence level and improvement over time. Staff only.
    """
    permission_classes = [IsAreaAdminOrStaff]

    def get(self, request):
        if not request.user.is_staff:
            return Response(
                {"detail": "Staff only."},
                status=status.HTTP_403_FORBIDDEN,
            )

        from vbos.datasets.models import (
            DatasetPublicationStatus,
            TabularItem,
            TabularDataset,
        )

        # Damage estimate datasets only
        damage_types = ["estimated_damage", "estimate_financial_damage"]
        tabular_ct = ContentType.objects.get_for_model(TabularItem)
        damage_datasets = TabularDataset.objects.filter(
            type__in=damage_types,
            publication_status=DatasetPublicationStatus.PUBLISHED,
        )
        item_ids = list(
            TabularItem.objects.filter(dataset__in=damage_datasets).values_list("id", flat=True)
        )

        from django.db.models import OuterRef, Subquery

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

        model_count = 0
        verified_count = 0
        adjusted_count = 0
        rejected_count = 0
        for item in items_with_latest:
            s = item.latest_status
            if s is None:
                model_count += 1
            elif s == FieldCheckRecord.STATUS_VERIFIED:
                verified_count += 1
            elif s == FieldCheckRecord.STATUS_ADJUSTED:
                adjusted_count += 1
            elif s == FieldCheckRecord.STATUS_REJECTED:
                rejected_count += 1

        total = model_count + verified_count + adjusted_count + rejected_count
        field_checked = verified_count + adjusted_count + rejected_count
        coverage_pct = (field_checked / total * 100) if total else 0

        # Weighted confidence: verified=100, adjusted=75, rejected=0, model=0
        weighted_score = verified_count * 100 + adjusted_count * 75
        confidence_pct = (weighted_score / total * 100) if total else 0

        # Records per week (last 8 weeks, most recent last)
        from django.utils import timezone
        from datetime import timedelta

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

        return Response({
            "total_items": total,
            "model": model_count,
            "field_verified": verified_count,
            "field_adjusted": adjusted_count,
            "rejected": rejected_count,
            "field_checked": field_checked,
            "coverage_percent": round(coverage_pct, 1),
            "confidence_percent": round(confidence_pct, 1),
            "records_per_week": weekly,
        })


class FieldCheckItemConfidenceView(APIView):
    """
    Get confidence for a specific item (TabularItem or VectorItem).
    Returns latest record status and derived confidence. Area admins and staff.
    """
    permission_classes = [IsAreaAdminOrStaff]

    def get(self, request, content_type_app, content_type_model, object_id):
        ct = get_object_or_404(
            ContentType,
            app_label=content_type_app,
            model=content_type_model.lower(),
        )
        if ct.model not in ("tabularitem", "vectoritem"):
            return Response(
                {"detail": "Invalid content type."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        latest = (
            FieldCheckRecord.objects.filter(
                content_type=ct,
                object_id=object_id,
            )
            .order_by("-verified_at")
            .first()
        )
        if latest is None:
            return Response({
                "object_id": object_id,
                "content_type": f"{content_type_app}.{content_type_model}",
                "confidence": "model",
                "latest_record": None,
            })
        return Response({
            "object_id": object_id,
            "content_type": f"{content_type_app}.{content_type_model}",
            "confidence": confidence_from_status(latest.status),
            "latest_record": FieldCheckRecordSerializer(latest).data,
        })


class MobileFieldCheckSubmitView(APIView):
    """
    Accept a mobile app field-check submission and create FieldCheckRecord(s)
    against the matching TabularItem(s) for the given council × asset_type.

    POST /api/v1/field-check/records/mobile/
    Auth: Token <api_token>

    Matching logic:
    1. Find AreaCouncil by name (case-insensitive).
    2. Find published TabularDatasets with type in ('estimated_damage',
       'estimate_financial_damage') and rap_sector_family matching asset_type,
       for the most-recent non-archived CycloneEvent.
    3. For each matching TabularItem in that council, create a FieldCheckRecord
       with status derived from the mobile observation.
    4. Return the list of created record IDs plus a notes JSON blob.
    """

    permission_classes = [IsAuthenticated]

    # Map mobile asset_type → RAP sector_family values that may appear in TabularDataset
    SECTOR_FAMILY_MAP = {
        "education": ["education"],
        "health": ["health"],
        "shelter": ["shelter", "housing"],
        "telecom": ["telecom", "telecommunications"],
        "energy": ["energy", "power"],
        "wash": ["wash", "water"],
        "food_security": ["food_security", "food"],
        "logistics": ["logistics", "transport"],
    }

    @staticmethod
    def _derive_status_and_value(data):
        """Map mobile observation to DRMIS status + observed_value."""
        avg_damage = (
            data["roof_damage_percentage"] + data["wall_damage_percentage"]
        ) / 2
        functionality = data["functionality"]

        if functionality == "usable" and avg_damage <= 25:
            return FieldCheckRecord.STATUS_VERIFIED, None
        # Everything with meaningful damage or reduced functionality → adjusted
        return FieldCheckRecord.STATUS_ADJUSTED, round(avg_damage, 1)

    def post(self, request):
        serializer = MobileFieldCheckSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        from vbos.datasets.models import (
            AreaCouncil, TabularDataset, TabularItem,
            DatasetPublicationStatus, CycloneEvent,
        )

        # ── 1. Resolve area council ──────────────────────────────────────────
        councils = AreaCouncil.objects.filter(
            name__iexact=data["council"]
        )
        if not councils.exists():
            # Fallback: partial match
            councils = AreaCouncil.objects.filter(
                name__icontains=data["council"]
            )
        if not councils.exists():
            return Response(
                {
                    "detail": f"Area council '{data['council']}' not found in DRMIS. "
                              "Ensure council names match exactly.",
                    "mobile_id": data["mobile_id"],
                    "records_created": 0,
                    "items_matched": [],
                },
                status=status.HTTP_200_OK,  # 200 so mobile marks it attempted
            )
        council = councils.first()

        # ── 2. Find matching TabularDatasets ─────────────────────────────────
        sector_families = self.SECTOR_FAMILY_MAP.get(data["asset_type"], [data["asset_type"]])
        damage_types = ["estimated_damage", "estimate_financial_damage"]

        # Prefer datasets linked to the most recent active event
        latest_event = (
            CycloneEvent.objects.filter(is_archived=False)
            .order_by("-season_year", "-id")
            .first()
        )

        dataset_qs = TabularDataset.objects.filter(
            type__in=damage_types,
            publication_status=DatasetPublicationStatus.PUBLISHED,
            rap_sector_family__in=sector_families,
        )
        if latest_event:
            event_datasets = dataset_qs.filter(cyclone_event=latest_event)
            if event_datasets.exists():
                dataset_qs = event_datasets

        # ── 3. Find matching TabularItems ────────────────────────────────────
        items = TabularItem.objects.filter(
            dataset__in=dataset_qs,
            area_council=council,
        )

        if not items.exists():
            return Response(
                {
                    "detail": (
                        f"No RAP TabularItems found for council='{data['council']}' "
                        f"and sector='{data['asset_type']}'. "
                        "The RAP dataset may not yet be imported for this event."
                    ),
                    "mobile_id": data["mobile_id"],
                    "records_created": 0,
                    "items_matched": [],
                },
                status=status.HTTP_200_OK,
            )

        # ── 4. Derive status and build notes blob ────────────────────────────
        rec_status, observed_value = self._derive_status_and_value(data)

        notes_payload = {
            "mobile_id": data["mobile_id"],
            "asset_id": data["asset_id"],
            "asset_name": data["asset_name"],
            "roof": {
                "condition": data["roof_damage_condition"],
                "percentage": data["roof_damage_percentage"],
                "notes": data["roof_damage_notes"],
            },
            "wall": {
                "condition": data["wall_damage_condition"],
                "percentage": data["wall_damage_percentage"],
                "notes": data["wall_damage_notes"],
            },
            "functionality": data["functionality"],
            "priority": data["priority"],
            "immediate_needs": data["immediate_needs"],
            "assessor": {
                "name": data["assessor_name"],
                "id": data["assessor_id"],
                "team_lead": data["team_lead"],
            },
            "gps": {
                "lat": data["gps_latitude"],
                "lon": data["gps_longitude"],
                "accuracy": data["gps_accuracy"],
            },
            "weather": data["weather_conditions"],
            "access_issues": data["access_issues"],
            "additional_notes": data["notes"],
        }
        notes_str = json.dumps(notes_payload, ensure_ascii=False)

        tabular_ct = ContentType.objects.get_for_model(TabularItem)

        # ── 5. Create FieldCheckRecords ──────────────────────────────────────
        created = []
        for item in items:
            record = FieldCheckRecord.objects.create(
                content_type=tabular_ct,
                object_id=item.pk,
                status=rec_status,
                observed_value=observed_value,
                notes=notes_str,
                verified_by=request.user,
            )
            created.append({
                "record_id": record.pk,
                "tabular_item_id": item.pk,
                "dataset": item.dataset.name,
                "status": rec_status,
                "observed_value": observed_value,
            })

        return Response(
            {
                "mobile_id": data["mobile_id"],
                "records_created": len(created),
                "items_matched": created,
            },
            status=status.HTTP_201_CREATED,
        )


class ConfidenceHistoryView(APIView):
    """
    Time-series confidence snapshots per hazard event.
    GET /api/v1/field-check/confidence-history/?event=<slug>
    Returns daily snapshots ordered oldest-first (for charting).
    Staff only.
    """

    permission_classes = [IsAreaAdminOrStaff]

    def get(self, request):
        if not request.user.is_staff:
            return Response({"detail": "Staff only."}, status=status.HTTP_403_FORBIDDEN)

        from .models import ConfidenceSnapshot
        from vbos.datasets.models import CycloneEvent

        event_slug = request.query_params.get("event")
        qs = ConfidenceSnapshot.objects.all()
        if event_slug:
            event = get_object_or_404(CycloneEvent, slug=event_slug)
            qs = qs.filter(event=event)

        qs = qs.order_by("snapshot_date")[:90]  # max 90 days

        return Response([
            {
                "date": s.snapshot_date.isoformat(),
                "event": s.event.slug,
                "total_items": s.total_items,
                "model": s.model_count,
                "verified": s.verified_count,
                "adjusted": s.adjusted_count,
                "rejected": s.rejected_count,
                "coverage_pct": s.coverage_pct,
                "confidence_pct": s.confidence_pct,
            }
            for s in qs
        ])


class MobileUserProfileView(APIView):
    """
    GET /api/v1/field-check/me/
    Returns the authenticated user's profile including their assigned area councils.
    Used by the mobile app on login to determine which assignments to show.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # Resolve area councils from the area_submissions permissions helper
        from vbos.area_submissions.permissions import user_is_area_admin
        from vbos.datasets.models import AreaCouncil

        area_councils = []
        provinces = []

        if user_is_area_admin(user):
            # Get councils this area admin can manage (from their user profile/groups)
            # The exact mechanism depends on how area admins are configured in vbos.auth_config
            # Fall back to all councils where they have assignments
            assigned_councils = (
                FieldCheckAssignment.objects.filter(
                    assigned_by=user
                ).values_list("area_council__name", flat=True).distinct()
            )
            # Also check via the area_submissions permission model
            all_councils = AreaCouncil.objects.all().select_related("province")
            for council in all_councils:
                if user_is_area_admin(user) and user.groups.filter(
                    name__icontains=council.name
                ).exists():
                    area_councils.append(council.name)
                    if council.province.name not in provinces:
                        provinces.append(council.province.name)

            # If no groups matched, use assignment-derived councils
            if not area_councils:
                area_councils = list(assigned_councils)

        return Response({
            "id": user.pk,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_staff": user.is_staff,
            "area_councils": area_councils,
            "provinces": provinces,
        })


class FieldCheckAssignmentListCreateView(APIView):
    """
    GET  /api/v1/field-check/assignments/
        - Staff: all assignments (optionally filter by ?council=<name> or ?status=)
        - Area admin: only assignments for their area councils
        - Mobile app calls this on login to populate the work list

    POST /api/v1/field-check/assignments/
        - Staff only: create a new assignment
    """

    permission_classes = [IsAreaAdminOrStaff]

    def get(self, request):
        from vbos.area_submissions.permissions import user_is_area_admin
        from vbos.datasets.models import AreaCouncil

        qs = FieldCheckAssignment.objects.select_related(
            "area_council", "area_council__province", "content_type"
        ).prefetch_related("content_object")

        if not request.user.is_staff:
            # Area admins: filter to their councils
            manageable_councils = [
                c for c in AreaCouncil.objects.all()
                if user_is_area_admin(request.user)
            ]
            qs = qs.filter(area_council__in=manageable_councils)

        # Optional filters
        council_filter = request.query_params.get("council")
        if council_filter:
            qs = qs.filter(area_council__name__icontains=council_filter)

        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        serializer = FieldCheckAssignmentSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_staff:
            return Response(
                {"detail": "Only staff can create assignments."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = FieldCheckAssignmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        assignment = serializer.save(assigned_by=request.user)
        return Response(
            FieldCheckAssignmentSerializer(assignment).data,
            status=status.HTTP_201_CREATED,
        )


class FieldCheckAssignmentDetailView(APIView):
    """
    GET   /api/v1/field-check/assignments/<pk>/  — get single assignment
    PATCH /api/v1/field-check/assignments/<pk>/  — update status (mobile marks in_progress / completed)
    """

    permission_classes = [IsAreaAdminOrStaff]

    def _get_assignment(self, pk):
        from django.shortcuts import get_object_or_404
        return get_object_or_404(FieldCheckAssignment, pk=pk)

    def get(self, request, pk):
        assignment = self._get_assignment(pk)
        return Response(FieldCheckAssignmentSerializer(assignment).data)

    def patch(self, request, pk):
        assignment = self._get_assignment(pk)
        new_status = request.data.get("status")
        allowed = [s[0] for s in FieldCheckAssignment.STATUS_CHOICES]
        if new_status and new_status not in allowed:
            return Response(
                {"detail": f"Invalid status. Choose from: {allowed}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if new_status:
            assignment.status = new_status
            if new_status == FieldCheckAssignment.STATUS_COMPLETED:
                assignment.completed_at = timezone.now()
            assignment.save(update_fields=["status", "completed_at"])
        return Response(FieldCheckAssignmentSerializer(assignment).data)


class AssignableTabularItemsView(APIView):
    """
    GET /api/v1/field-check/assignable-items/
    Staff only. Returns TabularItems from published damage-estimate datasets,
    enriched with council, province, event, and sector info — used by the
    DRMIS frontend when creating new field-check assignments.

    Optional query params:
      ?event=<slug>       — filter by cyclone event
      ?sector=<family>    — filter by rap_sector_family
      ?council=<name>     — filter by area council name
    """

    permission_classes = [IsAreaAdminOrStaff]

    def get(self, request):
        if not request.user.is_staff:
            return Response({"detail": "Staff only."}, status=status.HTTP_403_FORBIDDEN)

        from vbos.datasets.models import (
            TabularDataset, TabularItem,
            DatasetPublicationStatus, CycloneEvent,
        )
        from django.contrib.contenttypes.models import ContentType

        damage_types = ["estimated_damage", "estimate_financial_damage"]
        dataset_qs = TabularDataset.objects.filter(
            type__in=damage_types,
            publication_status=DatasetPublicationStatus.PUBLISHED,
        ).select_related("cyclone_event")

        event_slug = request.query_params.get("event")
        if event_slug:
            dataset_qs = dataset_qs.filter(cyclone_event__slug=event_slug)

        sector = request.query_params.get("sector")
        if sector:
            dataset_qs = dataset_qs.filter(rap_sector_family__icontains=sector)

        tabular_ct = ContentType.objects.get_for_model(TabularItem)
        item_qs = TabularItem.objects.filter(
            dataset__in=dataset_qs
        ).select_related(
            "dataset", "dataset__cyclone_event", "area_council", "area_council__province"
        )

        council_filter = request.query_params.get("council")
        if council_filter:
            item_qs = item_qs.filter(area_council__name__icontains=council_filter)

        # Exclude items that already have a pending/in_progress assignment
        already_assigned_ids = set(
            FieldCheckAssignment.objects.filter(
                content_type=tabular_ct,
                status__in=[FieldCheckAssignment.STATUS_PENDING, FieldCheckAssignment.STATUS_IN_PROGRESS],
            ).values_list("object_id", flat=True)
        )

        results = []
        for item in item_qs:
            ds = item.dataset
            event = ds.cyclone_event
            council = item.area_council
            results.append({
                "content_type_id": tabular_ct.id,
                "object_id": item.pk,
                "dataset_id": ds.pk,
                "dataset_name": ds.name,
                "dataset_type": ds.type,
                "sector_family": ds.rap_sector_family or "",
                "event_name": event.name if event else "",
                "event_slug": event.slug if event else "",
                "council_id": council.pk if council else None,
                "council_name": council.name if council else "",
                "province_name": council.province.name if council and council.province else "",
                "value": getattr(item, "value", None),
                "intensity": getattr(item, "intensity", "") or "",
                "already_assigned": item.pk in already_assigned_ids,
            })

        return Response(results)


class FieldTeamDeploymentStatsView(APIView):
    """
    Summary endpoint for Command Centre KPI.

    GET /api/v1/field-checks/?status=active&count=true
      - status=active: users who submitted field checks in last 24h
      - count=true: returns compact {"count": <int>}

    Supported statuses:
      - active
      - verified / adjusted / rejected
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        status_value = (request.query_params.get("status") or "").strip().lower()
        count_only = (request.query_params.get("count") or "").strip().lower() == "true"
        qs = FieldCheckRecord.objects.all()

        if status_value == "active":
            # "Deployed" approximated as users with field activity in the last 24 hours.
            since = timezone.now() - timezone.timedelta(hours=24)
            qs = qs.filter(verified_at__gte=since)
            count_value = qs.values("verified_by").distinct().count()
            if count_only:
                return Response({"count": count_value})
            return Response(
                {
                    "status": "active",
                    "window_hours": 24,
                    "count": count_value,
                }
            )

        if status_value in {
            FieldCheckRecord.STATUS_VERIFIED,
            FieldCheckRecord.STATUS_ADJUSTED,
            FieldCheckRecord.STATUS_REJECTED,
        }:
            qs = qs.filter(status=status_value)
        elif status_value:
            return Response(
                {
                    "detail": "Unsupported status. Use one of: active, verified, adjusted, rejected."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        count_value = qs.count()
        if count_only:
            return Response({"count": count_value})
        return Response(
            {
                "status": status_value or "all",
                "count": count_value,
            }
        )

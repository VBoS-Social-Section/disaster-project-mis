from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers

from .models import FieldCheckRecord, FieldCheckAssignment


class FieldCheckRecordSerializer(serializers.ModelSerializer):
    content_type_name = serializers.SerializerMethodField()
    verified_by_username = serializers.CharField(source="verified_by.username", read_only=True)

    class Meta:
        model = FieldCheckRecord
        fields = [
            "id",
            "content_type",
            "object_id",
            "content_type_name",
            "status",
            "observed_value",
            "notes",
            "verified_by",
            "verified_by_username",
            "verified_at",
        ]
        read_only_fields = ["verified_by", "verified_at"]

    def get_content_type_name(self, obj):
        return f"{obj.content_type.app_label}.{obj.content_type.model}"

    def validate(self, attrs):
        if attrs["status"] == FieldCheckRecord.STATUS_ADJUSTED and attrs.get("observed_value") is None:
            raise serializers.ValidationError(
                {"observed_value": "Required when status is adjusted."}
            )
        if attrs["status"] == FieldCheckRecord.STATUS_REJECTED and not attrs.get("notes", "").strip():
            raise serializers.ValidationError({"notes": "Required when status is rejected."})
        return attrs


class FieldCheckRecordCreateSerializer(serializers.ModelSerializer):
    """Create a field check record. content_type = ContentType pk (use GET /field-check/content-types/ to list)."""
    content_type = serializers.PrimaryKeyRelatedField(
        queryset=ContentType.objects.filter(model__in=("tabularitem", "vectoritem")),
        required=True,
    )

    class Meta:
        model = FieldCheckRecord
        fields = [
            "content_type",
            "object_id",
            "status",
            "observed_value",
            "notes",
        ]

    def validate(self, attrs):
        if attrs["status"] == FieldCheckRecord.STATUS_ADJUSTED and attrs.get("observed_value") is None:
            raise serializers.ValidationError(
                {"observed_value": "Required when status is adjusted."}
            )
        if attrs["status"] == FieldCheckRecord.STATUS_REJECTED and not attrs.get("notes", "").strip():
            raise serializers.ValidationError({"notes": "Required when status is rejected."})
        return attrs


class FieldCheckAssignmentSerializer(serializers.ModelSerializer):
    """
    Read serializer for mobile app consumption.
    Enriches the assignment with context from the linked TabularItem.
    """
    council_name = serializers.CharField(source="area_council.name", read_only=True)
    province_name = serializers.CharField(source="area_council.province.name", read_only=True)
    tabular_item_id = serializers.SerializerMethodField()
    dataset_name = serializers.SerializerMethodField()
    sector_family = serializers.SerializerMethodField()
    estimated_value = serializers.SerializerMethodField()
    intensity = serializers.SerializerMethodField()
    event_name = serializers.SerializerMethodField()
    event_slug = serializers.SerializerMethodField()

    class Meta:
        model = FieldCheckAssignment
        fields = [
            "id", "tabular_item_id", "dataset_name", "sector_family",
            "council_name", "province_name", "priority", "admin_notes",
            "status", "estimated_value", "intensity", "event_name",
            "event_slug", "assigned_at",
        ]

    def _get_item(self, obj):
        if not hasattr(obj, "_cached_item"):
            try:
                obj._cached_item = obj.content_object
            except Exception:
                obj._cached_item = None
        return obj._cached_item

    def get_tabular_item_id(self, obj): return obj.object_id
    def get_dataset_name(self, obj):
        item = self._get_item(obj)
        return item.dataset.name if item and hasattr(item, "dataset") else ""
    def get_sector_family(self, obj):
        item = self._get_item(obj)
        return (item.dataset.rap_sector_family or "") if item and hasattr(item, "dataset") else ""
    def get_estimated_value(self, obj):
        item = self._get_item(obj)
        return item.value if item and hasattr(item, "value") else None
    def get_intensity(self, obj):
        item = self._get_item(obj)
        return item.intensity if item and hasattr(item, "intensity") else None
    def get_event_name(self, obj):
        item = self._get_item(obj)
        if item and hasattr(item, "dataset") and item.dataset.cyclone_event:
            return item.dataset.cyclone_event.name
        return ""
    def get_event_slug(self, obj):
        item = self._get_item(obj)
        if item and hasattr(item, "dataset") and item.dataset.cyclone_event:
            return item.dataset.cyclone_event.slug
        return ""


class FieldCheckAssignmentCreateSerializer(serializers.ModelSerializer):
    """Staff-only create/update serializer."""
    class Meta:
        model = FieldCheckAssignment
        fields = ["content_type", "object_id", "area_council", "priority", "admin_notes"]

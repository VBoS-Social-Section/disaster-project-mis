from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer

from .models import (
    AreaCouncil,
    Cluster,
    PMTilesDataset,
    Province,
    RasterDataset,
    TabularDataset,
    TabularItem,
    VectorDataset,
    VectorItem,
)


class ClusterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cluster
        fields = ["id", "name"]


class ProvinceSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Province
        geo_field = "geometry"
        fields = "__all__"


class AreaCouncilSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = AreaCouncil
        geo_field = "geometry"
        fields = "__all__"


class RasterDatasetSerializer(serializers.ModelSerializer):
    cluster = serializers.SerializerMethodField()
    created_by_id = serializers.IntegerField(read_only=True, allow_null=True)
    updated_by_id = serializers.IntegerField(read_only=True, allow_null=True)

    def get_cluster(self, obj):
        return obj.cluster.name if obj.cluster else None

    class Meta:
        model = RasterDataset
        fields = [
            "id",
            "name",
            "description",
            "created",
            "updated",
            "cluster",
            "type",
            "source",
            "filename_id",
            "titiler_url_params",
            "is_land_cover",
            "precomputed_tile_url",
            "publication_status",
            "published_at",
            "published_by_id",
            "created_by_id",
            "updated_by_id",
        ]


class VectorDatasetSerializer(serializers.ModelSerializer):
    cluster = serializers.ReadOnlyField(source="cluster.name")
    created_by_id = serializers.IntegerField(read_only=True, allow_null=True)
    updated_by_id = serializers.IntegerField(read_only=True, allow_null=True)

    class Meta:
        model = VectorDataset
        fields = [
            "id",
            "name",
            "description",
            "created",
            "updated",
            "cluster",
            "type",
            "source",
            "icon",
            "color",
            "cyclone_name",
            "climate_module",
            "climate_modules",
            "publication_status",
            "published_at",
            "published_by_id",
            "created_by_id",
            "updated_by_id",
        ]


class PMTilesDatasetSerializer(serializers.ModelSerializer):
    cluster = serializers.ReadOnlyField(source="cluster.name")
    created_by_id = serializers.IntegerField(read_only=True, allow_null=True)
    updated_by_id = serializers.IntegerField(read_only=True, allow_null=True)

    class Meta:
        model = PMTilesDataset
        fields = [
            "id",
            "name",
            "description",
            "created",
            "updated",
            "cluster",
            "type",
            "source",
            "url",
            "source_layer",
            "cyclone_name",
            "climate_module",
            "climate_modules",
            "publication_status",
            "published_at",
            "published_by_id",
            "created_by_id",
            "updated_by_id",
        ]


class VectorItemSerializer(GeoFeatureModelSerializer):
    province = serializers.CharField(
        source="province.name", read_only=True, allow_null=True
    )
    area_council = serializers.CharField(
        source="area_council.name", read_only=True, allow_null=True
    )

    class Meta:
        model = VectorItem
        geo_field = "geometry"
        id_field = "id"
        fields = [
            "id",
            "name",
            "attribute",
            "province",
            "area_council",
        ]

    def to_representation(self, instance):
        """Ensure id in properties; merge metadata (Intensity, intensity_color, etc.) for map styling."""
        data = super().to_representation(instance)
        if "properties" in data and "id" not in data.get("properties", {}):
            data["properties"]["id"] = instance.id
        if "id" not in data:
            data["id"] = instance.id
        if instance.metadata:
            data["properties"].update(instance.metadata)
        return data


class TabularDatasetSerializer(serializers.ModelSerializer):
    cluster = serializers.ReadOnlyField(source="cluster.name")
    created_by_id = serializers.IntegerField(read_only=True, allow_null=True)
    updated_by_id = serializers.IntegerField(read_only=True, allow_null=True)

    class Meta:
        model = TabularDataset
        fields = [
            "id",
            "name",
            "description",
            "created",
            "updated",
            "cluster",
            "type",
            "source",
            "unit",
            "publication_status",
            "published_at",
            "published_by_id",
            "created_by_id",
            "updated_by_id",
        ]


class TabularItemSerializer(serializers.ModelSerializer):
    province = serializers.ReadOnlyField(source="province.name")
    area_council = serializers.ReadOnlyField(source="area_council.name")

    class Meta:
        model = TabularItem
        fields = [
            "id",
            "attribute",
            "date",
            "value",
            "province",
            "area_council",
            "metadata",
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        # Extract the data field and merge it with the top level fields
        data_content = representation.pop("metadata", {})

        return {**representation, **data_content}


class TabularItemExcelSerializer(serializers.ModelSerializer):
    province = serializers.ReadOnlyField(source="province.name")
    area_council = serializers.ReadOnlyField(source="area_council.name")

    # Dynamically add fields based on all possible keys in the data
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Get all possible keys from the queryset
        if self.context.get("view"):
            queryset = self.context["view"].get_queryset()
            all_keys = set()
            for item in queryset:
                if item.metadata and isinstance(item.metadata, dict):
                    all_keys.update(item.metadata.keys())

            # Create a field for each key
            for key in all_keys:
                self.fields[key] = serializers.CharField(
                    source=f"metadata.{key}",
                    required=False,
                    allow_blank=True,
                    default="",
                )

    class Meta:
        model = TabularItem
        fields = [
            "id",
            "attribute",
            "date",
            "value",
            "province",
            "area_council",
        ]

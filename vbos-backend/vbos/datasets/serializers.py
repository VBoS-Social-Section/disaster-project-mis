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
    cluster = serializers.ReadOnlyField(source="cluster.name")

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
        ]


class VectorDatasetSerializer(serializers.ModelSerializer):
    cluster = serializers.ReadOnlyField(source="cluster.name")

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
        ]


class PMTilesDatasetSerializer(serializers.ModelSerializer):
    cluster = serializers.ReadOnlyField(source="cluster.name")

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
        fields = [
            "id",
            "name",
            "ref",
            "attribute",
            "province",
            "area_council",
            "metadata",
        ]


class TabularDatasetSerializer(serializers.ModelSerializer):
    cluster = serializers.ReadOnlyField(source="cluster.name")

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

import django_filters.rest_framework
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from drf_excel.mixins import XLSXFileMixin
from drf_excel.renderers import XLSXRenderer
from django.contrib.gis.geos import Point
from rest_framework import status
from rest_framework.generics import DestroyAPIView, ListAPIView, ListCreateAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_gis.filters import InBBoxFilter

from vbos.datasets.filters import (
    PMTilesDatasetFilter,
    RasterDatasetFilter,
    TabularDatasetFilter,
    TabularItemFilter,
    VectorDatasetFilter,
    VectorItemFilter,
)

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
from .pagination import (
    DataResultsSetPagination,
    DatasetListPagination,
    GeoJsonPagination,
    StandardResultsSetPagination,
)
from .serializers import (
    AreaCouncilSerializer,
    ClusterSerializer,
    PMTilesDatasetSerializer,
    ProvinceSerializer,
    RasterDatasetSerializer,
    TabularDatasetSerializer,
    TabularItemExcelSerializer,
    TabularItemSerializer,
    VectorDatasetSerializer,
    VectorItemSerializer,
)


# Driver overlay names: fetched by name across all clusters (e.g. Roads in Logistics)
DRIVER_DATASET_NAMES = ["Population growth", "Roads", "Urban expansion"]

# Disaster overlay names: fetched by name across all clusters.
# Frontend lists all; disabled until admin uploads matching dataset.
DISASTER_DATASET_NAMES = [
    "Cyclone Intensity",
    "Volcano",
    "Flood",
    "Earthquake",
    "Tsunami",
    "Landslide",
    "Drought",
    "Wildfire",
]

class ClusterDatasetsView(APIView):
    """Single endpoint returning all dataset types for a cluster in one response.
    No cache so new datasets (e.g. Water Sources) appear immediately after admin adds them.

    Special case: cluster=Drivers fetches datasets by name (Roads, Population growth,
    Urban expansion) from ANY cluster, so Roads in Logistics appears without duplication.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cluster_name = request.query_params.get("cluster")
        scenario = request.query_params.get("scenario", "").lower()  # "disaster" or "climate"

        if not cluster_name:
            return Response(
                {"detail": "Missing required 'cluster' query parameter"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Filter vector/pmtiles by scenario: Disaster = no climate; Climate = by cluster
        def filter_by_scenario(qs, cluster_param=None):
            from django.db.models import Q
            if scenario == "disaster":
                # Exclude datasets that have any climate module
                return qs.exclude(
                    Q(climate_module__in=["land_accounts", "coastal_changes"])
                    | ~Q(climate_modules=[])
                )
            if scenario == "climate":
                cn = (cluster_param or cluster_name or "").lower().replace(" ", "_")
                if cn in ("drivers", "disaster"):
                    # Drivers: all climate datasets
                    return qs.filter(
                        Q(climate_module__in=["land_accounts", "coastal_changes"])
                        | ~Q(climate_modules=[])
                    )
                # Land Accounts, Coastal Changes, etc.: filter by module
                return qs.filter(
                    Q(climate_modules__contains=[cn]) | Q(climate_module=cn)
                )
            return qs

        if cluster_name.lower() == "drivers":
            # Drivers overlay: Climate mode — fetch by name across ALL clusters
            from django.db.models import Q
            name_q = Q()
            for n in DRIVER_DATASET_NAMES:
                name_q |= Q(name__icontains=n)
            tabular_qs = TabularDataset.objects.filter(name_q)
            raster_qs = RasterDataset.objects.filter(name_q)
            vector_qs = filter_by_scenario(VectorDataset.objects.filter(name_q), cluster_param=cluster_name)
            pmtiles_qs = filter_by_scenario(PMTilesDataset.objects.filter(name_q), cluster_param=cluster_name)
            tabular = TabularDatasetSerializer(tabular_qs, many=True).data
            raster = RasterDatasetSerializer(raster_qs, many=True).data
            vector = VectorDatasetSerializer(vector_qs, many=True).data
            pmtiles = PMTilesDatasetSerializer(pmtiles_qs, many=True).data
        elif cluster_name.lower() == "disaster":
            # Disaster overlay: Disaster mode — fetch by name across ALL clusters
            from django.db.models import Q
            name_q = Q()
            for n in DISASTER_DATASET_NAMES:
                name_q |= Q(name__icontains=n)
            raster_qs = RasterDataset.objects.filter(name_q)
            vector_qs = filter_by_scenario(VectorDataset.objects.filter(name_q), cluster_param=cluster_name)
            pmtiles_qs = filter_by_scenario(PMTilesDataset.objects.filter(name_q), cluster_param=cluster_name)
            tabular = []
            raster = RasterDatasetSerializer(raster_qs, many=True).data
            vector = VectorDatasetSerializer(vector_qs, many=True).data
            pmtiles = PMTilesDatasetSerializer(pmtiles_qs, many=True).data
        elif cluster_name.lower() in ("land accounts", "coastal changes"):
            # Climate modules: filter by climate_modules or legacy climate_module
            from django.db.models import Q
            module = cluster_name.lower().replace(" ", "_")
            mod_filter = Q(climate_modules__contains=[module]) | Q(climate_module=module)
            base_vector = VectorDataset.objects.filter(mod_filter)
            base_pmtiles = PMTilesDataset.objects.filter(mod_filter)
            tabular = []
            # Land cover raster only in Land Use/Land Cover (Land Accounts); exclude from Coastal changes
            raster_qs = RasterDataset.objects.all()
            if cluster_name.lower() == "coastal changes":
                raster_qs = raster_qs.filter(is_land_cover=False)
            raster = RasterDatasetSerializer(raster_qs, many=True).data
            vector = VectorDatasetSerializer(base_vector, many=True).data
            pmtiles = PMTilesDatasetSerializer(base_pmtiles, many=True).data
        else:
            tabular_ids = list(
                TabularDataset.objects.filter(
                    cluster__name__iexact=cluster_name
                ).values_list("id", flat=True)
            )
            tabular = TabularDatasetSerializer(
                TabularDataset.objects.filter(id__in=tabular_ids), many=True
            ).data
            # Rasters are Climate-mode only: return all rasters for every cluster
            raster = RasterDatasetSerializer(
                RasterDataset.objects.all(),
                many=True,
            ).data
            base_vector = VectorDataset.objects.filter(cluster__name__iexact=cluster_name)
            base_pmtiles = PMTilesDataset.objects.filter(cluster__name__iexact=cluster_name)
            vector = VectorDatasetSerializer(
                filter_by_scenario(base_vector, cluster_param=cluster_name),
                many=True,
            ).data
            pmtiles = PMTilesDatasetSerializer(
                filter_by_scenario(base_pmtiles, cluster_param=cluster_name),
                many=True,
            ).data

        return Response({
            "tabular": tabular,
            "raster": raster,
            "vector": vector,
            "pmtiles": pmtiles,
        })


@method_decorator(cache_page(60 * 15), name="dispatch")  # 15 min cache
class ClusterListView(ListAPIView):
    queryset = Cluster.objects.all().order_by("order")
    serializer_class = ClusterSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def finalize_response(self, request, response, *args, **kwargs):
        # Prevent browser from caching so admin changes (e.g. cluster add/delete) show after clear_cache
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "no-store, must-revalidate"
        return response


@method_decorator(cache_page(60 * 15), name="dispatch")  # 15 min cache
class ProvinceListView(ListAPIView):
    queryset = Province.objects.all()
    serializer_class = ProvinceSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = GeoJsonPagination


@method_decorator(cache_page(60 * 15), name="dispatch")  # 15 min cache
class AreaCouncilListView(ListAPIView):
    serializer_class = AreaCouncilSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = GeoJsonPagination

    def get_queryset(self):
        return AreaCouncil.objects.filter(
            province__name__iexact=self.kwargs.get("province")
        )


@method_decorator(cache_page(60 * 15), name="dispatch")  # 15 min cache
class RasterDatasetListView(ListAPIView):
    queryset = RasterDataset.objects.all()
    serializer_class = RasterDatasetSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = DatasetListPagination
    filterset_class = RasterDatasetFilter


class RasterDatasetDetailView(RetrieveAPIView):
    queryset = RasterDataset.objects.all()
    serializer_class = RasterDatasetSerializer
    permission_classes = [IsAuthenticated]


@method_decorator(cache_page(60 * 15), name="dispatch")  # 15 min cache
class PMTilesDatasetListView(ListAPIView):
    queryset = PMTilesDataset.objects.all()
    serializer_class = PMTilesDatasetSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = DatasetListPagination
    filterset_class = PMTilesDatasetFilter


class PMTilesDatasetDetailView(RetrieveAPIView):
    queryset = PMTilesDataset.objects.all()
    serializer_class = PMTilesDatasetSerializer
    permission_classes = [IsAuthenticated]


class PMTilesIntensityView(APIView):
    """Return cyclone intensity data for a PMTiles dataset, filtered by province/area_council.
    Requires intensity_data JSONField to be populated (from RAP GeoJSON export)."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            dataset = PMTilesDataset.objects.get(pk=pk)
        except PMTilesDataset.DoesNotExist:
            return Response(
                {"detail": "PMTiles dataset not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        intensity_data = dataset.intensity_data or []
        if not isinstance(intensity_data, list):
            return Response(
                {"type": "FeatureCollection", "features": []},
                status=status.HTTP_200_OK,
            )
        provinces = [p.strip().lower() for p in request.query_params.getlist("province") if p]
        area_councils = [a.strip().lower() for a in request.query_params.getlist("area_council") if a]
        filtered = []
        for item in intensity_data:
            if not isinstance(item, dict):
                continue
            ac = (item.get("acname") or item.get("area_council") or item.get("name") or "").strip()
            prov = (item.get("Province") or item.get("province") or "").strip()
            ac_lower = ac.lower()
            prov_lower = prov.lower()
            match_province = not provinces or prov_lower in provinces
            match_ac = not area_councils or ac_lower in area_councils
            if match_province and match_ac:
                filtered.append({
                    "type": "Feature",
                    "properties": {
                        "acname": ac,
                        "area_council": ac,
                        "Province": prov,
                        "province": prov,
                        "Intensity": item.get("Intensity") or item.get("intensity") or "",
                        "intensity": item.get("Intensity") or item.get("intensity") or "",
                        "intensity_color": item.get("intensity_color") or "",
                    },
                    "geometry": None,
                })
        return Response({
            "type": "FeatureCollection",
            "features": filtered,
        })


@method_decorator(cache_page(60 * 15), name="dispatch")  # 15 min cache
class AssetExposureView(APIView):
    """
    Check which hazard (vector polygon) layers contain a given point.
    Used for asset-level direct risk: overlay infrastructure points on hazard layers.
    GET ?lat=<>&lng=<>&vector_layer_ids=1,2,3
    Returns [{ layer_id, layer_name }] for layers whose polygon features contain the point.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            lat = float(request.query_params.get("lat", 0))
            lng = float(request.query_params.get("lng", 0))
        except (TypeError, ValueError):
            return Response(
                {"detail": "lat and lng are required and must be numbers"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        layer_ids_param = request.query_params.get("vector_layer_ids", "")
        if not layer_ids_param:
            return Response([])
        try:
            layer_ids = [int(x.strip()) for x in layer_ids_param.split(",") if x.strip()]
        except ValueError:
            return Response(
                {"detail": "vector_layer_ids must be comma-separated integers"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not layer_ids:
            return Response([])

        point = Point(lng, lat, srid=4326)
        exposed = []
        for ds in VectorDataset.objects.filter(pk__in=layer_ids):
            has_feature = VectorItem.objects.filter(
                dataset=ds,
                geometry__intersects=point,
            ).exists()
            if has_feature:
                exposed.append({"layer_id": ds.pk, "layer_name": ds.name})
        return Response(exposed)


@method_decorator(cache_page(60 * 15), name="dispatch")  # 15 min cache
class VectorDatasetListView(ListAPIView):
    queryset = VectorDataset.objects.all()
    serializer_class = VectorDatasetSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = DatasetListPagination
    filterset_class = VectorDatasetFilter


class VectorDatasetDetailView(RetrieveAPIView):
    queryset = VectorDataset.objects.all()
    serializer_class = VectorDatasetSerializer
    permission_classes = [IsAuthenticated]


class VectorDatasetDataView(ListAPIView):
    serializer_class = VectorItemSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = GeoJsonPagination
    bbox_filter_field = "geometry"
    filterset_class = VectorItemFilter
    filter_backends = (
        InBBoxFilter,
        django_filters.rest_framework.DjangoFilterBackend,
    )

    def get_queryset(self):
        from vbos.datasets.models import VectorDataset

        pk = self.kwargs.get("pk")
        qs = VectorItem.objects.filter(dataset=pk).select_related(
            "province", "area_council"
        )
        try:
            ds = VectorDataset.objects.filter(pk=pk).values(
                "climate_module", "climate_modules"
            ).first()
            if ds and (ds.get("climate_module") or (ds.get("climate_modules") or [])):
                qs = qs.transform(4326)
        except Exception:
            pass
        return qs

    def get_filter_backends(self):
        """Skip bbox filter for climate datasets; geometries may be in projected CRS."""
        from vbos.datasets.models import VectorDataset

        pk = self.kwargs.get("pk")
        try:
            ds = VectorDataset.objects.filter(pk=pk).values(
                "climate_module", "climate_modules"
            ).first()
            if ds:
                mod = ds.get("climate_module")
                mods = ds.get("climate_modules") or []
                if mod or mods:
                    return (django_filters.rest_framework.DjangoFilterBackend,)
        except Exception:
            pass
        return super().get_filter_backends()


@method_decorator(cache_page(60 * 15), name="dispatch")  # 15 min cache
class TabularDatasetListView(ListAPIView):
    queryset = TabularDataset.objects.all()
    serializer_class = TabularDatasetSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = DatasetListPagination
    filterset_class = TabularDatasetFilter


class TabularDatasetDetailView(RetrieveAPIView):
    queryset = TabularDataset.objects.all()
    serializer_class = TabularDatasetSerializer
    permission_classes = [IsAuthenticated]


class TabularDatasetDataView(ListAPIView):
    filterset_class = TabularItemFilter
    permission_classes = [IsAuthenticated]
    serializer_class = TabularItemSerializer
    pagination_class = DataResultsSetPagination

    def get_queryset(self):
        return TabularItem.objects.filter(
            dataset=self.kwargs.get("pk")
        ).select_related("province", "area_council")


class TabularDatasetXSLXDataView(XLSXFileMixin, TabularDatasetDataView):
    serializer_class = TabularItemExcelSerializer
    renderer_classes = (XLSXRenderer,)
    pagination_class = None

    def get_filename(self, request, *args, **kwargs):
        return f"vbos-mis-tabular-{kwargs.get('pk')}.xlsx"

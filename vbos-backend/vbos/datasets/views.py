import django_filters.rest_framework
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from drf_excel.mixins import XLSXFileMixin
from drf_excel.renderers import XLSXRenderer
from rest_framework import status
from rest_framework.generics import DestroyAPIView, ListAPIView, ListCreateAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_gis.filters import InBBoxFilter
from rest_framework_gis.pagination import GeoJsonPagination

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
        if not cluster_name:
            return Response(
                {"detail": "Missing required 'cluster' query parameter"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if cluster_name.lower() == "drivers":
            # Drivers overlay: fetch by name across ALL clusters (Roads in Logistics, etc.)
            from django.db.models import Q
            name_q = Q()
            for n in DRIVER_DATASET_NAMES:
                name_q |= Q(name__icontains=n)
            tabular_qs = TabularDataset.objects.filter(name_q)
            raster_qs = RasterDataset.objects.filter(name_q)
            vector_qs = VectorDataset.objects.filter(name_q)
            pmtiles_qs = PMTilesDataset.objects.filter(name_q)
            tabular = TabularDatasetSerializer(tabular_qs, many=True).data
            raster = RasterDatasetSerializer(raster_qs, many=True).data
            vector = VectorDatasetSerializer(vector_qs, many=True).data
            pmtiles = PMTilesDatasetSerializer(pmtiles_qs, many=True).data
        elif cluster_name.lower() == "disaster":
            # Disaster overlay: fetch by name across ALL clusters (Cyclone Intensity, Volcano, Flood)
            from django.db.models import Q
            name_q = Q()
            for n in DISASTER_DATASET_NAMES:
                name_q |= Q(name__icontains=n)
            raster_qs = RasterDataset.objects.filter(name_q)
            vector_qs = VectorDataset.objects.filter(name_q)
            pmtiles_qs = PMTilesDataset.objects.filter(name_q)
            tabular = []
            raster = RasterDatasetSerializer(raster_qs, many=True).data
            vector = VectorDatasetSerializer(vector_qs, many=True).data
            pmtiles = PMTilesDatasetSerializer(pmtiles_qs, many=True).data
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
            vector = VectorDatasetSerializer(
                VectorDataset.objects.filter(cluster__name__iexact=cluster_name),
                many=True,
            ).data
            pmtiles = PMTilesDatasetSerializer(
                PMTilesDataset.objects.filter(cluster__name__iexact=cluster_name),
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
        return VectorItem.objects.filter(dataset=self.kwargs.get("pk"))


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

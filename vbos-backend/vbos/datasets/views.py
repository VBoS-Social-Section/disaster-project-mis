import django_filters.rest_framework
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from drf_excel.mixins import XLSXFileMixin
from drf_excel.renderers import XLSXRenderer
from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveAPIView
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


@method_decorator(cache_page(60 * 15), name="dispatch")  # 15 min cache
class ClusterDatasetsView(APIView):
    """Single endpoint returning all dataset types for a cluster in one response."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cluster_name = request.query_params.get("cluster")
        if not cluster_name:
            return Response(
                {"detail": "Missing required 'cluster' query parameter"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tabular = TabularDatasetSerializer(
            TabularDataset.objects.filter(cluster__name__iexact=cluster_name),
            many=True,
        ).data
        raster = RasterDatasetSerializer(
            RasterDataset.objects.filter(cluster__name__iexact=cluster_name),
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
    queryset = Cluster.objects.all()
    serializer_class = ClusterSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination


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

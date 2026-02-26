from django.urls import path

from . import views

app_name = "datasets"

urlpatterns = [
    path("cluster/", views.ClusterListView.as_view(), name="cluster-list"),
    path(
        "datasets/",
        views.ClusterDatasetsView.as_view(),
        name="cluster-datasets",
    ),
    path("provinces/", views.ProvinceListView.as_view(), name="province-list"),
    path(
        "provinces/<str:province>/area-councils/",
        views.AreaCouncilListView.as_view(),
        name="area-council-list",
    ),
    # raster
    path("raster/", views.RasterDatasetListView.as_view(), name="raster-list"),
    path(
        "raster/<int:pk>/",
        views.RasterDatasetDetailView.as_view(),
        name="raster-detail",
    ),
    # pmtiles
    path("pmtiles/", views.PMTilesDatasetListView.as_view(), name="pmtiles-list"),
    path(
        "pmtiles/<int:pk>/",
        views.PMTilesDatasetDetailView.as_view(),
        name="pmtiles-detail",
    ),
    # vector
    path("vector/", views.VectorDatasetListView.as_view(), name="vector-list"),
    path(
        "vector/<int:pk>/",
        views.VectorDatasetDetailView.as_view(),
        name="vector-detail",
    ),
    path(
        "vector/<int:pk>/data/",
        views.VectorDatasetDataView.as_view(),
        name="vector-data",
    ),
    # tabular
    path("tabular/", views.TabularDatasetListView.as_view(), name="tabular-list"),
    path(
        "tabular/<int:pk>/",
        views.TabularDatasetDetailView.as_view(),
        name="tabular-detail",
    ),
    path(
        "tabular/<int:pk>/data/",
        views.TabularDatasetDataView.as_view(),
        name="tabular-data",
    ),
    path(
        "tabular/<int:pk>/data-xlsx/",
        views.TabularDatasetXSLXDataView.as_view(),
        name="tabular-data-xlsx",
    ),
]

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import Cluster, RasterDataset, RasterFile


class TestRasterDatasetListDetailViews(APITestCase):
    def setUp(self):
        self.dataset_1 = RasterDataset.objects.create(
            name="Rainfall",
            description="Rainfall data since 2020",
            cluster=Cluster.objects.create(name="Environment"),
            filename_id="rainfall",
            source="WMO",
            titiler_url_params="rescale=-0.3,0.3",
        )
        self.dataset_2 = RasterDataset.objects.create(
            name="Coastline changes",
            filename_id="population_baseline",
            source="OSM",
            cluster=Cluster.objects.create(name="Administrative"),
            type="estimated_damage",
            titiler_url_params="rescale=-0.5,0.5",
        )
        self.url = reverse("datasets:raster-list")

    def test_raster_datasets_list(self):
        req = self.client.get(self.url)
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 2
        assert req.data.get("results")[0]["name"] == "Rainfall"
        assert req.data.get("results")[1]["name"] == "Coastline changes"
        assert req.data.get("results")[0]["description"] == "Rainfall data since 2020"
        assert req.data.get("results")[0]["cluster"] == "Environment"
        assert req.data.get("results")[1]["cluster"] == "Administrative"
        assert req.data.get("results")[0]["source"] == "WMO"
        assert req.data.get("results")[1]["source"] == "OSM"
        assert req.data.get("results")[0]["type"] == "baseline"
        assert req.data.get("results")[1]["type"] == "estimated_damage"
        assert req.data.get("results")[0]["titiler_url_params"] == "rescale=-0.3,0.3"
        assert req.data.get("results")[1]["titiler_url_params"] == "rescale=-0.5,0.5"

    def test_raster_datasets_list_filter(self):
        req = self.client.get(self.url, {"cluster": "transportation"})
        assert req.status_code == status.HTTP_400_BAD_REQUEST

        req = self.client.get(self.url, {"cluster": "administrative"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 1

        req = self.client.get(self.url, {"cluster": "environment"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 1

        req = self.client.get(self.url, {"type": "baseline"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 1

    def test_raster_datasets_detail(self):
        url = reverse("datasets:raster-detail", args=[self.dataset_1.id])
        req = self.client.get(url)
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("name") == "Rainfall"
        assert req.data.get("filename_id") == "rainfall"
        assert req.data.get("created")
        assert req.data.get("updated")
        assert req.data.get("source") == "WMO"
        assert req.data.get("cluster") == "Environment"
        assert req.data.get("description") == "Rainfall data since 2020"
        assert req.data.get("titiler_url_params") == "rescale=-0.3,0.3"

    def tearDown(self):
        RasterDataset.objects.all().delete()
        RasterFile.objects.all().delete()

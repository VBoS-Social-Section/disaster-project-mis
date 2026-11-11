from datetime import date

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import Cluster, DisasterEvent, PMTilesDataset, VectorDataset


class TestDisasterEventListView(APITestCase):
    def setUp(self):
        self.client.force_authenticate(get_user_model().objects.create(username="tester"))
        cluster = Cluster.objects.create(name="Disaster")
        self.lola = DisasterEvent.objects.create(
            name="Cyclone Lola", hazard_type="cyclone", start_date=date(2023, 10, 24)
        )
        self.pam = DisasterEvent.objects.create(
            name="Cyclone Pam", hazard_type="cyclone", start_date=date(2015, 3, 13)
        )
        self.scenario = DisasterEvent.objects.create(
            name="Cyclone scenario", hazard_type="cyclone", is_scenario=True
        )
        self.tiles = PMTilesDataset.objects.create(
            name="Cyclone Intensity", cluster=cluster, url="media/x.pmtiles",
            source_layer="councils", event=self.lola,
        )
        self.track = VectorDataset.objects.create(name="Track", cluster=cluster, event=self.lola)
        self.url = reverse("datasets:event-list")

    def test_lists_all_events_with_their_layers(self):
        req = self.client.get(self.url)
        assert req.status_code == status.HTTP_200_OK
        by_name = {e["name"]: e for e in req.data}
        assert set(by_name) == {"Cyclone Lola", "Cyclone Pam", "Cyclone scenario"}
        assert by_name["Cyclone Lola"]["year"] == 2023
        assert by_name["Cyclone Lola"]["hazard_type_label"] == "Cyclone"
        assert by_name["Cyclone Lola"]["layers"] == [
            {"id": f"p{self.tiles.id}", "name": "Cyclone Intensity"},
            {"id": f"v{self.track.id}", "name": "Track"},
        ]
        assert by_name["Cyclone scenario"]["year"] is None
        assert by_name["Cyclone scenario"]["layers"] == []

    def test_year_filter_keeps_scenarios(self):
        req = self.client.get(self.url, {"year": 2015})
        assert {e["name"] for e in req.data} == {"Cyclone Pam", "Cyclone scenario"}

    def test_disaster_is_not_listed_as_a_sector(self):
        Cluster.objects.get_or_create(name="Education")
        req = self.client.get(reverse("datasets:cluster-list"), {"page_size": 100})
        names = [c["name"] for c in req.data["results"]]
        assert "Education" in names
        assert "Disaster" not in names


class TestExistingDataMigration(APITestCase):
    """The 0039 data step, run against the kind of data the live system holds."""

    def test_unnamed_footprint_becomes_a_scenario_with_its_tables(self):
        from importlib import import_module

        from django.apps import apps

        from ..models import TabularDataset

        migration = import_module("vbos.datasets.migrations.0039_disaster_event")
        disaster = Cluster.objects.create(name="Disaster")
        education, _ = Cluster.objects.get_or_create(name="Education")
        tiles = PMTilesDataset.objects.create(
            name="Cyclone Intensity", cluster=disaster, type="estimated_damage",
            url="media/x.pmtiles", source_layer="councils", source="RAP cyclone scenario",
        )
        schools = VectorDataset.objects.create(name="Primary Schools", cluster=education)
        damage = TabularDataset.objects.create(
            name="Schools damaged", cluster=education, type="estimated_damage"
        )
        baseline = TabularDataset.objects.create(name="Students", cluster=education)

        migration.create_events(apps, None)

        event = DisasterEvent.objects.get()
        assert (event.name, event.hazard_type, event.is_scenario) == ("Cyclone scenario", "cyclone", True)
        tiles.refresh_from_db(); schools.refresh_from_db()
        damage.refresh_from_db(); baseline.refresh_from_db()
        assert tiles.event == event
        assert schools.event is None
        assert damage.event == event
        assert baseline.event is None

import json
import os
import tempfile

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase, override_settings
from django.urls import reverse

from vbos.datasets.models import (
    AreaCouncil,
    Cluster,
    DisasterEvent,
    PMTilesDataset,
    TabularDataset,
    TabularItem,
)


class ImportAsEventTests(TestCase):
    """Tabular items -> Import with the optional "New event" block filled in."""

    def setUp(self):
        get_user_model().objects.create_superuser("admin", "a@example.com", "pw")
        self.client = Client()
        self.client.login(username="admin", password="pw")
        self.url = reverse("admin:datasets_tabularitem_import_file")
        # Provinces, area councils and the standing datasets come from migrations
        self.council = AreaCouncil.objects.first().name
        self.education, _ = Cluster.objects.get_or_create(name="Education")
        self.damage, _ = TabularDataset.objects.get_or_create(
            name="Education 02 damage estimates", type="estimated_damage", cluster=self.education
        )
        self.baseline, _ = TabularDataset.objects.get_or_create(
            name="Education 01 baseline education", type="baseline", cluster=self.education
        )
        self.old_items = TabularItem.objects.filter(dataset=self.damage).count()
        self.csv = f'"Region","schools_damaged"\n"National",9\n"{self.council}",4\n'.encode()

    def post(self, files, **event):
        data = {"format_style": "wide", "year": "2026", "file_count": str(len(files))}
        for i, (name, content, dataset) in enumerate(files):
            data[f"file_{i}"] = SimpleUploadedFile(name, content)
            data[f"dataset_{i}"] = str(dataset.pk)
        data.update(event)
        return self.client.post(self.url, data, follow=True)

    def event(self, **kw):
        base = {"event_name": "Cyclone Zara", "event_hazard": "cyclone", "event_start": "2026-11-12"}
        base.update(kw)
        return base

    def test_new_event_gets_its_own_dataset_and_old_data_is_kept(self):
        response = self.post([("a.csv", self.csv, self.damage)], **self.event())
        self.assertContains(response, "Created event")
        event = DisasterEvent.objects.get(name="Cyclone Zara")
        copy = TabularDataset.objects.get(name="Education 02 damage estimates - Cyclone Zara")
        self.assertEqual((copy.event, copy.type, copy.cluster), (event, "estimated_damage", self.education))
        self.assertEqual(TabularItem.objects.filter(dataset=copy).count(), 1)
        self.assertEqual(TabularItem.objects.filter(dataset=self.damage).count(), self.old_items)

    def test_baseline_files_are_skipped(self):
        response = self.post(
            [("a.csv", self.csv, self.damage), ("b.csv", self.csv, self.baseline)], **self.event()
        )
        self.assertContains(response, "Skipped baseline files")
        self.assertFalse(TabularDataset.objects.filter(name__endswith="baseline education - Cyclone Zara").exists())

    def test_any_problem_rolls_everything_back(self):
        bad = b'"Region","schools_damaged"\n"Nowhere","3"\n'
        response = self.post([("a.csv", bad, self.damage)], **self.event())
        self.assertContains(response, "Nothing was imported")
        self.assertFalse(DisasterEvent.objects.filter(name="Cyclone Zara").exists())
        self.assertFalse(TabularDataset.objects.filter(name__endswith="Cyclone Zara").exists())

    def test_duplicate_event_name_is_refused(self):
        self.post([("a.csv", self.csv, self.damage)], **self.event())
        response = self.post([("a.csv", self.csv, self.damage)], **self.event())
        self.assertContains(response, "already exists")
        self.assertEqual(DisasterEvent.objects.filter(name="Cyclone Zara").count(), 1)

    def test_missing_start_date_is_refused(self):
        response = self.post([("a.csv", self.csv, self.damage)], **self.event(event_start=""))
        self.assertContains(response, "start date")
        self.assertFalse(DisasterEvent.objects.filter(name="Cyclone Zara").exists())

    def test_layer_and_tile_file(self):
        geojson = json.dumps({"features": [{"properties": {"acname": "X", "Intensity": 4}}]}).encode()
        with tempfile.TemporaryDirectory() as media, override_settings(MEDIA_ROOT=media):
            data = self.event()
            data["pmtiles"] = SimpleUploadedFile("t.pmtiles", b"PMTiles")
            data["geojson"] = SimpleUploadedFile("g.geojson", geojson)
            data.update({"format_style": "wide", "year": "2026", "file_count": "1",
                         "file_0": SimpleUploadedFile("a.csv", self.csv), "dataset_0": str(self.damage.pk)})
            response = self.client.post(self.url, data, follow=True)
            self.assertContains(response, "map layer")
            self.assertEqual(open(os.path.join(media, "cyclone_zara_intensity.pmtiles"), "rb").read(), b"PMTiles")
        layer = PMTilesDataset.objects.get(name="Cyclone Intensity - Cyclone Zara")
        self.assertEqual(layer.event.name, "Cyclone Zara")
        self.assertEqual(layer.intensity_data[0]["Intensity"], 4)

    def test_existing_tile_file_is_not_overwritten(self):
        with tempfile.TemporaryDirectory() as media, override_settings(MEDIA_ROOT=media):
            path = os.path.join(media, "cyclone_zara_intensity.pmtiles")
            open(path, "wb").write(b"old")
            data = {**self.event(), "pmtiles": SimpleUploadedFile("t.pmtiles", b"new"),
                    "format_style": "wide", "year": "2026", "file_count": "1",
                    "file_0": SimpleUploadedFile("a.csv", self.csv), "dataset_0": str(self.damage.pk)}
            response = self.client.post(self.url, data, follow=True)
            self.assertContains(response, "already exists")
            self.assertEqual(open(path, "rb").read(), b"old")
        self.assertFalse(DisasterEvent.objects.filter(name="Cyclone Zara").exists())

    def test_without_event_name_import_is_unchanged(self):
        response = self.post([("a.csv", self.csv, self.damage)])
        self.assertContains(response, "Successfully created")
        self.assertFalse(DisasterEvent.objects.filter(name="Cyclone Zara").exists())
        self.assertGreater(TabularItem.objects.filter(dataset=self.damage).count(), self.old_items)

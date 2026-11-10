"""Load DRMIS data from the RAP outputs and the cluster shape files.

    ./manage.py load_drmis_data --rap /data/rap --shapes /data/shapes [--replace] [--year 2024]

--rap     checkout of VBoS-Social-Section/disaster-project-rap   (uses output/*.csv, output/area_councils_intensity.*)
--shapes  checkout of VBoS-Social-Section/disaster-project-shape-files (uses clusters/<Cluster>/shape_files/<Layer>/)

Everything runs in one transaction: on any problem nothing is changed.
Use deploy/vm/load-data.sh on the server to fetch both repositories and run this.
"""
import csv
import glob
import io
import json
import os
import shutil

from django.conf import settings
from django.contrib.gis.gdal import DataSource
from django.core.cache import cache
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from ...models import (
    Cluster,
    PMTilesDataset,
    TabularDataset,
    TabularItem,
    VectorDataset,
    VectorItem,
)
from ...utils import import_wide_format_csv, vector_item_fields

# RAP file prefix -> (cluster, dataset name prefix)
TABULAR_PREFIXES = {
    "GenderProtection": ("Gender & Protection", "Gender & Protection"),
    "FoodSecurity": ("Food security", "FoodSecurity"),
    "Telecom": ("Emergency Telecommunications", "Telecom"),
}
TYPE_BY_NUMBER = {
    "01": "baseline",
    "02": "estimated_damage",
    "03": "aid_resources_needed",
    "04": "estimate_financial_damage",
}
# Gender & Protection has no damage table: its 02 file is resources needed
TYPE_OVERRIDES = {"GenderProtection_02_resources_needed": "aid_resources_needed"}

# Display name, icon and colour for known layers (folder name -> settings).
# Unknown folders still load, named after the folder with automatic styling.
VECTOR_STYLES = {
    "ECCE": ("ECCE", "fi-sr-child-head", "#f09000"),
    "Primary_Schools": ("Primary Schools", "fi-sr-school", "#3d4aff"),
    "Secondary_Schools": ("Secondary Schools", "fi-sr-graduation-cap", "#8b5cf6"),
    "Digicel_Towers": ("Digicel Towers", "fi-sr-broadcast-tower", "#e34a33"),
    "Vodafone_Towers_": ("Vodafone Towers", "fi-sr-signal-alt-2", "#06b6d4"),
    "Solar_and_Hydro": ("Solar and Hydro", "fi-sr-bolt", "#f09000"),
    "Aidposts": ("Aidposts", "fi-sr-house-medical", "#14b8a6"),
    "Dispensaries": ("Dispensaries", "fi-sr-medicine", "#10b981"),
    "Health_Centers": ("Health Centers", "fi-sr-hospital", "#e34a33"),
    "Airports": ("Airports", "fi-sr-plane", "#6366f1"),
    "Police_Posts": ("Police Posts", "fi-sr-user-police", "#3d4aff"),
    "Police_Stations": ("Police Stations", "fi-sr-shield-check", "#6366f1"),
    "Road": ("Roads", "fi-sr-road", "#f09000"),
    "Wharfs": ("Wharfs", "fi-sr-anchor", "#06b6d4"),
    "Fire_Hydrants": ("Fire Hydrants", "fi-sr-fire-hydrant", "#e34a33"),
    "Main_Water_Valves": ("Main Water Valves", "fi-sr-faucet", "#14b8a6"),
    "Water_Sources": ("Water Sources", "fi-sr-raindrops", "#06b6d4"),
}

SOURCES = {  # cluster -> data owner, from the RAP baseline input file
    "Education": "Ministry of Education and Training",
    "Health": "Ministry of Health",
}


class Command(BaseCommand):
    help = __doc__

    def add_arguments(self, parser):
        parser.add_argument("--rap", help="Path to the disaster-project-rap checkout")
        parser.add_argument("--shapes", help="Path to the disaster-project-shape-files checkout")
        parser.add_argument("--year", type=int, default=2024)
        parser.add_argument("--replace", action="store_true",
                            help="Replace existing rows of each dataset being loaded")
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **opts):
        if not opts["rap"] and not opts["shapes"]:
            raise CommandError("Give --rap and/or --shapes")
        self.problems = []
        with transaction.atomic():
            if opts["rap"]:
                self.load_tabular(opts["rap"], opts["year"], opts["replace"])
                self.load_intensity(opts["rap"], opts["dry_run"])
            if opts["shapes"]:
                self.load_vectors(opts["shapes"], opts["replace"])
            if self.problems:
                transaction.set_rollback(True)
                raise CommandError("Nothing was changed. Problems:\n  " + "\n  ".join(self.problems))
            if opts["dry_run"]:
                transaction.set_rollback(True)
                self.stdout.write("Dry run: rolled back.")
        cache.clear()
        self.stdout.write(
            f"Totals: {TabularItem.objects.count()} tabular items in "
            f"{TabularDataset.objects.count()} datasets; {VectorItem.objects.count()} map features in "
            f"{VectorDataset.objects.count()} layers; {PMTilesDataset.objects.count()} tile layers."
        )

    # ------------------------------------------------------------------ tabular
    def tabular_target(self, base):
        prefix, number = base.split("_")[0], base.split("_")[1][:2]
        cluster_name, name_prefix = TABULAR_PREFIXES.get(prefix, (prefix, prefix))
        name = name_prefix + " " + " ".join(base.split("_")[1:])
        ds_type = TYPE_OVERRIDES.get(base, TYPE_BY_NUMBER.get(number))
        if ds_type is None:
            raise ValueError(f"cannot tell dataset type from file name {base}")
        cluster = Cluster.objects.filter(name__iexact=cluster_name).first()
        if cluster is None:
            raise ValueError(f"no cluster named {cluster_name!r}")
        existing = TabularDataset.objects.filter(name=name)
        if existing.count() > 1:
            raise ValueError(f"more than one dataset named {name!r}")
        ds = existing.first() or TabularDataset.objects.create(name=name, type=ds_type, cluster=cluster)
        return ds

    def load_tabular(self, rap, year, replace):
        files = sorted(glob.glob(os.path.join(rap, "output", "*.csv")))
        if not files:
            self.problems.append(f"no CSV files in {rap}/output")
        for path in files:
            base = os.path.basename(path)[:-4]
            if base.startswith("QC_"):
                continue
            try:
                ds = self.tabular_target(base)
            except ValueError as e:
                self.problems.append(f"{base}: {e}")
                continue
            existing = TabularItem.objects.filter(dataset=ds)
            if existing.exists():
                if not replace:
                    self.stdout.write(f"  skip  {ds.name} (already has data; use --replace)")
                    continue
                existing.delete()
            with open(path, encoding="utf-8-sig") as fh:
                created, errors, first = import_wide_format_csv(csv.DictReader(io.StringIO(fh.read())), ds, year)
            if errors:
                self.problems.append(f"{base}: {errors} rows failed ({first})")
            self.apply_tabular_metadata(ds)
            self.stdout.write(f"  table {ds.name}: {TabularItem.objects.filter(dataset=ds).count()} values")

    def apply_tabular_metadata(self, ds):
        changed = []
        if ds.type == "estimate_financial_damage" and not ds.unit:
            ds.unit = "Vatu"
            changed.append("unit")
        source = SOURCES.get(ds.cluster.name)
        if source and not ds.source:
            ds.source = source
            changed.append("source")
        if changed:
            ds.save(update_fields=changed)

    # ---------------------------------------------------------------- intensity
    def load_intensity(self, rap, dry_run):
        pmtiles = os.path.join(rap, "output", "area_councils_intensity.pmtiles")
        geojson = os.path.join(rap, "output", "area_councils_intensity.geojson")
        if not (os.path.exists(pmtiles) and os.path.exists(geojson)):
            self.stdout.write("  (no cyclone intensity files in RAP output; skipped)")
            return
        with open(geojson, encoding="utf-8") as fh:
            intensity = [f["properties"] for f in json.load(fh)["features"]]
        cluster, _ = Cluster.objects.get_or_create(name="Disaster")
        ds, _ = PMTilesDataset.objects.get_or_create(
            name="Cyclone Intensity", cluster=cluster, type="estimated_damage",
            defaults={"url": "media/area_councils_intensity.pmtiles", "source_layer": "councils"},
        )
        ds.url = "media/area_councils_intensity.pmtiles"
        ds.source_layer = "councils"
        ds.source = "RAP cyclone scenario (Ex_hazard_areas.csv)"
        ds.intensity_data = intensity
        ds.save()
        if not dry_run:
            os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
            shutil.copyfile(pmtiles, os.path.join(settings.MEDIA_ROOT, "area_councils_intensity.pmtiles"))
        affected = sum(1 for p in intensity if (p.get("Intensity") or 0) > 0)
        self.stdout.write(f"  tiles Cyclone Intensity: {len(intensity)} area councils, {affected} affected")

    # ------------------------------------------------------------------ vectors
    @staticmethod
    def read_features(folder):
        geo = sorted(glob.glob(os.path.join(folder, "*.geojson")))
        if geo:
            with open(geo[0], encoding="utf-8") as fh:
                return json.load(fh)["features"]
        shp = sorted(glob.glob(os.path.join(folder, "*.shp")))
        if not shp:
            return None
        layer = DataSource(shp[0])[0]
        features = []
        for ft in layer:
            geom = ft.geom.clone()
            if layer.srs:
                geom.transform(4326)
            props = {}
            for field in layer.fields:
                value = ft.get(field)
                props[field] = value if isinstance(value, (int, float, str, type(None))) else str(value)
            features.append({"properties": props, "geometry": json.loads(geom.json)})
        return features

    def load_vectors(self, shapes, replace):
        folders = sorted(glob.glob(os.path.join(shapes, "clusters", "*", "shape_files", "*", "")))
        if not folders:
            self.problems.append(f"no layer folders under {shapes}/clusters")
        for folder in folders:
            parts = folder.rstrip("/").split(os.sep)
            cluster_name, layer_key = parts[-3], parts[-1]
            features = self.read_features(folder)
            if features is None:
                continue
            name, icon, color = VECTOR_STYLES.get(layer_key, (layer_key.replace("_", " ").strip(), None, None))
            cluster = Cluster.objects.filter(name__iexact=cluster_name).first()
            if cluster is None:
                self.problems.append(f"{layer_key}: no cluster named {cluster_name!r}")
                continue
            ds, _ = VectorDataset.objects.get_or_create(name=name, type="baseline", cluster=cluster)
            changed = []
            if icon and not ds.icon:
                ds.icon = icon
                changed.append("icon")
            if color and not ds.color:
                ds.color = color
                changed.append("color")
            if changed:
                ds.save(update_fields=changed)
            existing = VectorItem.objects.filter(dataset=ds)
            if existing.exists():
                if not replace:
                    self.stdout.write(f"  skip  {name} (already has data; use --replace)")
                    continue
                existing.delete()
            errors, first = 0, None
            for feature in features:
                try:
                    with transaction.atomic():
                        VectorItem.objects.create(
                            dataset=ds, **vector_item_fields(feature.get("properties"), feature.get("geometry"))
                        )
                except Exception as e:  # noqa: BLE001 - reported below, whole load rolls back
                    errors += 1
                    first = first or str(e)
            if errors:
                self.problems.append(f"{layer_key}: {errors} features failed ({first})")
            self.stdout.write(f"  layer {cluster.name} / {name}: {VectorItem.objects.filter(dataset=ds).count()} features")

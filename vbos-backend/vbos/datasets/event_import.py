"""Helpers for importing a new disaster event from the CSV import page.

On Tabular items -> Import, a new event can be created while the CSV files are
imported. Each damage / resources / financial table then goes into its own new dataset
named "<table> - <event>", linked to the event, so earlier events keep their data.
The event's intensity layer can be created from the same page.
"""
import json
import os

from django.conf import settings
from django.utils.text import slugify

from .models import Cluster, DisasterEvent, PMTilesDataset, TabularDataset

EVENT_TYPES = ("estimated_damage", "aid_resources_needed", "estimate_financial_damage")


class EventImportError(Exception):
    """Raised with a list of problems; the caller rolls everything back."""

    def __init__(self, problems):
        self.problems = problems
        super().__init__("; ".join(problems))


def create_event(name, hazard_type, start_date, end_date=None):
    name = (name or "").strip()
    if not name:
        raise EventImportError(["Give the event a name."])
    if not start_date:
        raise EventImportError(["Give the event a start date."])
    if DisasterEvent.objects.filter(name__iexact=name, start_date__year=start_date.year).exists():
        raise EventImportError(
            [f"An event called {name!r} already exists for {start_date.year}. "
             "Use a different name or start date."]
        )
    event = DisasterEvent(
        name=name, hazard_type=hazard_type, start_date=start_date, end_date=end_date
    )
    event.full_clean()
    event.save()
    return event


def dataset_for_event(dataset, event):
    """The copy of ``dataset`` that belongs to ``event`` (created on first use).

    Baseline datasets describe the country before any disaster and are not tied to an
    event, so they return None. The copy keeps cluster, type, source, unit and description.
    """
    if dataset.type not in EVENT_TYPES:
        return None
    unit = dataset.unit or ("Vatu" if dataset.type == "estimate_financial_damage" else None)
    copy, _ = TabularDataset.objects.get_or_create(
        name=f"{dataset.name} - {event.name}"[:155],
        type=dataset.type,
        cluster=dataset.cluster,
        defaults={
            "event": event,
            "description": dataset.description,
            "source": dataset.source,
            "unit": unit,
        },
    )
    if copy.event_id != event.id:
        raise EventImportError([f"{copy.name!r} already exists for another event."])
    return copy


def create_event_layer(event, pmtiles=None, geojson=None):
    """Create the event's intensity layer. Returns (layer, tile file path to write)."""
    intensity = []
    if geojson:
        try:
            intensity = [f["properties"] for f in json.loads(geojson.decode("utf-8-sig"))["features"]]
        except (ValueError, KeyError, TypeError):
            raise EventImportError(["The GeoJSON file could not be read (expected a FeatureCollection)."])
    if not pmtiles:
        return None, None
    tile_name = f"{slugify(event.name).replace('-', '_') or 'event'}_intensity.pmtiles"
    target = os.path.join(settings.MEDIA_ROOT, tile_name)
    if os.path.exists(target):
        raise EventImportError([f"The file media/{tile_name} already exists on the server."])
    disaster, _ = Cluster.objects.get_or_create(name="Disaster")
    layer = PMTilesDataset.objects.create(
        name=f"Cyclone Intensity - {event.name}"[:155],
        cluster=disaster,
        type="estimated_damage",
        url=f"media/{tile_name}",
        source_layer="councils",
        cyclone_name=event.name,
        event=event,
        intensity_data=intensity,
    )
    return layer, target

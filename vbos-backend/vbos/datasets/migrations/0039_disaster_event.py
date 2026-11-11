# Disaster events become first-class: the dashboard picks a year, then an event, and the
# event's hazard footprint layers and damage/response/financial figures follow from it.
#
# Existing data is carried over: every hazard footprint layer (in the "Disaster" cluster,
# named after a hazard, or carrying a cyclone_name) is attached to an event. Layers without
# an event name become a scenario, because nothing records when they happened.

import django.db.models.deletion
from django.db import migrations, models

HAZARD_KEYWORDS = [
    ("cyclone", "cyclone"),
    ("volcano", "volcano"),
    ("flood", "flood"),
    ("earthquake", "earthquake"),
    ("tsunami", "tsunami"),
    ("landslide", "landslide"),
    ("drought", "drought"),
    ("wildfire", "wildfire"),
]
EVENT_TYPES = ["estimated_damage", "aid_resources_needed", "estimate_financial_damage"]


def hazard_of(*texts):
    joined = " ".join(t for t in texts if t).lower()
    for keyword, hazard in HAZARD_KEYWORDS:
        if keyword in joined:
            return hazard
    return None


def create_events(apps, schema_editor):
    DisasterEvent = apps.get_model("datasets", "DisasterEvent")
    created = {}
    for model_name in ("PMTilesDataset", "VectorDataset"):
        Model = apps.get_model("datasets", model_name)
        for ds in Model.objects.select_related("cluster").all():
            event_name = (ds.cyclone_name or "").strip()
            hazard = hazard_of(ds.name, event_name)
            in_disaster_cluster = ds.cluster.name.lower() == "disaster"
            if not (event_name or in_disaster_cluster):
                continue
            hazard = hazard or "cyclone"
            name = event_name or f"{hazard.capitalize()} scenario"
            key = name.lower()
            if key not in created:
                created[key] = DisasterEvent.objects.create(
                    name=name,
                    hazard_type=hazard,
                    is_scenario=True,
                    source=ds.source or "",
                )
            ds.event = created[key]
            ds.save(update_fields=["event"])

    # With a single event there is no doubt which one the existing damage, response and
    # financial tables describe. With several, an administrator assigns them.
    if len(created) == 1:
        event = next(iter(created.values()))
        TabularDataset = apps.get_model("datasets", "TabularDataset")
        TabularDataset.objects.filter(type__in=EVENT_TYPES, event__isnull=True).update(event=event)


def remove_events(apps, schema_editor):
    apps.get_model("datasets", "DisasterEvent").objects.all().delete()


FOOTPRINT_HELP = (
    "Disaster event this layer is the hazard footprint of. "
    "The layer is switched on when the event is chosen in the dashboard."
)
TABLE_HELP = (
    "Disaster event these figures belong to (damage, response resources, "
    "financial damage). Leave empty for baseline data. Figures linked to an event "
    "are only shown while that event is selected."
)


def event_fk(help_text):
    return models.ForeignKey(
        blank=True,
        help_text=help_text,
        null=True,
        on_delete=django.db.models.deletion.SET_NULL,
        related_name="%(class)ss",
        to="datasets.disasterevent",
    )


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0038_add_pmtiles_intensity_data"),
    ]

    operations = [
        migrations.CreateModel(
            name="DisasterEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(help_text="Name shown in the dashboard, e.g. Cyclone Lola.", max_length=155)),
                (
                    "hazard_type",
                    models.CharField(
                        choices=[
                            ("cyclone", "Cyclone"),
                            ("volcano", "Volcano"),
                            ("flood", "Flood"),
                            ("earthquake", "Earthquake"),
                            ("tsunami", "Tsunami"),
                            ("landslide", "Landslide"),
                            ("drought", "Drought"),
                            ("wildfire", "Wildfire"),
                        ],
                        default="cyclone",
                        max_length=20,
                    ),
                ),
                (
                    "start_date",
                    models.DateField(
                        blank=True,
                        help_text="First day of the event. Decides which year it is listed under.",
                        null=True,
                    ),
                ),
                ("end_date", models.DateField(blank=True, null=True)),
                (
                    "is_scenario",
                    models.BooleanField(
                        default=False,
                        help_text="Tick for a modelled or exercise scenario rather than a real event. "
                        "Scenarios are listed under every year.",
                    ),
                ),
                ("description", models.TextField(blank=True, default="", max_length=2000)),
                ("source", models.CharField(blank=True, default="", max_length=155)),
                ("created", models.DateTimeField(auto_now_add=True)),
                ("updated", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Disaster event",
                "ordering": ["-start_date", "name"],
            },
        ),
        migrations.AddField(model_name="pmtilesdataset", name="event", field=event_fk(FOOTPRINT_HELP)),
        migrations.AddField(model_name="vectordataset", name="event", field=event_fk(FOOTPRINT_HELP)),
        migrations.AddField(model_name="tabulardataset", name="event", field=event_fk(TABLE_HELP)),
        migrations.RunPython(create_events, reverse_code=remove_events),
    ]

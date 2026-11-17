from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand

MODELS = [
    "cluster",
    "disasterevent",
    "pmtilesdataset",
    "rasterdataset",
    "rasterfile",
    "tabulardataset",
    "tabularitem",
    "vectordataset",
    "vectoritem",
]


class Command(BaseCommand):
    help = (
        "Create/refresh the 'Data Admin' group: full add/change/delete/view "
        "access to the Datasets admin menus only (no superuser rights)."
    )

    def handle(self, *args, **options):
        group, _ = Group.objects.get_or_create(name="Data Admin")
        perms = Permission.objects.filter(
            content_type__app_label="datasets",
            content_type__model__in=MODELS,
        )
        group.permissions.set(perms)
        self.stdout.write(
            self.style.SUCCESS(
                f"Group 'Data Admin' now has {perms.count()} permissions."
            )
        )
        self.stdout.write(
            "Add a user: tick 'Staff status' (not Superuser) and select this group."
        )

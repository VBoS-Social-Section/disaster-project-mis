from django.conf import settings
from django.contrib.gis.db import models
from django.core.cache import cache
from django.core.validators import FileExtensionValidator
from django.db.models.fields.files import default_storage
from django.db.models.signals import post_delete, post_save, pre_delete
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _

UPLOAD_TO = "staging/raster/" if settings.DEBUG else "production/raster/"

TYPE_CHOICES = {
    "baseline": _("Baseline"),
    "estimated_damage": _("Estimated Hazard Damage"),
    "aid_resources_needed": _("Immediate Response Resources"),
    "estimate_financial_damage": _("Estimated Financial Damage"),
}


class Cluster(models.Model):
    name = models.CharField(max_length=100, unique=True)
    order = models.PositiveIntegerField(default=0, db_index=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["order"]


def _invalidate_cluster_cache(sender, **kwargs):
    """Clear cache so cluster list and datasets endpoints reflect admin changes."""
    cache.clear()


@receiver(post_save, sender=Cluster)
@receiver(post_delete, sender=Cluster)
def invalidate_cluster_cache(sender, **kwargs):
    _invalidate_cluster_cache(sender, **kwargs)


class Province(models.Model):
    name = models.CharField(max_length=100, unique=True)
    geometry = models.GeometryField()

    def __str__(self):
        return f"{self.name}"

    class Meta:
        ordering = ["name"]


class AreaCouncil(models.Model):
    name = models.CharField(max_length=100, unique=True)
    province = models.ForeignKey(Province, null=False, on_delete=models.PROTECT)
    geometry = models.GeometryField()

    def __str__(self):
        return f"{self.name}"

    class Meta:
        ordering = ["name"]


class RasterFile(models.Model):
    name = models.CharField(max_length=155, unique=True)
    created = models.DateTimeField(auto_now_add=True)
    file = models.FileField(
        upload_to=UPLOAD_TO,
        unique=True,
        validators=[
            FileExtensionValidator(
                allowed_extensions=["tiff", "tif", "geotiff", "gtiff", "vrt"]
            )
        ],
    )

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["id"]


@receiver(pre_delete, sender=RasterFile)
def delete_raster_file(sender, instance, **kwargs):
    """
    Delete the file from storage when a RasterFile instance is deleted
    """
    if instance.file:
        # Using default_storage for better compatibility with different storage backends
        if default_storage.exists(instance.file.name):
            default_storage.delete(instance.file.name)


class RasterDataset(models.Model):
    name = models.CharField(max_length=155)
    description = models.TextField(max_length=2000, null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    cluster = models.ForeignKey(
        Cluster,
        on_delete=models.PROTECT,
    )
    type = models.CharField(max_length=55, choices=TYPE_CHOICES, default="baseline")
    source = models.CharField(max_length=155, blank=True, null=True)
    filename_id = models.CharField(
        max_length=50,
        blank=True,
        help_text="The filename id that will be used to compose the raster file path. The pattern will be {}/{}_{}.vrt".format(
            settings.MEDIA_URL, "{filename_id}", "{year}"
        ),
    )
    titiler_url_params = models.CharField(
        max_length=1000,
        blank=True,
        null=True,
        help_text="Additional URL params that should be added to the Titiler URL request by the frontend app.",
    )

    def __str__(self):
        return f"{self.name} - {self.cluster} / {self.type}"

    class Meta:
        ordering = ["id"]
        unique_together = ["name", "type", "cluster"]


class VectorDataset(models.Model):
    name = models.CharField(max_length=155, unique=False)
    description = models.TextField(max_length=2000, null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    cluster = models.ForeignKey(
        Cluster,
        on_delete=models.PROTECT,
    )
    type = models.CharField(max_length=55, choices=TYPE_CHOICES, default="baseline")
    source = models.CharField(max_length=155, blank=True, null=True)

    def __str__(self):
        return f"{self.name} - {self.cluster} / {self.type}"

    class Meta:
        ordering = ["id"]
        unique_together = ["name", "type", "cluster"]


class PMTilesDataset(models.Model):
    name = models.CharField(max_length=155, unique=False)
    description = models.TextField(max_length=2000, null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    cluster = models.ForeignKey(
        Cluster,
        on_delete=models.PROTECT,
    )
    type = models.CharField(max_length=55, choices=TYPE_CHOICES, default="baseline")
    source = models.CharField(max_length=155, blank=True, null=True)
    url = models.CharField(max_length=1550)
    source_layer = models.CharField(max_length=155)

    def __str__(self):
        return f"{self.name} - {self.cluster} / {self.type}"

    class Meta:
        ordering = ["id"]
        unique_together = ["name", "type", "cluster"]
        verbose_name = "PMTiles Dataset"


class VectorItem(models.Model):
    dataset = models.ForeignKey(VectorDataset, on_delete=models.CASCADE)
    name = models.CharField(max_length=155, blank=True, null=True)
    ref = models.CharField(max_length=50, blank=True, null=True)
    attribute = models.CharField(max_length=155, blank=True, null=True)
    province = models.ForeignKey(Province, null=True, on_delete=models.PROTECT)
    area_council = models.ForeignKey(AreaCouncil, null=True, on_delete=models.PROTECT)
    geometry = models.GeometryField()
    metadata = models.JSONField(default=dict, blank=True, null=True)

    def __str__(self):
        if self.name:
            return f"{self.id} ({self.name})"
        else:
            return f"{self.id}"

    class Meta:
        ordering = ["id"]


class TabularDataset(models.Model):
    name = models.CharField(max_length=155, unique=False)
    description = models.TextField(max_length=2000, null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    cluster = models.ForeignKey(
        Cluster,
        on_delete=models.PROTECT,
    )
    type = models.CharField(max_length=55, choices=TYPE_CHOICES, default="baseline")
    source = models.CharField(max_length=155, blank=True, null=True)
    unit = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.name} - {self.cluster} / {self.type}"

    class Meta:
        ordering = ["id"]
        unique_together = ["name", "type", "cluster"]


class TabularItem(models.Model):
    dataset = models.ForeignKey(TabularDataset, on_delete=models.CASCADE)
    date = models.DateField(null=True)
    attribute = models.CharField(max_length=155, blank=True, null=True)
    value = models.FloatField(default=0)
    province = models.ForeignKey(Province, null=True, on_delete=models.PROTECT)
    area_council = models.ForeignKey(AreaCouncil, null=True, on_delete=models.PROTECT)
    metadata = models.JSONField(default=dict)

    def __str__(self):
        return f"{self.id}"

    class Meta:
        ordering = ["id"]
        indexes = [
            models.Index(fields=["dataset", "province", "area_council"]),
        ]

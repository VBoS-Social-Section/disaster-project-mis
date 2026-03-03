"""
Land Accounts data: Physical Account (opening, additions, reductions, closing)
and Change Matrix (land cover transitions) by province.
Stored as JSON to match the frontend structure from Land_Accounts 24.02.26.xlsx.
"""
from django.db import models


class LandAccountsData(models.Model):
    """
    Single-row store for land accounts. Data structure:
    {
      "provinces": {
        "Torba": {
          "physical_account": { "opening": {...}, "additions": {...}, ... },
          "unit": "sqkm",
          "change_matrix": { "Water Bodies": {...}, ... }
        },
        ...
      }
    }
    """
    title = models.CharField(
        max_length=100,
        default="",
        blank=True,
        help_text="e.g. 2020–2023, or a short description of this land account period.",
    )
    data = models.JSONField(
        default=dict,
        help_text="Land accounts by province. Keys: provinces (object).",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Land Accounts Data"
        verbose_name_plural = "Land Accounts Data"

    def __str__(self):
        if self.title:
            return f"{self.title} (updated {self.updated_at.date()})"
        return f"Land Accounts (updated {self.updated_at.date()})"

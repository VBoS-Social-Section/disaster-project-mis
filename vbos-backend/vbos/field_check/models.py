"""
Field check records for damage estimation verification.
Tracks confidence improvement: no record = model, verified/adjusted/rejected = from field.
"""
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _
from vbos.audit.signals import AuditableMixin, log_audit_action, get_field_changes


class FieldCheckRecord(AuditableMixin, models.Model):
    """
    One field verification event for a damage estimate item.
    Confidence is derived from the latest record per item:
    - No record → model (RAP estimate, not checked)
    - verified → field_verified
    - adjusted → field_adjusted
    - rejected → rejected
    """
    STATUS_VERIFIED = "verified"
    STATUS_ADJUSTED = "adjusted"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = [
        (STATUS_VERIFIED, _("Verified")),
        (STATUS_ADJUSTED, _("Adjusted")),
        (STATUS_REJECTED, _("Rejected")),
    ]

    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        limit_choices_to={"model__in": ("tabularitem", "vectoritem")},
    )
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, db_index=True)
    observed_value = models.FloatField(
        null=True,
        blank=True,
        help_text="Field-observed value when status is adjusted.",
    )
    notes = models.TextField(blank=True)

    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="field_check_records",
    )
    verified_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-verified_at"]
        verbose_name = "Field Check Record"
        verbose_name_plural = "Field Check Records"
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]

    def __str__(self):
        return f"{self.get_status_display()} by {self.verified_by.username} at {self.verified_at}"


class FieldCheckAssignment(models.Model):
    """
    Admin-created task: a specific RAP damage estimate that needs field verification.
    Scoped to an Area Council — only users assigned to that council can see and action it.

    Workflow:
      admin creates assignment (pending) →
      field team sees it on mobile (pending / in_progress) →
      field team submits observation (in_progress) →
      mobile sync creates FieldCheckRecord + marks completed
    """

    STATUS_PENDING = "pending"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_COMPLETED = "completed"
    STATUS_SKIPPED = "skipped"
    STATUS_CHOICES = [
        (STATUS_PENDING, _("Pending")),
        (STATUS_IN_PROGRESS, _("In Progress")),
        (STATUS_COMPLETED, _("Completed")),
        (STATUS_SKIPPED, _("Skipped")),
    ]

    PRIORITY_LOW = "low"
    PRIORITY_MEDIUM = "medium"
    PRIORITY_HIGH = "high"
    PRIORITY_CRITICAL = "critical"
    PRIORITY_CHOICES = [
        (PRIORITY_LOW, _("Low")),
        (PRIORITY_MEDIUM, _("Medium")),
        (PRIORITY_HIGH, _("High")),
        (PRIORITY_CRITICAL, _("Critical")),
    ]

    # The RAP item to verify (TabularItem or VectorItem)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        limit_choices_to={"model__in": ("tabularitem", "vectoritem")},
    )
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    area_council = models.ForeignKey(
        "datasets.AreaCouncil",
        on_delete=models.PROTECT,
        related_name="field_check_assignments",
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_field_check_assignments",
    )
    assigned_at = models.DateTimeField(auto_now_add=True)

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True
    )
    priority = models.CharField(
        max_length=20, choices=PRIORITY_CHOICES, default=PRIORITY_MEDIUM
    )
    admin_notes = models.TextField(
        blank=True,
        help_text="Guidance shown to the field assessor on their mobile device.",
    )

    # Set when field team submits the check
    field_check_record = models.ForeignKey(
        FieldCheckRecord,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assignment",
    )
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-assigned_at"]
        verbose_name = "Field Check Assignment"
        verbose_name_plural = "Field Check Assignments"
        indexes = [
            models.Index(fields=["area_council", "status"]),
            models.Index(fields=["content_type", "object_id"]),
        ]

    def __str__(self):
        return (
            f"{self.get_priority_display()} — {self.area_council} "
            f"({self.get_status_display()})"
        )


class ConfidenceSnapshot(models.Model):
    """
    Daily snapshot of field-check coverage for a hazard event.
    Populated by a scheduled task (Celery beat) once per day.
    Enables time-series charts showing confidence improving as field teams deploy.

    confidence_pct = (verified×100 + adjusted×75) / total_items
    coverage_pct   = (verified + adjusted + rejected) / total_items × 100
    """

    event = models.ForeignKey(
        "datasets.CycloneEvent",
        on_delete=models.CASCADE,
        related_name="confidence_snapshots",
    )
    snapshot_date = models.DateField(auto_now_add=True, db_index=True)
    total_items = models.PositiveIntegerField(default=0)
    model_count = models.PositiveIntegerField(default=0)
    verified_count = models.PositiveIntegerField(default=0)
    adjusted_count = models.PositiveIntegerField(default=0)
    rejected_count = models.PositiveIntegerField(default=0)
    coverage_pct = models.FloatField(default=0.0)
    confidence_pct = models.FloatField(default=0.0)

    class Meta:
        unique_together = [("event", "snapshot_date")]
        ordering = ["-snapshot_date"]
        verbose_name = "Confidence Snapshot"
        verbose_name_plural = "Confidence Snapshots"

    def __str__(self):
        return f"{self.event.slug} — {self.snapshot_date} ({self.confidence_pct:.1f}%)"

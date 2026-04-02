"""
Serializer and view for mobile app field check submissions.

The mobile app captures rich per-asset damage observations. This module
maps them onto FieldCheckRecord entries against the relevant TabularItem(s)
for the matching council × sector in the latest published RAP dataset.
"""
from rest_framework import serializers


class MobileFieldCheckSubmitSerializer(serializers.Serializer):
    """Accepts the full JSON payload from the DRMISFieldChecks mobile app."""

    mobile_id = serializers.CharField(max_length=100)
    asset_type = serializers.ChoiceField(choices=[
        "education", "health", "shelter", "telecom",
        "energy", "wash", "food_security", "logistics",
    ])
    asset_id = serializers.CharField(max_length=100)
    asset_name = serializers.CharField(max_length=255)
    province = serializers.CharField(max_length=100)
    council = serializers.CharField(max_length=100)

    roof_damage_condition = serializers.ChoiceField(
        choices=["intact", "minor", "major", "destroyed"]
    )
    roof_damage_percentage = serializers.FloatField(min_value=0, max_value=100)
    roof_damage_notes = serializers.CharField(allow_blank=True, default="")

    wall_damage_condition = serializers.ChoiceField(
        choices=["intact", "minor", "major", "destroyed"]
    )
    wall_damage_percentage = serializers.FloatField(min_value=0, max_value=100)
    wall_damage_notes = serializers.CharField(allow_blank=True, default="")

    functionality = serializers.ChoiceField(
        choices=["usable", "partially_usable", "not_usable"]
    )
    priority = serializers.ChoiceField(
        choices=["low", "medium", "high", "critical"], required=False, default="medium"
    )
    immediate_needs = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )

    gps_latitude = serializers.FloatField(required=False, allow_null=True, default=None)
    gps_longitude = serializers.FloatField(required=False, allow_null=True, default=None)
    gps_accuracy = serializers.FloatField(required=False, allow_null=True, default=None)

    assessor_name = serializers.CharField(max_length=255)
    assessor_id = serializers.CharField(max_length=100)
    team_lead = serializers.CharField(max_length=255, allow_blank=True, default="")

    weather_conditions = serializers.CharField(allow_blank=True, default="")
    access_issues = serializers.CharField(allow_blank=True, default="")
    notes = serializers.CharField(allow_blank=True, default="")

    observed_at = serializers.DateTimeField(required=False, allow_null=True, default=None)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0003_alter_user_first_name"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="appearance",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.CreateModel(
            name="OrgAppearance",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("data", models.JSONField(blank=True, default=dict)),
                ("updated", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Organisation appearance",
                "verbose_name_plural": "Organisation appearance",
            },
        ),
    ]

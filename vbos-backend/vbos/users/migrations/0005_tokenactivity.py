import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("authtoken", "0003_tokenproxy"),
        ("users", "0004_appearance"),
    ]

    operations = [
        migrations.CreateModel(
            name="TokenActivity",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("last_used", models.DateTimeField()),
                (
                    "token",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="activity",
                        to="authtoken.token",
                    ),
                ),
            ],
        ),
    ]

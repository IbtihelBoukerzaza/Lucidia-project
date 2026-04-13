import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("companies", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Post",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("text", models.TextField()),
                (
                    "source",
                    models.CharField(
                        choices=[
                            ("gdelt", "GDELT"),
                            ("rss", "RSS"),
                            ("youtube", "YouTube"),
                            ("twitter", "Twitter"),
                            ("manual", "Manual"),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    "platform",
                    models.CharField(
                        choices=[
                            ("news", "News"),
                            ("social", "Social"),
                        ],
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "external_id",
                    models.CharField(
                        blank=True,
                        help_text="Stable id from the source; used for deduplication per company.",
                        max_length=512,
                        null=True,
                    ),
                ),
                ("url", models.URLField(blank=True, max_length=2048, null=True)),
                ("author", models.CharField(blank=True, max_length=255, null=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="posts",
                        to="companies.company",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="post",
            index=models.Index(
                fields=["company", "-created_at"],
                name="posts_post_company_0fada8_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="post",
            index=models.Index(
                fields=["company", "source"],
                name="posts_post_company_6e3a22_idx",
            ),
        ),
        migrations.AddConstraint(
            model_name="post",
            constraint=models.UniqueConstraint(
                condition=models.Q(external_id__isnull=False),
                fields=("company", "external_id"),
                name="posts_post_company_external_id_uniq",
            ),
        ),
    ]

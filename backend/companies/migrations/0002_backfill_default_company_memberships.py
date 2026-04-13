# Link all existing users to a default company (Phase 1 backfill)

from django.conf import settings
from django.db import migrations


DEFAULT_NAME = "SentivyaDZ Default"
DEFAULT_INDUSTRY = "telecom"


def _get_user_model(apps):
    label, model_name = settings.AUTH_USER_MODEL.split(".")
    return apps.get_model(label, model_name)


def assign_default_company(apps, schema_editor):
    Company = apps.get_model("companies", "Company")
    Membership = apps.get_model("companies", "Membership")
    User = _get_user_model(apps)

    company, _ = Company.objects.get_or_create(
        name=DEFAULT_NAME,
        defaults={"industry": DEFAULT_INDUSTRY},
    )

    for user in User.objects.iterator():
        Membership.objects.get_or_create(
            user=user,
            company=company,
            defaults={"role": "admin"},
        )


def reverse_assign(apps, schema_editor):
    Company = apps.get_model("companies", "Company")
    Membership = apps.get_model("companies", "Membership")
    try:
        company = Company.objects.get(name=DEFAULT_NAME)
        Membership.objects.filter(company=company).delete()
        company.delete()
    except Company.DoesNotExist:
        pass


class Migration(migrations.Migration):

    dependencies = [
        ("companies", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(assign_default_company, reverse_assign),
    ]

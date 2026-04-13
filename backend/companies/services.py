"""Business logic for companies and memberships."""

from django.db import transaction

from .models import Company, Membership

DEFAULT_COMPANY_NAME = "SentivyaDZ Default"
DEFAULT_INDUSTRY = "telecom"


def get_or_create_default_company():
    """Primary tenant used for legacy users and fallbacks."""
    company, _ = Company.objects.get_or_create(
        name=DEFAULT_COMPANY_NAME,
        defaults={"industry": DEFAULT_INDUSTRY},
    )
    return company


@transaction.atomic
def ensure_user_has_membership(user, *, company=None, role=Membership.Role.ADMIN):
    """
    Guarantee a user has at least one company membership.
    If company is omitted, uses the default SentivyaDZ company.
    """
    if not user or not user.pk:
        return None

    if Membership.objects.filter(user=user).exists():
        return Membership.objects.filter(user=user).first()

    target = company or get_or_create_default_company()
    membership, _ = Membership.objects.get_or_create(
        user=user,
        company=target,
        defaults={"role": role},
    )
    return membership


def find_or_create_company_for_access_request(access_request):
    """
    Resolve Company from an approved AccessRequest (organization name + sector as industry).
    """
    name = (access_request.company_name or "").strip()
    if not name:
        return get_or_create_default_company()

    industry = (access_request.sector or DEFAULT_INDUSTRY).strip() or DEFAULT_INDUSTRY

    existing = (
        Company.objects.filter(name__iexact=name).order_by("id").first()
    )
    if existing:
        if existing.industry != industry:
            existing.industry = industry
            existing.save(update_fields=["industry"])
        return existing

    return Company.objects.create(name=name, industry=industry)


@transaction.atomic
def sync_membership_from_access_request(user, access_request, *, role=Membership.Role.ADMIN):
    """
    After access approval: attach user to the company implied by the request.
    """
    company = find_or_create_company_for_access_request(access_request)
    membership, _ = Membership.objects.get_or_create(
        user=user,
        company=company,
        defaults={"role": role},
    )
    return membership

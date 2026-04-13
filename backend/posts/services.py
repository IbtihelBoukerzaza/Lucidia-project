from companies.models import Membership


def company_ids_for_user(user):
    if not user or not user.is_authenticated:
        return []
    return list(
        Membership.objects.filter(user=user).values_list("company_id", flat=True)
    )


def user_can_access_company(user, company_id: int) -> bool:
    return company_id in company_ids_for_user(user)

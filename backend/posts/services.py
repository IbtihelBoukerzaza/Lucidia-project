from companies.models import Membership


def company_ids_for_user(user):
    if not user or not user.is_authenticated:
        return []
    return list(
        Membership.objects.filter(user=user).values_list("company_id", flat=True)
    )


def user_can_access_company(user, company_id: int) -> bool:
    return company_id in company_ids_for_user(user)


def user_role_in_company(user, company_id: int) -> str | None:
    if not user or not user.is_authenticated:
        return None
    membership = (
        Membership.objects.filter(user=user, company_id=company_id)
        .only("role")
        .first()
    )
    return membership.role if membership else None


def user_is_admin_of_company(user, company_id: int) -> bool:
    return user_role_in_company(user, company_id) == Membership.Role.ADMIN

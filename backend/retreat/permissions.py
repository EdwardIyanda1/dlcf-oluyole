from rest_framework.permissions import BasePermission

ROLE_ADMIN        = 'admin'
ROLE_REGISTRATION = 'registration'
ROLE_USHER        = 'usher'
ROLE_MEMBER       = 'member'


def get_role(user):
    """
    Resolve a user's permission level. Any Django is_staff/is_superuser
    account is always treated as 'admin', so existing admin accounts keep
    working without needing a data migration on their profile row.
    """
    if not user or not user.is_authenticated:
        return None
    if user.is_superuser or user.is_staff:
        return ROLE_ADMIN
    profile = getattr(user, 'profile', None)
    return profile.role if profile else ROLE_MEMBER


class HasRole(BasePermission):
    """Base class -- subclass and set `allowed_roles`."""
    allowed_roles = ()

    def has_permission(self, request, view):
        return get_role(request.user) in self.allowed_roles


class IsAdmin(HasRole):
    allowed_roles = (ROLE_ADMIN,)


class IsAdminOrRegistration(HasRole):
    allowed_roles = (ROLE_ADMIN, ROLE_REGISTRATION)


class IsAdminOrUsher(HasRole):
    allowed_roles = (ROLE_ADMIN, ROLE_USHER)


class IsStaffRole(HasRole):
    """Any elevated role: admin, registration unit, or usher (excludes plain church members)."""
    allowed_roles = (ROLE_ADMIN, ROLE_REGISTRATION, ROLE_USHER)

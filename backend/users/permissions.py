from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """Allow access only to admin users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'ADMIN'
        )


class IsSupervisorUser(BasePermission):
    """Allow access only to supervisor users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'SUPERVISOR'
        )


class IsStaffUser(BasePermission):
    """Allow access to ADMIN and SUPERVISOR users (union staff).

    Supervisors get day-to-day loan operations rights — reviewing and
    approving/rejecting applications, recording repayments, monitoring
    defaulters, viewing reports and audit logs — while system
    configuration and user/member lifecycle management stay admin-only.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ('ADMIN', 'SUPERVISOR')
        )


class IsMemberUser(BasePermission):
    """Allow access only to member users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'MEMBER'
        )


class IsOwnerOrAdmin(BasePermission):
    """
    Allow access to the owner of an object or admin users.
    Object must have a `user` attribute or a `member` attribute with a `user` FK.
    """

    def has_object_permission(self, request, view, obj):
        if IsStaffUser().has_permission(request, None):
            return True
        # Check if object has direct user reference
        if hasattr(obj, 'user'):
            return obj.user == request.user
        # Check if object has member reference
        if hasattr(obj, 'member'):
            return obj.member.user == request.user
        return False


class IsMemberOwnerOrAdmin(BasePermission):
    """
    Allow access to the member who owns the data or admin users.
    Used for endpoints like /api/members/{id}/...
    """

    def has_permission(self, request, view, obj=None):
        if IsStaffUser().has_permission(request, None):
            return True
        if obj is None:
            return True
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False

    def has_object_permission(self, request, view, obj):
        if IsStaffUser().has_permission(request, None):
            return True
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'member'):
            return obj.member.user == request.user
        return False

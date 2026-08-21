from .models import AuditLog


class AuditService:
    """Service for creating audit log entries."""

    @staticmethod
    def log_action(user, action, entity_type, entity_id, description,
                   previous_value=None, new_value=None, ip_address=None):
        """Create an audit log entry."""
        return AuditLog.objects.create(
            user=user,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            description=description,
            previous_value=previous_value,
            new_value=new_value,
            ip_address=ip_address,
        )

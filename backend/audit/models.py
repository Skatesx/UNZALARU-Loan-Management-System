from django.db import models

from users.models import User


class AuditLog(models.Model):
    """Audit trail for important administrative actions."""

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=50)
    entity_type = models.CharField(max_length=50)
    entity_id = models.CharField(max_length=50)
    description = models.TextField()
    previous_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'audit log'
        verbose_name_plural = 'audit logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.action} - {self.entity_type} {self.entity_id} by {self.user}'

from django.db import models


class SystemConfig(models.Model):
    """System-wide configuration settings."""

    key = models.CharField(max_length=100, unique=True)
    value = models.JSONField()
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'system config'
        verbose_name_plural = 'system configs'
        ordering = ['key']

    def __str__(self):
        return f'{self.key}: {self.value}'

    @classmethod
    def get_value(cls, key, default=None):
        try:
            config = cls.objects.get(key=key)
            return config.value
        except cls.DoesNotExist:
            return default

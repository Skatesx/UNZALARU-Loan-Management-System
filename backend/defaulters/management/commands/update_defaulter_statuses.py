from django.core.management.base import BaseCommand

from defaulters.services import DefaulterDetectionService


class Command(BaseCommand):
    help = 'Update defaulter classifications for all active loans'

    def handle(self, *args, **options):
        service = DefaulterDetectionService()
        updated = service.update_statuses()
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {updated} defaulter statuses')
        )

import pytest
from decimal import Decimal
from datetime import date, timedelta

from defaulters.services import DefaulterDetectionService


@pytest.mark.django_db
class TestDefaulterDetection:
    """Test defaulter detection service."""

    def test_classify_current(self):
        """0 days overdue should be classified as CURRENT."""
        service = DefaulterDetectionService()
        assert service.classify(0) == 'CURRENT'

    def test_classify_at_risk(self):
        """1-30 days overdue should be classified as AT_RISK."""
        service = DefaulterDetectionService()
        assert service.classify(1) == 'AT_RISK'
        assert service.classify(15) == 'AT_RISK'
        assert service.classify(30) == 'AT_RISK'

    def test_classify_defaulter(self):
        """31-60 days overdue should be classified as DEFAULTER."""
        service = DefaulterDetectionService()
        assert service.classify(31) == 'DEFAULTER'
        assert service.classify(45) == 'DEFAULTER'
        assert service.classify(60) == 'DEFAULTER'

    def test_classify_severe_defaulter(self):
        """61+ days overdue should be classified as SEVERE_DEFAULTER."""
        service = DefaulterDetectionService()
        assert service.classify(61) == 'SEVERE_DEFAULTER'
        assert service.classify(90) == 'SEVERE_DEFAULTER'
        assert service.classify(365) == 'SEVERE_DEFAULTER'

    def test_calculate_days_overdue(self):
        """Days overdue should be correctly calculated."""
        service = DefaulterDetectionService()

        # Future date - should be 0
        future_date = date.today() + timedelta(days=5)
        assert service.calculate_days_overdue(future_date) == 0

        # Past date - should be positive
        past_date = date.today() - timedelta(days=10)
        assert service.calculate_days_overdue(past_date) == 10

        # Today - should be 0
        assert service.calculate_days_overdue(date.today()) == 0


@pytest.mark.django_db
class TestDailyRefresh:
    """Overdue statuses refresh by themselves once per day."""

    def test_runs_once_per_day(self, monkeypatch):
        from defaulters.services import DefaulterDetectionService

        calls = []
        monkeypatch.setattr(DefaulterDetectionService, 'update_statuses', lambda self: calls.append(1))
        service = DefaulterDetectionService()
        assert service.refresh_daily() is True
        assert service.refresh_daily() is False
        assert len(calls) == 1

    def test_dashboard_triggers_refresh(self, auth_client_admin, monkeypatch):
        from defaulters.services import DefaulterDetectionService

        calls = []
        monkeypatch.setattr(DefaulterDetectionService, 'update_statuses', lambda self: calls.append(1))
        auth_client_admin.get('/api/dashboard/admin/summary/')
        auth_client_admin.get('/api/defaulters/')
        assert len(calls) == 1  # first visit of the day only

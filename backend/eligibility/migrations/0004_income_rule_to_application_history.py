from django.db import migrations

# Fewer earlier applications score higher, so first-time applicants get priority
APPLICATION_HISTORY_THRESHOLDS = [
    {'min': 0, 'max': 0, 'score': 100},
    {'min': 1, 'max': 1, 'score': 70},
    {'min': 2, 'max': 2, 'score': 40},
    {'min': 3, 'max': None, 'score': 10},
]


def income_to_application_history(apps, schema_editor):
    """Replace the Income scoring rule with Application History.

    Income is no longer collected, so the rule keeps its weight but now
    scores how many times the member has applied for a loan before.
    """
    EligibilityRule = apps.get_model('eligibility', 'EligibilityRule')
    if EligibilityRule.objects.filter(factor='APPLICATION_HISTORY').exists():
        EligibilityRule.objects.filter(factor='INCOME').delete()
        return
    EligibilityRule.objects.filter(factor='INCOME').update(
        factor='APPLICATION_HISTORY',
        name='Application History',
        thresholds=APPLICATION_HISTORY_THRESHOLDS,
    )


def application_history_to_income(apps, schema_editor):
    EligibilityRule = apps.get_model('eligibility', 'EligibilityRule')
    EligibilityRule.objects.filter(factor='APPLICATION_HISTORY').update(
        factor='INCOME',
        name='Income Score',
        thresholds=[
            {'min': 0, 'max': 3000, 'score': 20},
            {'min': 3001, 'max': 8000, 'score': 50},
            {'min': 8001, 'max': 15000, 'score': 75},
            {'min': 15001, 'max': None, 'score': 100},
        ],
    )


class Migration(migrations.Migration):

    dependencies = [
        ('eligibility', '0003_alter_eligibilityrule_factor'),
    ]

    operations = [
        migrations.RunPython(
            income_to_application_history, application_history_to_income
        ),
    ]

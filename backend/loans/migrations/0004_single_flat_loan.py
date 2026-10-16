from django.db import migrations

FLAT_LOAN = {
    'name': 'Flat Loan',
    'description': (
        'UNZALARU members qualify by membership. Borrow K10,000, K15,000 or '
        'K20,000 at 10% interest charged once, repaid over 1-12 months.'
    ),
    'min_amount': 10000,
    'max_amount': 20000,
    'allowed_amounts': [10000, 15000, 20000],
    'min_duration_months': 1,
    'max_duration_months': 12,
    'interest_rate': 10,
    'interest_method': 'FLAT_ONCE',
    'allow_multiple_active': False,
    'is_active': True,
}


def use_single_flat_loan(apps, schema_editor):
    """UNZALARU has one loan product; retire the old loan types.

    Old types are deactivated rather than deleted so existing loans keep
    their history.
    """
    LoanType = apps.get_model('loans', 'LoanType')
    flat, _ = LoanType.objects.update_or_create(name='Flat Loan', defaults=FLAT_LOAN)
    LoanType.objects.exclude(pk=flat.pk).update(is_active=False)


def restore_loan_types(apps, schema_editor):
    LoanType = apps.get_model('loans', 'LoanType')
    LoanType.objects.exclude(name='Flat Loan').update(is_active=True)
    LoanType.objects.filter(name='Flat Loan').update(is_active=False)


class Migration(migrations.Migration):

    dependencies = [
        ('loans', '0003_loantype_allowed_amounts_and_more'),
    ]

    operations = [
        migrations.RunPython(use_single_flat_loan, restore_loan_types),
    ]

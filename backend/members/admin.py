from django.contrib import admin

from .models import Member


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = [
        'member_id', 'user', 'nrc_number', 'department',
        'employment_status', 'monthly_income', 'income_verified',
        'membership_status', 'account_status', 'created_at',
    ]
    list_filter = ['department', 'employment_status', 'membership_status', 'account_status']
    search_fields = ['member_id', 'nrc_number', 'user__first_name', 'user__last_name', 'user__email']
    readonly_fields = ['member_id', 'created_at', 'updated_at']

from django.contrib import admin
from .models import Report

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('reporter', 'category', 'reviewed', 'action_taken', 'created_at')
    list_filter = ('category', 'reviewed', 'action_taken', 'created_at')
    search_fields = ('reporter__nickname', 'evidence')
    readonly_fields = ('id', 'created_at')
    
    actions = ['mark_as_reviewed', 'take_warning_action', 'take_ban_action']
    
    def mark_as_reviewed(self, request, queryset):
        queryset.update(reviewed=True)
    
    def take_warning_action(self, request, queryset):
        queryset.update(action_taken='warning', reviewed=True)
    
    def take_ban_action(self, request, queryset):
        queryset.update(action_taken='ban', reviewed=True)

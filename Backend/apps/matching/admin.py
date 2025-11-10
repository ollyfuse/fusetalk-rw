from django.contrib import admin
from .models import MatchQueue

@admin.register(MatchQueue)
class MatchQueueAdmin(admin.ModelAdmin):
    list_display = ('user', 'vibe_tag', 'language', 'is_visitor', 'created_at')
    list_filter = ('vibe_tag', 'language', 'is_visitor', 'created_at')
    search_fields = ('user__nickname',)
    readonly_fields = ('id', 'created_at')

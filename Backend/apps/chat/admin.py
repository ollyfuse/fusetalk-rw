from django.contrib import admin
from .models import ChatSession, Message, FuseMoment

@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'session_type', 'user_a', 'user_b', 'status', 'started_at', 'created_at')
    list_filter = ('session_type', 'status', 'language', 'created_at')
    search_fields = ('user_a__nickname', 'user_b__nickname', 'topic_tag')
    readonly_fields = ('id', 'created_at')

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('session', 'sender', 'content_preview', 'is_flagged', 'created_at')
    list_filter = ('is_flagged', 'created_at')
    search_fields = ('sender__nickname', 'content')
    readonly_fields = ('id', 'created_at')
    
    def content_preview(self, obj):
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content

@admin.register(FuseMoment)
class FuseMomentAdmin(admin.ModelAdmin):
    list_display = ('user_a', 'user_b', 'summary_text', 'contact_exchanged', 'created_at')
    list_filter = ('contact_exchanged', 'created_at')
    search_fields = ('user_a__nickname', 'user_b__nickname', 'summary_text')
    readonly_fields = ('id', 'created_at')

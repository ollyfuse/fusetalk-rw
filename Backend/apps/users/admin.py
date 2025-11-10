from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'nickname', 'email', 'verified', 'phone_verified', 'created_at')
    list_filter = ('verified', 'phone_verified', 'created_at')
    search_fields = ('username', 'nickname', 'email')
    
    # Override fieldsets completely to avoid conflicts
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email')}),
        ('FuseTalk Profile', {
            'fields': ('nickname', 'phone', 'phone_verified', 'verified', 'avatar_url', 'country', 'language_prefs')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'nickname', 'password1', 'password2'),
        }),
    )

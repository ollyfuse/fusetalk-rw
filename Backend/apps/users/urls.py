"""
User authentication URL configuration.
"""

from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    path('guest/', views.guest_register, name='guest_register'),
    path('profile/', views.profile, name='profile'),
    path('health/', views.health_check, name='health_check'),
]

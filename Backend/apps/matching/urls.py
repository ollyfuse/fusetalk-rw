"""
Matching app URL configuration.
Following RESTful API design principles.
"""

from django.urls import path
from . import views

app_name = 'matching'

urlpatterns = [
    # Core matching endpoints
    path('join/', views.JoinQueueView.as_view(), name='join_queue'),
    path('leave/', views.LeaveQueueView.as_view(), name='leave_queue'),

    # Monitoring endpoints
    path('stats/', views.QueueStatsView.as_view(), name='queue_stats'),
    path('health/', views.health_check, name='health_check'),
]
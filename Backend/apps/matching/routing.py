"""
WebSocket routing for matching service
Handles real-time match notifications.
"""

from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/matching/', consumers.MatchingConsumer.as_asgi(), name='matching_ws'),
    ]
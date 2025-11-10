"""
WebSocket routing for chat service.
"""

from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/chat/<uuid:session_id>/', consumers.ChatConsumer.as_asgi(), name='chat_ws'),
    path('ws/signaling/<uuid:session_id>/', consumers.SignalingConsumer.as_asgi(), name='signaling_ws'),
]

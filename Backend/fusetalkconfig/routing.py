"""
ASGI routing configuration for WebSocket connections.
Handles real-time communication for matching and chat.
"""

from django.urls import path
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

from apps.chat.routing import websocket_urlpatterns as chat_patterns
from apps.matching.routing import websocket_urlpatterns as matching_patterns

# Combine all WebSocket URL patterns
websocket_urlpatterns = chat_patterns + matching_patterns

application = ProtocolTypeRouter({
    'websocket': AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})

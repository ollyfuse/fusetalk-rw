"""
WebSocket consumer for real-time matching notifications.
Notifies users when they get matched or queue status changes.
"""

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger(__name__)

class MatchingConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for matching notifications.
    Users connect to receive real-time match updates.
    """

    async def connect(self):  # Fixed: proper indentation
        """Handle WebSocket connection."""
        self.user = self.scope['user']
        
        if self.user.is_anonymous:
            await self.close(code=4001)  # Custom close code for unauthorized
            return
        
        # Join user-specific group for notifications
        self.user_group_name = f'user_{self.user.id}'
        
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        logger.info(f"User {self.user.nickname} connected to matching WebSocket")

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        if hasattr(self, 'user_group_name'):
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )

        logger.info(f"User {self.user.nickname} disconnected from matching WebSocket")

    async def receive(self, text_data):
        """Handle messages from WebSocket (heartbeat, etc.)."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'unknown')

            if message_type == 'heartbeat':
                await self.send(text_data=json.dumps({
                    'type': 'heartbeat_response',
                    'status': 'alive'
                }))
                
        except json.JSONDecodeError:
            logger.warning(f"Invalid JSON received from {self.user.nickname}")

    # Message handlers for different notification types
    async def match_found(self, event):
        """Send match found notification."""
        await self.send(text_data=json.dumps({
            'type': 'match_found',
            'session_id': event['session_id'],
            'matched_user': event['matched_user'],
            'message': event['message']
        }))

    async def queue_update(self, event):
        """Send queue position update."""
        await self.send(text_data=json.dumps({
            'type': 'queue_update',
            'position': event['position'],
            'message': event['message']
        }))

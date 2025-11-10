import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatSession, Message

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        
        if self.user.is_anonymous:
            await self.close(code=4001)
            return
            
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.session_group_name = f'chat_{self.session_id}'

        # Check if session exists and user is part of it
        session_exists = await self.check_session_access()
        if not session_exists:
            await self.close(code=4003)  # Forbidden
            return

        await self.channel_layer.group_add(
            self.session_group_name,
            self.channel_name
        )
        await self.accept()

    @database_sync_to_async
    def check_session_access(self):
        try:
            session = ChatSession.objects.get(id=self.session_id)
            return session.user_a == self.user or session.user_b == self.user
        except ChatSession.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, content):
        try:
            session = ChatSession.objects.get(id=self.session_id)
            Message.objects.create(
                session=session,
                sender=self.user,
                content=content
            )
        except ChatSession.DoesNotExist:
            pass

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.session_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data['type']

        if message_type == 'chat_message':
            await self.handle_chat_message(data)
        elif message_type == 'typing':
            await self.handle_typing(data)

    async def handle_chat_message(self, data):
        content = data['content']
        
        # Save message to database
        await self.save_message(content)
        
        # Send message to group
        await self.channel_layer.group_send(
            self.session_group_name,
            {
                'type': 'chat_message',
                'content': content,
                'sender': data['sender'],
                'timestamp': data['timestamp']
            }
        )

    async def handle_typing(self, data):
        await self.channel_layer.group_send(
            self.session_group_name,
            {
                'type': 'typing_indicator',
                'user': self.user.nickname,
                'is_typing': data['is_typing']
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    async def typing_indicator(self, event):
        await self.send(text_data=json.dumps(event))

class SignalingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        
        # Add authentication check
        if self.user.is_anonymous:
            await self.close(code=4001)
            return
            
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.signaling_group_name = f'signaling_{self.session_id}'

        # Check if user has access to this session
        session_exists = await self.check_session_access()
        if not session_exists:
            await self.close(code=4003)  # Forbidden
            return

        await self.channel_layer.group_add(
            self.signaling_group_name,
            self.channel_name
        )
        await self.accept()
        
        print(f"User {self.user.nickname} connected to signaling for session {self.session_id}")

    @database_sync_to_async
    def check_session_access(self):
        try:
            from .models import ChatSession
            session = ChatSession.objects.get(id=self.session_id)
            return session.user_a == self.user or session.user_b == self.user
        except ChatSession.DoesNotExist:
            return False

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.signaling_group_name,
            self.channel_name
        )
        print(f"User {self.user.nickname} disconnected from signaling")

    async def receive(self, text_data):
        data = json.loads(text_data)
        
        print(f"Signaling message from {self.user.nickname}: {data.get('type')}")
        
        # Forward signaling data to other peer
        await self.channel_layer.group_send(
            self.signaling_group_name,
            {
                'type': 'signaling_message',
                'data': data,
                'sender': self.channel_name
            }
        )

    async def signaling_message(self, event):
        # Don't send message back to sender
        if event['sender'] != self.channel_name:
            await self.send(text_data=json.dumps(event['data']))

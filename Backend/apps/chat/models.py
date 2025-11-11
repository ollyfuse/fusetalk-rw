import uuid
from django.db import models
from django.conf import settings

class ChatSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    SESSION_TYPE_CHOICES = [
        ('text', 'Text Only'),
        ('video', 'Video Chat'),
    ]
    session_type = models.CharField(max_length=10, choices=SESSION_TYPE_CHOICES, default='text')
    
    # Participants
    user_a = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sessions_as_a')
    user_b = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sessions_as_b', null=True, blank=True)
    
    # Session details
    topic_tag = models.CharField(max_length=50, blank=True, null=True)
    language = models.CharField(max_length=20, default='mixed')
    
    STATUS_CHOICES = [
        ('waiting', 'Waiting for Match'),
        ('active', 'Active'),
        ('ended', 'Ended'),
        ('flagged', 'Flagged'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')
    
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'chat_sessions'

class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    is_flagged = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'messages'
        ordering = ['created_at']

class FuseMoment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_a = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='fuse_moments_as_a')
    user_b = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='fuse_moments_as_b')
    session = models.OneToOneField(ChatSession, on_delete=models.CASCADE, related_name='fuse_moment')
    summary_text = models.CharField(max_length=140)
    contact_exchanged = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'fuse_moments'

class SessionLike(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'session_likes'
        unique_together = [['session', 'user']]


class ContactExchange(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fuse_moment = models.ForeignKey(FuseMoment, on_delete=models.CASCADE, related_name='contact_exchanges')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_contacts')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_contacts')
    
    whatsapp = models.CharField(max_length=20, blank=True)
    instagram = models.CharField(max_length=50, blank=True)
    telegram = models.CharField(max_length=50, blank=True)
    note = models.TextField(max_length=200, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'contact_exchanges'
        unique_together = [['fuse_moment', 'sender']]


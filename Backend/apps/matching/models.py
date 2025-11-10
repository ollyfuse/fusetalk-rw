import uuid
from django.db import models
from django.conf import settings

class MatchQueue(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    VIBE_TAG_CHOICES = [
        ('music', 'Music'),
        ('tech', 'Tech'),
        ('jokes', 'Jokes'),
        ('relationships', 'Relationships'),
        ('travel', 'Travel'),
        ('random', 'Random'),
    ]
    vibe_tag = models.CharField(max_length=20, choices=VIBE_TAG_CHOICES, default='random')
    language = models.CharField(max_length=20, default='mixed')
    
    is_visitor = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'match_queue'
        ordering = ['created_at']

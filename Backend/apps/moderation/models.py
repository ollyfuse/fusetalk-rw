import uuid
from django.db import models
from django.conf import settings

class Report(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reports_made')
    reported_session = models.ForeignKey('chat.ChatSession', on_delete=models.CASCADE)
    
    CATEGORY_CHOICES = [
        ('nudity', 'Nudity'),
        ('harassment', 'Harassment'),
        ('spam', 'Spam'),
        ('underage', 'Underage Suspicion'),
        ('other', 'Other'),
    ]
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    evidence = models.TextField(blank=True, null=True)
    
    reviewed = models.BooleanField(default=False)
    ACTION_CHOICES = [
        ('none', 'No Action'),
        ('warning', 'Warning'),
        ('ban', 'Ban User'),
    ]
    action_taken = models.CharField(max_length=10, choices=ACTION_CHOICES, default='none')
    
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'reports'

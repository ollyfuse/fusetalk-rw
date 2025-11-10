import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nickname = models.CharField(max_length=50, unique=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    phone_verified = models.BooleanField(default=False)
    verified = models.BooleanField(default=False)
    avatar_url = models.URLField(blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    language_prefs = models.CharField(max_length=20, default='mixed')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nickname or self.username

    class Meta:
        db_table = 'users'

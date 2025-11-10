"""
Matching API serializers for request/response validation.
Following DRF best practices for clean API design.
"""

from rest_framework import serializers
from .models import MatchQueue

class JoinQueueSerializer(serializers.Serializer):
    """Serializer for joning the match Queue."""

    vibe_tag = serializers.ChoiceField(
        choices=MatchQueue.VIBE_TAG_CHOICES, 
        default='random',
        help_text="Topic preference for matching"
        )
    
    language = serializers.ChoiceField(
        choices=[
            ('kinyarwanda', "Kinyarwanda"),
            ('english', 'English'),
            ('french', 'French'),
            ('mixed', 'Mixed')
        ],
        default='mixed',
        help_text="Language preference"
    )

    is_visitor = serializers.BooleanField(
        default=False,
        help_text="Whether user is visiting Rwanda"
    )

class MatchResponseSerializer(serializers.Serializer):
    """Serializer for match response data."""

    status = serializers.ChoiceField(choices=['queued', 'matched'])
    session_id = serializers.UUIDField(allow_null=True)
    matched_user = serializers.CharField(max_length=50, required=False)
    queue_position = serializers.IntegerField(required=False)
    message = serializers.CharField(max_length=200, required=False)

class QueueStatsSerializer(serializers.Serializer):
    """Serializer for queue statistics."""

    total_waiting = serializers.IntegerField()
    by_vibe_tag = serializers.DictField()
    visitors_waiting = serializers.IntegerField()
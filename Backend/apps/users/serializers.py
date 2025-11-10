"""
User authentication serializers.
Handles guest registration and user authentication.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
import uuid

User = get_user_model()

class GuestRegistrationSerializer(serializers.Serializer):
    """Serializer for guest user registration."""

    nickname = serializers.CharField(
        max_length=50,  
        help_text="Display name for the chat"
    )

    is_visitor = serializers.BooleanField(
        default=False,
        help_text="Whether user is visiting Rwanda"
    )

    def validate_nickname(self, value):
        """Ensure nickname is unique."""
        if User.objects.filter(nickname=value).exists():
            raise serializers.ValidationError("This nickname is already taken.")
        return value
    
    def create(self, validated_data):
        """Create a guest user account."""
        # Generate unique username for guest
        username = f"guest_{uuid.uuid4().hex[:8]}"

        user = User.objects.create_user(
            username=username,
            nickname=validated_data['nickname'],
            # Guest users don't need email/password  
        )

        return user
    
class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile data."""  

    class Meta:
        model = User
        fields = [
            'id', 'username', 'nickname', 'email', 'verified', 'phone_verified', 
            'avatar_url', 'country', 'language_prefs', 'created_at'  
        ]
        read_only_fields = ['id', 'username', 'created_at', 'verified', 'phone_verified']  

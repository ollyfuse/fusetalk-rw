"""
User authentication and profile views
Handles guest registration. and user management.
"""

import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate

from .serializers import GuestRegistrationSerializer, UserProfileSerializer

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])  # Public endpoint
def guest_register(request):
    """
    POST /api/auth/guest
    Create a guest user account with just a nickname.
    """
    serializer = GuestRegistrationSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            {'error': 'Invalid data', 'details': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Create guest user
        user = serializer.save()
        
        # Create authentication token
        token, created = Token.objects.get_or_create(user=user)
        
        # Return user data and token
        user_serializer = UserProfileSerializer(user)
        
        logger.info(f"Guest user created: {user.nickname}")
        
        return Response({
            'user': user_serializer.data,
            'token': token.key,
            'message': f'Welcome {user.nickname}! You can now start chatting.'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Guest registration error: {str(e)}")
        return Response(
            {'error': 'Registration failed'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    """
    GET /api/auth/profile
    Get current user profile.
    """
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Simple health check for auth service."""
    return Response({
        'status': 'healthy',
        'service': 'auth'
    })
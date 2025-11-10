"""
Matching API views following REST principles.
Uses DRF class-based views for clean, maintainable code.
"""

import logging
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.utils import timezone

from .services import MatchingService
from .serializers import (
    JoinQueueSerializer,
    MatchResponseSerializer,
    QueueStatsSerializer
)

User = get_user_model()
logger = logging.getLogger(__name__)

class JoinQueueView(APIView):
    """
    POST /api/match/join
    Add user to matching queue and attempt to find a match.
    """
    permission_classes =[IsAuthenticated]

    def post(self, request):
        """Handle queue join requests."""
        serializer = JoinQueueSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'error': 'Invalid data', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            # Use our service layer for business logic
            result = MatchingService.join_queue(
                user=request.user,
                vibe_tag=serializer.validated_data['vibe_tag'],
                language=serializer.validated_data['language'],
                is_visitor=serializer.validated_data['is_visitor']
            )

            # Add user-friendly message
            if result['status'] == 'matched':
                result['message'] = f"Great! You're matched with {result['matched_user']}"
            else:
                result['message'] = f"You're in queue (position {result['queue_position']})"

            # Serializer response
            response_serializer = MatchResponseSerializer(result)

            logger.info(f"Queue join: {request.user.nickname} - {result['status']}")

            return Response(
                response_serializer.data,
                status=status.HTTP_200_OK
            )
        
        except Exception as e:
            logger.error(f"Queue join error for {request.user.nickname}: {str(e)}")
            return Response(
                {'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class LeaveQueueView(APIView):
    """
    POST /api/match/leave
    Remove user from matching queue.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Handle queue leave requests."""
        try:
            success = MatchingService.leave_queue(request.user)

            if success:
                return Response(
                    {'message': 'Successfully left the queue'}, status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'message': 'You were not in the queue'}, status=status.HTTP_200_OK
                )
            
        except Exception as e:
            logger.error(f"Queue leave error for {request.user.nickname}: {str(e)}")
            return Response(
                {'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class QueueStatsView(APIView):
    """
    GET /api/match/stats
    Get current queue statistics (for admin/monitoring).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get queue statistics."""
        try:
            stats = MatchingService.get_queue_stats()
            serializer = QueueStatsSerializer(stats)

            return Response(
                serializer.data,
                status=status.HTTP_200_OK
                )
        
        except Exception as e:
            logger.error(f"Queue stats error: {str(e)}")
            return Response(
                {'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
# Simple function-based view for health check
@api_view(['GET'])
def health_check(request):
    """Simple health check endpoint."""
    return Response({
        'status': 'healthy',
        'service': 'matching',
        'timestamp': timezone.now().isoformat()
    })
""" Matching service layer - handles all macthing business logic.
This follows the Service Layer pattern for clean architecture."""

import logging
from typing import Optional, Tuple
from django.db import transaction, models
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import MatchQueue
from apps.chat.models import ChatSession
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

User = get_user_model()
logger = logging.getLogger(__name__)

class MatchingService:
    """
    Core matching business logic. 
    Handles queue management and user pairing algorithm.
    """
    
    @staticmethod
    def _find_match(vibe_tag: str, language: str, is_visitor: bool) -> Optional[MatchQueue]:
        """
        Find a compatible user in the queue. Matching algorithm prioritizes:
        1. Same vibe tag OR random
        2. Compatible language
        3. Visitor/local pairing preference
        """
        base_queue = MatchQueue.objects.select_related('user')

        # Priority 1: Exact vibe tag match
        if vibe_tag != 'random':
            match = base_queue.filter(vibe_tag=vibe_tag).first()
            if match and MatchingService._is_language_compatible(language, match.language):
                return match
        
        # Priority 2: Random tag users (always compatible)
        match = base_queue.filter(vibe_tag='random').first()
        if match and MatchingService._is_language_compatible(language, match.language):
            return match
        
        # Priority 3: Any compatible language match
        for queue_entry in base_queue.all():
            if MatchingService._is_language_compatible(language, queue_entry.language):
                return queue_entry
            
        return None
        
    @staticmethod
    def _is_language_compatible(lang1: str, lang2: str) -> bool:
        """ Check if two language preferences are compatible. """
        if lang1 == 'mixed' or lang2 == 'mixed':
            return True
        return lang1 == lang2
    
    @staticmethod
    def _create_session(user_a: User, user_b: User, vibe_tag: str, language: str) -> ChatSession:
        """ Create a new chat session between matched users. """
        return ChatSession.objects.create(
            user_a=user_a,
            user_b=user_b,
            topic_tag=vibe_tag,
            language=language,
            status='active',
            started_at=timezone.now()
        )
    
    @staticmethod
    def _get_queue_position(queue_entry: MatchQueue) -> int:
        """Get user's position in queue (for UI feedback). """
        return MatchQueue.objects.filter(created_at__lt=queue_entry.created_at).count() + 1
    
    @staticmethod
    def leave_queue(user: User) -> bool:
        """Remove user from matching queue."""
        delete_count, _ = MatchQueue.objects.filter(user=user).delete()

        if delete_count > 0:
            logger.info(f"User {user.nickname} left queue")
            return True
        return False 
    

    @staticmethod
    def get_queue_stats() -> dict:
        """Get current queue statistics (for admin/monitoring)."""
        return {
            'total_waiting': MatchQueue.objects.count(),
            'by_vibe_tag': dict(
                MatchQueue.objects.values_list('vibe_tag').annotate(count=models.Count('id'))   
            ),
            'visitors_waiting': MatchQueue.objects.filter(is_visitor=True).count()
        }
    
    @staticmethod
    def join_queue(user: User, vibe_tag: str = 'random', 
               language: str = 'mixed', is_visitor: bool = False) -> dict:
        with transaction.atomic():
            # Remove user from any existing queue entries
            MatchQueue.objects.filter(user=user).delete()
            
            # End any existing waiting sessions for this user (CRITICAL FIX)
            ChatSession.objects.filter(
                user_a=user, 
                status='waiting'
            ).update(status='ended', ended_at=timezone.now())
            
            # Also end sessions where user is user_b (NEW FIX)
            ChatSession.objects.filter(
                user_b=user,
                status__in=['waiting', 'active']
            ).update(status='ended', ended_at=timezone.now())

            # Find existing waiting session (with exclude_user fix)
            waiting_session = MatchingService._find_waiting_session(vibe_tag, language, is_visitor, user)

            if waiting_session:
                # Join existing session
                waiting_session.user_b = user
                waiting_session.status = 'active'
                waiting_session.started_at = timezone.now()
                waiting_session.save()

                # Notify both users
                MatchingService._notify_match_found(waiting_session.user_a, user, waiting_session)

                logger.info(f"Match found: {user.nickname} <-> {waiting_session.user_a.nickname}")

                return {
                    'status': 'matched',
                    'session_id': str(waiting_session.id),
                    'matched_user': waiting_session.user_a.nickname
                }
            
            # No waiting session found, create new waiting session
            session = ChatSession.objects.create(
                user_a=user,
                topic_tag=vibe_tag,
                language=language,
                status='waiting'
            )

            logger.info(f"User {user.nickname} created waiting session")

            return {
                'status': 'queued',
                'session_id': str(session.id),
                'queue_position': 1
            }

    @staticmethod
    def _find_waiting_session(vibe_tag: str, language: str, is_visitor: bool, exclude_user: User) -> Optional[ChatSession]:
        waiting_sessions = ChatSession.objects.filter(
            status='waiting',
            user_b__isnull=True
        ).exclude(user_a=exclude_user).select_for_update().order_by('created_at')

        # Priority 1: Exact vibe match
        if vibe_tag != 'random':
            session = waiting_sessions.filter(topic_tag=vibe_tag).first()
            if session and MatchingService._is_language_compatible(language, session.language):
                return session
        
        # Priority 2: Random sessions
        session = waiting_sessions.filter(topic_tag='random').first()
        if session and MatchingService._is_language_compatible(language, session.language):
            return session
        
        # Priority 3: Any compatible session
        session = waiting_sessions.first()
        if session and MatchingService._is_language_compatible(language, session.language):
            return session
                
        return None


    @staticmethod
    def _notify_match_found(user_a: User, user_b: User, session):
        """Send WebSocket notifications to both matched users."""
        channel_layer = get_channel_layer()
        
        # Notify user A
        async_to_sync(channel_layer.group_send)(
            f'user_{user_a.id}',
            {
                'type': 'match_found',
                'session_id': str(session.id),
                'matched_user': user_b.nickname,
                'message': f'Great! You\'re matched with {user_b.nickname}'
            }
        )
        
        # Notify user B
        async_to_sync(channel_layer.group_send)(
            f'user_{user_b.id}',
            {
                'type': 'match_found',
                'session_id': str(session.id),
                'matched_user': user_a.nickname,
                'message': f'Great! You\'re matched with {user_a.nickname}'
            }
        )
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import models
from .models import ChatSession, SessionLike, FuseMoment, ContactExchange


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_session(request, session_id):
    """Like a chat session - creates Fuse Moment if mutual"""
    try:
        session = get_object_or_404(ChatSession, id=session_id)
        
        # Check if user is part of this session
        if request.user not in [session.user_a, session.user_b]:
            return Response({'error': 'Not authorized'}, status=403)
        
        # Create or get like
        like, created = SessionLike.objects.get_or_create(
            session=session,
            user=request.user
        )
        
        if not created:
            return Response({'message': 'Already liked'}, status=200)
        
        # Check for mutual like
        other_user = session.user_b if request.user == session.user_a else session.user_a
        mutual_like = SessionLike.objects.filter(session=session, user=other_user).exists()
        
        if mutual_like:
            # Create Fuse Moment!
            fuse_moment, created = FuseMoment.objects.get_or_create(
                session=session,
                defaults={
                    'user_a': session.user_a,
                    'user_b': session.user_b,
                    'summary_text': f'Great conversation between {session.user_a.nickname} and {session.user_b.nickname}!'
                }
            )
            
            return Response({
                'message': 'Fuse Moment created!',
                'fuse_moment': True,
                'fuse_moment_id': str(fuse_moment.id)
            }, status=201)
        
        return Response({
            'message': 'Session liked',
            'fuse_moment': False
        }, status=201)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def share_contact(request, fuse_moment_id):
    """Share contact info for a Fuse Moment"""
    try:
        fuse_moment = get_object_or_404(FuseMoment, id=fuse_moment_id)
        
        # Check if user is part of this fuse moment
        if request.user not in [fuse_moment.user_a, fuse_moment.user_b]:
            return Response({'error': 'Not authorized'}, status=403)
        
        # Get receiver
        receiver = fuse_moment.user_b if request.user == fuse_moment.user_a else fuse_moment.user_a
        
        # Create contact exchange
        contact_exchange, created = ContactExchange.objects.get_or_create(
            fuse_moment=fuse_moment,
            sender=request.user,
            receiver=receiver,
            defaults={
                'whatsapp': request.data.get('whatsapp', ''),
                'instagram': request.data.get('instagram', ''),
                'telegram': request.data.get('telegram', ''),
                'note': request.data.get('note', ''),
            }
        )
        
        if not created:
            # Update existing
            contact_exchange.whatsapp = request.data.get('whatsapp', '')
            contact_exchange.instagram = request.data.get('instagram', '')
            contact_exchange.telegram = request.data.get('telegram', '')
            contact_exchange.note = request.data.get('note', '')
            contact_exchange.save()
        
        # Mark contact as exchanged
        fuse_moment.contact_exchanged = True
        fuse_moment.save()
        
        return Response({'message': 'Contact shared successfully'}, status=201)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_fuse_moments(request):
    """Get user's Fuse Moments"""
    try:
        fuse_moments = FuseMoment.objects.filter(
            models.Q(user_a=request.user) | models.Q(user_b=request.user)
        ).select_related('user_a', 'user_b', 'session').order_by('-created_at')
        
        data = []
        for moment in fuse_moments:
            data.append({
                'id': str(moment.id),
                'user_a': {'nickname': moment.user_a.nickname},
                'user_b': {'nickname': moment.user_b.nickname},
                'summary_text': moment.summary_text,
                'contact_exchanged': moment.contact_exchanged,
                'created_at': moment.created_at.isoformat(),
                'session': {
                    'id': str(moment.session.id),
                    'topic_tag': moment.session.topic_tag,
                }
            })
        
        return Response({'results': data}, status=200)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


from django.urls import path
from . import views

urlpatterns = [
    path('session/<uuid:session_id>/like/', views.like_session, name='like_session'),
    path('fuse-moment/<uuid:fuse_moment_id>/share-contact/', views.share_contact, name='share_contact'),
    path('fuse-moments/', views.get_fuse_moments, name='get_fuse_moments'),


]

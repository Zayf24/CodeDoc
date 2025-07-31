from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.shortcuts import redirect
from django.http import HttpResponseRedirect
from allauth.socialaccount.models import SocialAccount
from .serializers import UserSerializer

class UserProfileView(generics.RetrieveAPIView):
    """
    Get current user's profile information
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_stats(request):
    """
    Get user statistics - we'll expand this later
    """
    user = request.user
    
    # Get GitHub info if available
    github_info = {}
    try:
        social_account = SocialAccount.objects.get(user=user, provider='github')
        github_info = {
            'github_username': social_account.extra_data.get('login'),
            'github_avatar': social_account.extra_data.get('avatar_url'),
            'github_id': social_account.extra_data.get('id'),
        }
    except SocialAccount.DoesNotExist:
        pass
    
    return Response({
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'date_joined': user.date_joined,
        'github_info': github_info,
        'total_repositories': 0,  # We'll implement this later
        'total_jobs': 0,  # We'll implement this later
    })

@api_view(['GET'])
def github_oauth_callback(request):
    """
    Handle successful GitHub OAuth and redirect to React with token
    """
    if request.user.is_authenticated:
        # Create or get auth token for the user
        token, created = Token.objects.get_or_create(user=request.user)
        
        # Redirect to React with the token
        react_callback_url = f"http://localhost:5173/auth/callback?token={token.key}"
        return HttpResponseRedirect(react_callback_url)
    else:
        # OAuth failed, redirect to React login page
        return HttpResponseRedirect("http://localhost:5173/login?error=oauth_failed")

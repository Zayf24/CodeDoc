from django.urls import path
from .views import (
    UserProfileView, 
    user_stats, 
    github_oauth_callback, 
    send_verification_code, 
    verify_email_code,
    custom_login,
    sync_session,
    api_logout,
    disconnect_github,
)

urlpatterns = [
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('stats/', user_stats, name='user-stats'),
    path('github/callback/', github_oauth_callback, name='github-oauth-callback'),
    path('send-verification/', send_verification_code, name='send-verification-code'),
    path('verify-code/', verify_email_code, name='verify-email-code'),
    path('login/', custom_login, name='custom-login'),
    path('sync-session/', sync_session, name='sync-session'),
    path('logout/', api_logout, name='api-logout'),
    path('disconnect-github/', disconnect_github, name='disconnect-github'),
]

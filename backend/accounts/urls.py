from django.urls import path
from .views import UserProfileView, user_stats, github_oauth_callback

urlpatterns = [
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('stats/', user_stats, name='user-stats'),
    path('github/callback/', github_oauth_callback, name='github-oauth-callback'),
]

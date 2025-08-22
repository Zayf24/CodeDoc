# Main URL configuration for CodeDoc project

from django.contrib import admin
from django.urls import path, include


urlpatterns = [
    path('admin/', admin.site.urls),
    # path('auth/', include('dj_rest_auth.urls')),
    path('auth/registration/', include('dj_rest_auth.registration.urls')),
    path('auth/', include('allauth.socialaccount.urls')),
    path('api/users/', include('accounts.urls')),
    path('accounts/', include('allauth.urls')),
    path('api/repositories/', include('repositories.urls')),
]

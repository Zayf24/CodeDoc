from django.contrib import admin
from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'github_username', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'github_username']

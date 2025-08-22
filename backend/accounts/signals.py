# Django signals for automatic user profile management
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.apps import apps
from .models import UserProfile


@receiver(post_save, sender=UserProfile)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    """Signal to ensure UserProfile is created when User is created"""
    pass  # This is handled in models.py


def sync_github_to_profile(sender, instance, **kwargs):
    """
    When a SocialAccount is saved (created or updated), sync the GitHub information
    to the user's UserProfile model.
    """
    # Only process GitHub accounts
    if instance.provider != 'github':
        return
        
    try:
        # Get or create the user profile
        profile, created = UserProfile.objects.get_or_create(user=instance.user)
        
        # Update GitHub information from the social account
        extra_data = instance.extra_data or {}
        
        # Track if any changes were made
        updated = False
        
        # Update github_username (login field from GitHub)
        if 'login' in extra_data and extra_data['login'] != profile.github_username:
            profile.github_username = extra_data['login']
            updated = True
        
        # Update github_id
        if 'id' in extra_data and str(extra_data['id']) != profile.github_id:
            profile.github_id = str(extra_data['id'])
            updated = True
        
        # Update avatar_url
        if 'avatar_url' in extra_data and extra_data['avatar_url'] != profile.avatar_url:
            profile.avatar_url = extra_data['avatar_url']
            updated = True
        
        # Only save if changes were made
        if updated:
            profile.save()
            print(f"Updated GitHub profile for user: {instance.user.username}")
            
    except Exception as e:
        # Log the error but don't crash the signal
        print(f"Error syncing GitHub info to profile for user {instance.user.username}: {e}")


def register_signals():
    """
    Register Django signals when the app is ready.
    
    This function implements dynamic signal registration:
    1. Waits for the SocialAccount model to be available
    2. Connects the GitHub profile sync signal to post_save events
    3. Handles registration failures gracefully
    4. Provides feedback on registration success/failure
    
    The function is called from the app's ready() method to ensure
    all models are loaded before attempting to connect signals.
    """
    try:
        # Dynamically get the SocialAccount model when it's available
        SocialAccount = apps.get_model('socialaccount', 'SocialAccount')
        post_save.connect(sync_github_to_profile, sender=SocialAccount)
        print("GitHub profile sync signal registered successfully")
    except Exception as e:
        print(f"Failed to register GitHub profile sync signal: {e}")

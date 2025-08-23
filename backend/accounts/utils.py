# Utility functions for user profile management and GitHub integration
from django.apps import apps
from .models import UserProfile


def sync_github_profile_for_user(user):
    """
    Manually sync GitHub information to UserProfile for a specific user.
    
    This function implements intelligent profile synchronization:
    1. Retrieves GitHub social account data for the user
    2. Gets or creates UserProfile record as needed
    3. Compares existing data with new data to detect changes
    4. Only updates the database when actual changes occur
    5. Returns detailed status information for debugging
    
    The function is designed to be efficient by avoiding
    unnecessary database writes when data hasn't changed.
    """
    try:
        # Dynamically get the SocialAccount model to avoid circular imports
        SocialAccount = apps.get_model('socialaccount', 'SocialAccount')
        
        # Check if user has GitHub connection
        try:
            social_account = SocialAccount.objects.get(user=user, provider='github')
        except SocialAccount.DoesNotExist:
            return False, "No GitHub account found for user"
        
        # Get or create the user profile record
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        # Extract GitHub data from social account
        extra_data = social_account.extra_data or {}
        
        # Track whether any actual changes were made
        updated = False
        
        # Update GitHub username if it has changed
        if 'login' in extra_data and extra_data['login'] != profile.github_username:
            profile.github_username = extra_data['login']
            updated = True
        
        # Update GitHub user ID if it has changed
        if 'id' in extra_data and str(extra_data['id']) != profile.github_id:
            profile.github_id = str(extra_data['id'])
            updated = True
        
        # Update avatar URL if it has changed
        if 'avatar_url' in extra_data and extra_data['avatar_url'] != profile.avatar_url:
            profile.avatar_url = extra_data['avatar_url']
            updated = True
        
        # Only save to database if changes were detected
        if updated:
            profile.save()
            return True, f"Updated GitHub profile for user: {user.username}"
        else:
            return True, f"Profile already up to date for user: {user.username}"
            
    except Exception as e:
        return False, f"Error syncing GitHub profile: {str(e)}"


def sync_all_github_profiles():
    """
    Sync GitHub information for all users with GitHub connections.
    
    This function implements bulk profile synchronization:
    1. Retrieves all users with GitHub social accounts
    2. Processes each user individually with error isolation
    3. Tracks success/failure counts for monitoring
    4. Collects detailed error messages for debugging
    5. Continues processing even if individual users fail
    
    Returns a tuple of (success_count, total_count, errors) for
    comprehensive status reporting and error analysis.
    """
    try:
        # Dynamically get the SocialAccount model to avoid circular imports
        SocialAccount = apps.get_model('socialaccount', 'socialaccount')
        
        # Get all users with GitHub connections
        github_accounts = SocialAccount.objects.filter(provider='github')
        total_count = github_accounts.count()
        
        if total_count == 0:
            return 0, 0, ["No GitHub accounts found"]
        
        success_count = 0
        errors = []
        
        # Process each GitHub account individually with error isolation
        for social_account in github_accounts:
            try:
                success, message = sync_github_profile_for_user(social_account.user)
                if success:
                    success_count += 1
                else:
                    errors.append(f"User {social_account.user.username}: {message}")
            except Exception as e:
                errors.append(f"User {social_account.user.username}: {str(e)}")
        
        return success_count, total_count, errors
        
    except Exception as e:
        return 0, 0, [f"Failed to sync GitHub profiles: {str(e)}"]

# Custom social account adapter for GitHub OAuth integration
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.exceptions import ImmediateHttpResponse
from django.http import HttpResponseRedirect


class CodeDocSocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        """
        Prevent account switching via social login for security.
        
        This method implements security measures to prevent:
        1. Authenticated users from connecting GitHub accounts owned by others
        2. Potential account hijacking through social login
        3. Confusion between multiple user accounts
        
        If a logged-in user tries to connect a GitHub account that's already
        linked to a different user, the operation is blocked and user is
        redirected with an error message.
        """
        if request.user.is_authenticated:
            if sociallogin.is_existing:
                # Check if the social account belongs to a different user
                if sociallogin.account.user != request.user:
                    from django.conf import settings
                    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
                    raise ImmediateHttpResponse(
                        HttpResponseRedirect(f"{frontend_url}/dashboard?error=github_account_in_use")
                    )
        return super().pre_social_login(request, sociallogin)

    def get_connect_redirect_url(self, request, socialaccount):
        """After successfully connecting a social account, send user back to SPA dashboard."""
        from django.conf import settings
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        return f"{frontend_url}/dashboard?connected=github"

    def save_user(self, request, sociallogin, form=None):
        """Override to ensure proper redirect after social account connection."""
        user = super().save_user(request, sociallogin, form)
        return user

    def get_redirect_url(self, request, sociallogin):
        """Override to force redirect to custom callback after social auth."""
        from django.conf import settings
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        
        if request.GET.get('process') == 'connect':
            return f"{frontend_url}/dashboard?connected=github"
        
        # Redirect to custom callback endpoint that will generate token and redirect to frontend
        # The user will be authenticated by this point (allauth has processed OAuth)
        return "/api/users/github/callback/"



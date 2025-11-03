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
                    raise ImmediateHttpResponse(
                        HttpResponseRedirect("http://localhost:5173/dashboard?error=github_account_in_use")
                    )
        return super().pre_social_login(request, sociallogin)

    def get_connect_redirect_url(self, request, socialaccount):
        """After successfully connecting a social account, send user back to SPA dashboard."""
        return "http://localhost:5173/dashboard?connected=github"

    def save_user(self, request, sociallogin, form=None):
        """Override to ensure proper redirect after social account connection."""
        user = super().save_user(request, sociallogin, form)
        return user

    def get_redirect_url(self, request, sociallogin):
        """Override to force redirect to SPA after any social auth operation."""
        if request.GET.get('process') == 'connect':
            return "http://localhost:5173/dashboard?connected=github"
        return "http://localhost:5173/dashboard"



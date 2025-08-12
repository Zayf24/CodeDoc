from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.exceptions import ImmediateHttpResponse
from django.http import HttpResponseRedirect


class CodeDocSocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        """Prevent switching to another user via social login when a user is already authenticated.

        If a logged-in user attempts to connect a GitHub account that is already
        linked to a different user, block the operation and redirect with an error.
        """
        if request.user.is_authenticated:
            if sociallogin.is_existing:
                # Social account already exists and belongs to someone else
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



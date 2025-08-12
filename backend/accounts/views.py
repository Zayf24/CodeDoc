
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.shortcuts import redirect
from django.http import HttpResponseRedirect
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from allauth.socialaccount.models import SocialAccount
from allauth.account.models import EmailAddress
from allauth.socialaccount.helpers import complete_social_login
from allauth.socialaccount import signals as social_signals
from .models import EmailVerificationCode
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
    Get user statistics
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
    
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def custom_login(request):
    """
    Custom login that checks email verification status.
    Accepts either username or email as the identifier.
    """
    identifier = request.data.get('username')
    password = request.data.get('password')
    
    if not identifier or not password:
        return Response({
            'error': 'Username/email and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Try default authentication assuming identifier is a username
    user = authenticate(username=identifier, password=password)
    
    # If that fails, try treating identifier as an email
    if user is None:
        try:
            matched_user = User.objects.get(email__iexact=identifier)
            user = authenticate(username=matched_user.username, password=password)
        except User.DoesNotExist:
            user = None
    
    if user is None:
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    # Check if user is verified
    if not is_user_verified(user):
        # Send verification code for unverified users
        try:
            # Delete any existing unused codes for this user
            EmailVerificationCode.objects.filter(user=user, is_used=False).delete()
            
            # Create new verification code
            verification_code = EmailVerificationCode.objects.create(
                user=user,
                email=user.email
            )
            
            # Send verification email
            send_verification_email(user, verification_code.code)
            
            return Response({
                'requires_verification': True,
                'email': user.email,
                'message': 'Account not verified. Verification code sent to your email.'
            }, status=status.HTTP_403_FORBIDDEN)
            
        except Exception as e:
            return Response({
                'error': 'Failed to send verification code'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # User is verified, proceed with normal login
    token, created = Token.objects.get_or_create(user=user)
    
    return Response({
        'token': token.key,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_verified': True
        }
    }, status=status.HTTP_200_OK)

def is_user_verified(user):
    """
    Check if user is verified through email or social account
    """
    # Check if user has verified email address
    verified_email = EmailAddress.objects.filter(user=user, verified=True).exists()
    if verified_email:
        return True
    
    # Check if user signed up via social account (GitHub)
    social_account = SocialAccount.objects.filter(user=user).exists()
    if social_account:
        # Auto-verify social account users
        EmailAddress.objects.get_or_create(
            user=user,
            email=user.email,
            defaults={'verified': True, 'primary': True}
        )
        return True
    
    return False

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def send_verification_code(request):
    """
    Send a 6-digit verification code to user's email
    """
    email = request.data.get('email')
    username = request.data.get('username')
    
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Find the user
        user = User.objects.get(email=email)
        
        # Check if user is already verified
        if user.emailaddress_set.filter(verified=True).exists():
            return Response({'error': 'Email already verified'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Delete any existing unused codes for this user
        EmailVerificationCode.objects.filter(user=user, is_used=False).delete()
        
        # Create new verification code
        verification_code = EmailVerificationCode.objects.create(
            user=user,
            email=email
        )
        
        # Send email with code
        send_verification_email(user, verification_code.code)
        
        return Response({
            'message': 'Verification code sent successfully',
            'email': email
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': 'Failed to send verification code'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_email_code(request):
    """
    Verify the 6-digit code and activate user account
    """
    email = request.data.get('email')
    code = request.data.get('code')
    
    if not email or not code:
        return Response({'error': 'Email and code are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Find the verification code
        verification_code = EmailVerificationCode.objects.get(
            email=email,
            code=code,
            is_used=False
        )
        
        # Check if code is expired
        if verification_code.is_expired():
            return Response({'error': 'Verification code has expired'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark code as used
        verification_code.is_used = True
        verification_code.save()
        
        # Verify the email address
        user = verification_code.user
        
        email_address, created = EmailAddress.objects.get_or_create(
            user=user,
            email=email,
            defaults={'verified': True, 'primary': True}
        )
        
        if not created:
            email_address.verified = True
            email_address.save()
        
        # Generate auth token for login
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'message': 'Email verified successfully',
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }, status=status.HTTP_200_OK)
        
    except EmailVerificationCode.DoesNotExist:
        return Response({'error': 'Invalid or expired verification code'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': 'Verification failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

def send_verification_email(user, code):
    """
    Send verification code email
    """
    subject = 'CodeDoc AI - Your Verification Code'
    
    # HTML email template
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #1f2937; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 30px 20px; background: #f8f9fa; }}
            .code {{ font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3b82f6; background: white; padding: 20px; text-align: center; border: 2px dashed #3b82f6; margin: 20px 0; }}
            .footer {{ background: #e5e7eb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1><span style="color: #60a5fa;">Code</span>Doc AI</h1>
            </div>
            
            <div class="content">
                <h2>Hi {user.username}!</h2>
                
                <p>Welcome to CodeDoc AI! Please use the verification code below to confirm your email address:</p>
                
                <div class="code">{code}</div>
                
                <p>Enter this code in the verification form to activate your account.</p>
                
                <p><strong>This code will expire in 15 minutes.</strong></p>
                
                <p>If you didn't create an account with CodeDoc AI, please ignore this email.</p>
            </div>
            
            <div class="footer">
                <p>This email was sent by CodeDoc AI. If you have questions, contact us at support@codedocai.com</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Plain text version
    plain_message = f"""
    Hi {user.username}!
    
    Welcome to CodeDoc AI! Your verification code is: {code}
    
    Enter this code in the verification form to activate your account.
    
    This code will expire in 15 minutes.
    
    If you didn't create an account with CodeDoc AI, please ignore this email.
    
    Best regards,
    The CodeDoc AI Team
    """
    
    send_mail(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        html_message=html_message,
        fail_silently=False,
    )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def sync_session(request):
    """Ensure the Django session user matches the token-authenticated user.
    This logs the request.user into the session so subsequent allauth flows
    (e.g., GitHub connect) act on the correct account.
    """
    django_login(request, request.user)
    return Response({'detail': 'Session synchronized'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def api_logout(request):
    """Log out the current session if any. Token is managed client-side."""
    try:
        django_logout(request)
    except Exception:
        pass
    return Response({'detail': 'Logged out'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def disconnect_github(request):
    """Disconnect the current user's GitHub account and revoke local association.
    Note: This does not revoke on GitHub side; it removes the local link.
    """
    try:
        SocialAccount.objects.filter(user=request.user, provider='github').delete()
        return Response({'detail': 'GitHub disconnected'}, status=status.HTTP_200_OK)
    except Exception:
        return Response({'error': 'Failed to disconnect GitHub'}, status=status.HTTP_400_BAD_REQUEST)
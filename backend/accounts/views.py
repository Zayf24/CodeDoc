
# User authentication and profile management views
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
    
    # Get actual repository and job counts
    from repositories.models import Repository, DocumentationJob
    
    total_repositories = Repository.objects.filter(user=user).count()
    total_jobs = DocumentationJob.objects.filter(user=user).count()
    
    return Response({
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'date_joined': user.date_joined,
        'github_info': github_info,
        'total_repositories': total_repositories,
        'total_jobs': total_jobs,
    })

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def github_oauth_callback(request):
    """
    Handle successful GitHub OAuth and redirect to React with token.
    This endpoint is called after allauth processes the OAuth callback.
    The user should be authenticated by the time this is called (via signal).
    """
    from django.conf import settings
    from allauth.socialaccount.models import SocialAccount
    
    # Try to get the authenticated user from session
    user = request.user if request.user.is_authenticated else None
    
    # Fallback: If not authenticated yet, try to find the user from recent social account
    # This can happen if the signal hasn't fired yet or there's a race condition
    if not user:
        try:
            # Get the most recently created GitHub social account
            # This should be from the current OAuth flow
            social_account = SocialAccount.objects.filter(
                provider='github'
            ).select_related('user').order_by('-id').first()
            
            if social_account:
                user = social_account.user
                # Manually log the user in
                django_login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        except Exception as e:
            print(f"Error in github_oauth_callback: {e}")
            import traceback
            traceback.print_exc()
    
    if user and user.is_authenticated:
        # Create or get auth token for the user
        token, created = Token.objects.get_or_create(user=user)
        # Redirect to React with the token
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        react_callback_url = f"{frontend_url}/auth/callback?token={token.key}"
        return HttpResponseRedirect(react_callback_url)
    else:
        # OAuth failed or user not found
        print("GitHub OAuth callback: User not authenticated or found")
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        return HttpResponseRedirect(f"{frontend_url}/login?error=oauth_failed")
    
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def custom_login(request):
    """
    Custom login that checks email verification status.
    
    This endpoint implements flexible authentication with verification:
    1. Accepts username or email as identifier for user convenience
    2. Attempts authentication with username first, then email fallback
    3. Checks email verification status before allowing login
    4. Automatically sends verification codes for unverified accounts
    5. Returns appropriate response based on verification status
    
    The dual-identifier approach improves user experience while
    maintaining security through email verification.
    """
    identifier = request.data.get('username')
    password = request.data.get('password')
    
    if not identifier or not password:
        return Response({
            'error': 'Username/email and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Primary authentication attempt using identifier as username
    user = authenticate(username=identifier, password=password)
    
    # Fallback authentication using identifier as email
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
    
    # Verify user account status before allowing login
    if not is_user_verified(user):
        # Handle unverified users by sending verification codes
        try:
            # Clean up any existing unused codes to prevent confusion
            EmailVerificationCode.objects.filter(user=user, is_used=False).delete()
            
            # Generate new verification code with 15-minute expiration
            verification_code = EmailVerificationCode.objects.create(
                user=user,
                email=user.email
            )
            
            # Send verification email with the code
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
    
    # User is verified, proceed with normal login and token generation
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
    Check if user is verified through email or social account.
    
    This function implements a dual-verification strategy:
    1. Checks for verified email addresses in the EmailAddress model
    2. Checks for social account connections (GitHub OAuth)
    3. Auto-verifies social account users for seamless experience
    4. Creates verified email records for social account users
    
    Social account users are automatically verified because they've
    already authenticated through a trusted third-party service.
    """
    # Check if user has verified email address
    verified_email = EmailAddress.objects.filter(user=user, verified=True).exists()
    if verified_email:
        return True
    
    # Check if user signed up via social account (GitHub)
    social_account = SocialAccount.objects.filter(user=user).exists()
    if social_account:
        # Auto-verify social account users and create email records
        EmailAddress.objects.get_or_create(
            user=user,
            email=user.email,
            defaults={'verified': True, 'primary': True}
        )
        return True
    
    return False

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    """
    Register a new user and send a verification code to the provided email.
    """
    email = request.data.get('email')
    username = request.data.get('username')
    password = request.data.get('password')

    if not email or not username or not password:
        return Response({'error': 'Email, username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    # Basic validations
    if User.objects.filter(username__iexact=username).exists():
        return Response({'error': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email__iexact=email).exists():
        return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)

    if len(password) < 8:
        return Response({'error': 'Password must be at least 8 characters long'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Create user
        user = User.objects.create_user(username=username, email=email, password=password)

        # Ensure any previous codes are removed (should be none for a brand new user)
        EmailVerificationCode.objects.filter(user=user, is_used=False).delete()

        # Create verification code
        verification_code = EmailVerificationCode.objects.create(user=user, email=email)
        
        # Try to send verification email, but don't fail registration if email fails
        try:
            send_verification_email(user, verification_code.code)
            email_sent = True
        except Exception as email_error:
            # Log email error but don't fail registration
            print(f"Failed to send verification email: {email_error}")
            import traceback
            traceback.print_exc()
            email_sent = False

        response_message = 'Account created successfully.'
        if email_sent:
            response_message += ' Verification code sent to your email.'
        else:
            response_message += ' Warning: Could not send verification email. Please contact support.'

        return Response({
            'message': response_message,
            'email': email,
            'email_sent': email_sent
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        # Log the actual error for debugging
        print(f"Registration error: {e}")
        import traceback
        traceback.print_exc()
        # Return more helpful error message
        error_message = 'Registration failed'
        if 'UNIQUE constraint' in str(e) or 'duplicate' in str(e).lower():
            error_message = 'Username or email already exists'
        elif 'email' in str(e).lower():
            error_message = 'Invalid email address'
        return Response({'error': error_message, 'details': str(e) if settings.DEBUG else None}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        print(verification_code)
        
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
    Verify the 6-digit code and activate user account.
    
    This endpoint implements secure email verification:
    1. Validates the verification code against the database
    2. Checks code expiration (15-minute limit)
    3. Marks code as used to prevent reuse
    4. Creates or updates verified email address record
    5. Generates authentication token for immediate login
    
    The verification process ensures account security while
    providing seamless user experience after verification.
    """
    email = request.data.get('email')
    code = request.data.get('code')
    
    if not email or not code:
        return Response({'error': 'Email and code are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Find the verification code with validation checks
        verification_code = EmailVerificationCode.objects.get(
            email=email,
            code=code,
            is_used=False  # Prevent reuse of verification codes
        )
        
        # Validate code hasn't expired (15-minute limit)
        if verification_code.is_expired():
            return Response({'error': 'Verification code has expired'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark code as used to prevent security issues
        verification_code.is_used = True
        verification_code.save()
        
        # Get the user associated with this verification code
        user = verification_code.user
        
        # Create or update verified email address record
        email_address, created = EmailAddress.objects.get_or_create(
            user=user,
            email=email,
            defaults={'verified': True, 'primary': True}
        )
        
        # Update existing email address if it wasn't just created
        if not created:
            email_address.verified = True
            email_address.save()
        
        # Generate authentication token for immediate login
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


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def sync_github_profile(request):
    """Manually sync GitHub information to UserProfile for the current user"""
    try:
        from .utils import sync_github_profile_for_user
        
        success, message = sync_github_profile_for_user(request.user)
        
        if success:
            return Response({
                'message': message,
                'success': True
            })
        else:
            return Response({
                'message': message,
                'success': False
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({
            'message': f'Failed to sync GitHub profile: {str(e)}',
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
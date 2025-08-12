# CodeDoc AI Project Context

## Project Overview
CodeDoc AI is a Django + React application for automated code documentation that learns user styles. The project uses Django REST Framework for the backend API and React with Vite for the frontend.

## Architecture
- **Backend**: Django 5.2.4 + DRF + Allauth + dj-rest-auth
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Database**: SQLite (development)
- **Authentication**: Token-based + Session-based (for social auth)
- **Email**: SMTP via Gmail

## Backend Structure

### Apps
- `accounts`: User management, profiles, email verification, GitHub OAuth
- `codedoc_main`: Main Django project settings and URLs

### Key Models

#### UserProfile (accounts/models.py)
```python
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    github_username = models.CharField(max_length=255, blank=True)
    github_id = models.CharField(max_length=255, blank=True, unique=True, null=True)
    avatar_url = models.URLField(max_length=512, blank=True)
    style_profile = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### EmailVerificationCode (accounts/models.py)
```python
class EmailVerificationCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_codes')
    email = models.EmailField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    # Auto-generates 6-digit code and 15-minute expiry on save
```

### Authentication Flow

#### 1. Registration Flow
- User signs up via `POST /auth/registration/` (dj-rest-auth)
- System automatically sends verification code via `POST /api/users/send-verification/`
- User enters 6-digit code via `POST /api/users/verify-code/`
- Email is marked as verified in Allauth's EmailAddress model
- User receives DRF token for login

#### 2. Login Flow (Custom Implementation)
- **Endpoint**: `POST /api/users/login/`
- **Accepts**: Username OR email + password
- **Behavior**:
  - If user is unverified → sends verification code, returns 403 with `requires_verification: true`
  - If user is verified → returns DRF token
  - If user has social account → auto-verifies and returns token

#### 3. GitHub OAuth Flow
- **Connect**: `GET /accounts/github/login/?process=connect`
- **Callback**: `GET /api/users/github/callback/` → redirects to SPA with token
- **Session Sync**: `POST /api/users/sync-session/` ensures Django session matches token user
- **Disconnect**: `POST /api/users/disconnect-github/` removes local GitHub link

### Key API Endpoints

#### Authentication
- `POST /api/users/login/` - Custom login with verification check
- `POST /api/users/send-verification/` - Send 6-digit email code
- `POST /api/users/verify-code/` - Verify email code and activate account
- `POST /api/users/sync-session/` - Sync Django session with token user
- `POST /api/users/logout/` - Clear Django session

#### User Data
- `GET /api/users/profile/` - Get current user with nested profile
- `GET /api/users/stats/` - Get user stats + GitHub connection info

#### GitHub Management
- `POST /api/users/disconnect-github/` - Remove GitHub account link

### Custom Adapter (accounts/adapters.py)
```python
class CodeDocSocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        # Prevents linking GitHub account already linked to another user
        # Redirects to dashboard with error if conflict detected
    
    def get_connect_redirect_url(self, request, socialaccount):
        # Redirects to SPA dashboard after successful connect
    
    def get_redirect_url(self, request, sociallogin):
        # Handles all social auth redirects
```

### Email Verification System
- **Code Generation**: 6-digit random numeric codes
- **Expiry**: 15 minutes from creation
- **Resend**: Users can request new codes
- **Auto-cleanup**: Old unused codes are deleted before creating new ones
- **HTML Templates**: Professional email templates with branding

### Settings Configuration (codedoc_main/settings.py)
```python
# Social Account Settings
SOCIALACCOUNT_PROVIDERS = {
    "github": {
        "APP": {"client_id": config("GITHUB_CLIENT_ID"), "secret": config("GITHUB_CLIENT_SECRET")},
        "SCOPE": ["user", "user:email"],
        "VERIFIED_EMAIL": True,
    }
}

SOCIALACCOUNT_EMAIL_VERIFICATION = "none"  # We handle verification ourselves
SOCIALACCOUNT_LOGIN_ON_GET = False
SOCIALACCOUNT_STORE_TOKENS = False
SOCIALACCOUNT_ADAPTER = 'accounts.adapters.CodeDocSocialAccountAdapter'
SOCIALACCOUNT_LOGIN_REDIRECT_URL = 'http://localhost:5173/dashboard'
SOCIALACCOUNT_LOGOUT_REDIRECT_URL = 'http://localhost:5173/login'

# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = config('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = config('EMAIL_HOST_USER')  # Same as host user for deliverability
```

## Frontend Structure

### Authentication Context (src/context/AuthContext.jsx)
```javascript
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  // Auto-sets axios Authorization header when token changes
  // Fetches user profile on token change
  // Syncs Django session after login
  // Clears session on logout
};
```

### Key Components

#### LoginForm (src/components/auth/LoginForm.jsx)
- **Features**:
  - Accepts username OR email
  - Handles unverified users by showing EmailVerificationForm
  - GitHub OAuth link
  - Error handling for various scenarios

#### EmailVerificationForm (src/components/auth/EmailVerificationForm.jsx)
- **Features**:
  - 6-digit code input with auto-focus
  - 15-minute countdown timer
  - Resend functionality
  - Auto-submit prevention
  - Back navigation

#### Dashboard (src/components/dashboard/Dashboard.jsx)
- **Features**:
  - User stats display
  - GitHub connection status
  - Disconnect confirmation modal
  - Quick actions (Connect GitHub, Add Repository placeholder)

#### OAuthCallback (src/components/auth/OAuthCallback.jsx)
- **Features**:
  - Handles GitHub OAuth callback
  - Extracts token from URL params
  - Logs user in and redirects to dashboard

### Routing (src/App.jsx)
```javascript
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/login" element={<LoginForm />} />
  <Route path="/signup" element={<SignupForm />} />
  <Route path="/auth/callback" element={<OAuthCallback />} />
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
</Routes>
```

## Custom Templates

### GitHub Connect Page (backend/templates/socialaccount/login.html)
- **Features**:
  - Branded CodeDoc AI design
  - GitHub account switching hint
  - Manual button click (no auto-submit)
  - Back to SPA link

### Signup Completion (backend/templates/socialaccount/signup.html)
- **Features**:
  - Branded design
  - Form error handling
  - Back to SPA link

## Security Features

### Cross-Account Protection
- Prevents linking GitHub accounts already linked to other users
- Adapter blocks the operation and redirects with error

### Session Management
- Django session synced with token user for social auth
- Session cleared on logout to prevent cross-user issues

### Email Verification
- Required for all non-social accounts
- 15-minute expiry on codes
- One-time use codes

## Environment Variables Required (.env)
```bash
SECRET_KEY=your_django_secret_key
DEBUG=True
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret
EMAIL_HOST_USER=your_gmail_address
EMAIL_HOST_PASSWORD=your_gmail_app_password
```

## Current Features Implemented

### ✅ Authentication
- Email/password registration with verification
- Email/password login with verification check
- GitHub OAuth login and account linking
- Token-based API authentication
- Session management for social auth

### ✅ User Management
- User profiles with GitHub integration
- Email verification system
- Account statistics
- GitHub account connection/disconnection

### ✅ UI/UX
- Responsive dashboard
- Loading states
- Error handling
- Confirmation modals
- Branded templates

### ✅ Security
- Cross-account protection
- Session synchronization
- Email verification
- Token management

## Known Issues & Solutions

### GitHub Account Conflicts
- **Issue**: Users trying to connect GitHub accounts already linked to other users
- **Solution**: Custom adapter blocks the operation and redirects with clear error

### Session vs Token Auth
- **Issue**: Allauth uses Django sessions, DRF uses tokens
- **Solution**: Session sync endpoint ensures consistency

### Email Deliverability
- **Issue**: Gmail SMTP with custom from address
- **Solution**: Use same address for host and from fields


## Development Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Setup
1. Create `.env` file in backend directory
2. Add required environment variables
3. Set up GitHub OAuth app
4. Configure Gmail app password

## Testing Scenarios

### Registration Flow
1. User signs up with email/password
2. Verification code sent to email
3. User enters code
4. Account activated and logged in

### Login Flow
1. User enters credentials
2. If unverified → verification form shown
3. If verified → direct login to dashboard

### GitHub Connect Flow
1. User clicks "Connect GitHub"
2. Redirected to branded GitHub auth page
3. Authorizes on GitHub
4. Redirected back to dashboard
5. GitHub status updated

### Cross-Account Protection
1. User A connects GitHub account
2. User B tries to connect same GitHub account
3. Operation blocked with error message
4. User B stays on dashboard

This context provides a complete understanding of the current CodeDoc AI implementation for future feature development and maintenance.

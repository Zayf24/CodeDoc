# CodeDoc

<div align="center">

**AI-Powered Documentation Generator for Python Code**

An intelligent documentation assistant that connects to your GitHub repositories and automatically generates professional documentation for your Python code using Google's Gemini AI.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.13-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.2.5-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-38bdf8.svg)](https://tailwindcss.com/)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Quick Start](#-quick-start)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

CodeDoc is a full-stack web application that leverages AI to generate comprehensive documentation for Python codebases. By integrating with GitHub and utilizing Google's Gemini AI, it provides developers with an automated solution for creating and maintaining code documentation.

### What Makes CodeDoc Special?

- **🤖 AI-Powered**: Uses Google Gemini AI to generate intelligent, context-aware documentation
- **🔗 GitHub Integration**: Seamlessly connects to your GitHub repositories via OAuth
- **⚡ Asynchronous Processing**: Background task processing with Celery and Redis
- **🔍 Smart Analysis**: AST-based code analysis to understand structure and complexity
- **📊 Real-time Progress**: Live updates for documentation generation jobs
- **🎨 Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS

---

## 🚀 Quick Start

Get CodeDoc up and running in 5 minutes:

```bash
# 1. Clone and navigate
git clone https://github.com/yourusername/CodeDoc.git
cd CodeDoc

# 2. Backend setup
cd backend
python -m venv venv
venv\Scripts\activate  # Windows (use: source venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
copy env.example .env  # Windows (use: cp env.example .env on macOS/Linux)
# Edit .env with your credentials (see Configuration section)

# 3. Run migrations
python manage.py migrate
python manage.py createsuperuser

# 4. Frontend setup
cd ../frontend
npm install

# 5. Start services (in separate terminals)
# Terminal 1: Redis
redis-server

# Terminal 2: Celery Worker
cd backend
celery -A codedoc_main worker --loglevel=info

# Terminal 3: Django Server
cd backend
python manage.py runserver

# Terminal 4: React Dev Server
cd frontend
npm run dev
```

Visit **http://localhost:5173** to see the app!

> **Note**: Make sure to configure your `.env` file with GitHub and Gemini API keys before starting (see [Configuration](#-configuration) section below).

---

## ✨ Features

### Core Features

- **GitHub OAuth Authentication**: Secure login without passwords
- **Repository Synchronization**: Automatic sync of your GitHub repositories
- **Code Analysis**: Deep analysis of Python code using Abstract Syntax Trees
- **AI Documentation Generation**: Intelligent documentation using Gemini AI
- **Progress Tracking**: Real-time updates for long-running jobs
- **Documentation Viewer**: Beautiful interface to view and download generated docs
- **Email Verification**: Secure email verification for new accounts
- **User Dashboard**: Comprehensive overview of repositories, jobs, and stats

### Advanced Features

- **Batch Processing**: Efficient handling of multiple files
- **Rate Limiting**: Smart API rate limit management
- **Error Handling**: Robust error handling and retry logic
- **Code Complexity Analysis**: Automatic calculation of function complexity scores
- **Context Enhancement**: Rich context extraction for better AI documentation
- **Multi-file Support**: Documentation generation for entire repositories
- **Export Functionality**: Download documentation in multiple formats

---

## 🛠 Tech Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.13 | Programming language |
| **Django** | 5.2.5 | Web framework |
| **Django REST Framework** | 3.16.1 | API development |
| **django-allauth** | Latest | Authentication & OAuth |
| **dj-rest-auth** | Latest | REST authentication |
| **Celery** | 5.5.3 | Background task processing |
| **Redis** | 5.2.1 | Message broker & cache |
| **Google Generative AI** | 0.5.4 | AI documentation generation |
| **python-decouple** | 3.8 | Environment configuration |
| **django-cors-headers** | 4.7.0 | CORS handling |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.1.0 | UI framework |
| **Vite** | 7.0.4 | Build tool |
| **React Router** | 7.8.1 | Client-side routing |
| **Tailwind CSS** | 3.4.17 | Styling framework |
| **Framer Motion** | 12.23.12 | Animation library |
| **Axios** | 1.11.0 | HTTP client |
| **Radix UI** | Latest | UI components |
| **Lucide React** | 0.540.0 | Icon library |

### Infrastructure

| Service | Purpose |
|---------|---------|
| **SQLite** | Database (development) |
| **Redis** | Task queue & caching |
| **Gmail SMTP** | Email service |
| **GitHub API** | Repository access |
| **Google Gemini API** | AI documentation |

---

## 🏗 Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Frontend                          │
│  (Port 5173) - Landing, Auth, Dashboard, Documentation Viewer   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/REST API
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    Django Backend (Port 8000)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  REST API Layer (Django REST Framework)                  │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Authentication (django-allauth, GitHub OAuth)           │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Business Logic (Repository, Documentation Services)     │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Background Tasks (Celery Workers)                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────┬───────────────────┬──────────────────────┬────────────────┘
     │                   │                      │
     │                   │                      │
┌────▼────────┐   ┌──────▼───────┐      ┌──────▼──────────┐
│ GitHub API  │   │ Gemini AI    │      │  SQLite DB      │
│             │   │              │      │                 │
│ - Repos     │   │ - Docs       │      │ - Users         │
│ - Files     │   │ - Analysis   │      │ - Repositories  │
│ - Auth      │   │              │      │ - Jobs          │
└─────────────┘   └──────────────┘      └─────────────────┘
                                                         
                    ┌──────────────────┐
                    │   Redis          │
                    │                  │
                    │ - Task Queue     │
                    │ - Cache          │
                    └──────────────────┘
```

### Key Components

#### Backend Architecture

1. **Authentication Layer**: GitHub OAuth integration with django-allauth
2. **API Layer**: RESTful endpoints using Django REST Framework
3. **Service Layer**: GitHub and Gemini service integration
4. **Task Layer**: Celery for async documentation generation
5. **Database Layer**: SQLite with Django ORM

#### Frontend Architecture

1. **Presentation Layer**: React components with Tailwind CSS
2. **State Management**: Context API for global state
3. **Routing**: React Router for client-side navigation
4. **API Integration**: Axios with interceptors
5. **Animations**: Framer Motion for smooth transitions

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Python** 3.13 or higher
- **Node.js** 18.x or higher
- **npm** or **yarn**
- **Redis** server
- **Git**

### Required Accounts & API Keys

- **GitHub Account**: For OAuth integration
- **Google AI Studio**: For Gemini API key
- **Gmail Account**: For email service

### Services to Set Up

1. **GitHub OAuth App**:
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Create a new OAuth app
   - Set callback URL: `http://localhost:8000/api/users/github/callback/`
   - Save Client ID and Client Secret

2. **Google Gemini API Key**:
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a free API key
   - Save for environment configuration

3. **Gmail SMTP** (Optional):
   - Create an app password in your Google Account
   - Enable 2-factor authentication
   - Generate app-specific password

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/CodeDoc.git
cd CodeDoc
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install Django==5.2.5
pip install djangorestframework==3.16.1
pip install django-allauth
pip install dj-rest-auth
pip install django-celery-results
pip install celery==5.5.3
pip install redis==5.2.1
pip install google-generativeai==0.5.4
pip install python-decouple==3.8
pip install django-cors-headers==4.7.0
pip install requests==2.32.4
```

Or install from the requirements file:

```bash
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Or with yarn
yarn install
```

### 4. Redis Setup

#### Windows

Download and install Redis from [Redis for Windows](https://redis.io/download) or use WSL.

#### macOS

```bash
brew install redis
brew services start redis
```

#### Linux

```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
```

---

## ⚙️ Configuration

### 1. Backend Configuration

Create a `.env` file in the `backend` directory:

```bash
# Copy the example file
# On Windows:
copy env.example .env

# On macOS/Linux:
cp env.example .env

# Edit the .env file with your actual credentials
```

The `.env` file should contain:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Email Configuration
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Database
DATABASE_URL=sqlite:///db.sqlite3
```

**Note**: See `backend/env.example` for a template with helpful comments.

### 2. Database Migration

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser  # Create admin account
```

### 3. Frontend Configuration

No additional configuration needed for frontend. The API base URL is configured in `src/services/api.js`.

---

## 🎮 Usage

### Development Mode

#### Start Redis

```bash
redis-server
```

#### Start Celery Worker (Terminal 1)

```bash
cd backend
celery -A codedoc_main worker --loglevel=info
```

#### Start Django Server (Terminal 2)

```bash
cd backend
python manage.py runserver
```

#### Start React Development Server (Terminal 3)

```bash
cd frontend
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin

### Build for Production

#### Frontend Build

```bash
cd frontend
npm run build
```

The built files will be in the `frontend/dist` directory.

#### Backend Production

For production deployment, use:
- **PostgreSQL** instead of SQLite
- **gunicorn** or **uwsgi** as WSGI server
- **nginx** as reverse proxy
- **Docker** for containerization

---

## 📁 Project Structure

```
CodeDoc/
├── backend/                          # Django backend
│   ├── accounts/                     # User authentication & profiles
│   │   ├── models.py                # UserProfile, EmailVerificationCode
│   │   ├── views.py                 # Auth endpoints
│   │   ├── serializers.py           # API serializers
│   │   ├── adapters.py              # OAuth adapters
│   │   ├── urls.py                  # Authentication routes
│   │   └── migrations/              # Database migrations
│   ├── repositories/                 # Core business logic
│   │   ├── models.py                # Repository, RepositoryFile, DocumentationJob
│   │   ├── views.py                 # Repository endpoints
│   │   ├── services.py              # GitHub API integration
│   │   ├── gemini_services.py       # Gemini AI integration
│   │   ├── tasks.py                 # Celery background tasks
│   │   ├── context_enhancer.py      # AST code analysis
│   │   ├── ast_utils.py             # AST utilities
│   │   ├── simple_batch_processor.py # Batch processing
│   │   ├── urls.py                  # Repository routes
│   │   └── migrations/              # Database migrations
│   ├── codedoc_main/                # Django project settings
│   │   ├── settings.py              # Main configuration
│   │   ├── urls.py                  # Root URL configuration
│   │   ├── wsgi.py                  # WSGI application
│   │   ├── asgi.py                  # ASGI application
│   │   └── celery.py                # Celery configuration
│   ├── templates/                   # Django templates
│   ├── manage.py                    # Django management script
│   └── db.sqlite3                   # SQLite database
│
├── frontend/                         # React frontend
│   ├── src/
│   │   ├── components/              # React components
│   │   │   ├── common/             # Shared components
│   │   │   ├── landing/            # Landing page sections
│   │   │   ├── dashboard/          # Dashboard components
│   │   │   ├── layout/             # Layout components
│   │   │   ├── repository/         # Repository management
│   │   │   └── ui/                 # UI primitives
│   │   ├── pages/                  # Page components
│   │   │   ├── auth/               # Authentication pages
│   │   │   ├── dashboard/          # Dashboard pages
│   │   │   └── LandingPage.jsx     # Landing page
│   │   ├── services/               # API services
│   │   │   ├── api.js              # Base API client
│   │   │   ├── authService.js      # Authentication API
│   │   │   └── repositoryService.js # Repository API
│   │   ├── contexts/               # React contexts
│   │   │   └── AuthContext.jsx     # Authentication context
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # Utility functions
│   │   ├── App.jsx                 # Root component
│   │   └── main.jsx                # Entry point
│   ├── public/                     # Static assets
│   ├── dist/                       # Production build
│   ├── package.json                # Dependencies
│   ├── vite.config.js              # Vite configuration
│   └── tailwind.config.js          # Tailwind configuration
│
├── project_context/                 # Documentation
│   ├── Backend_Explanation.md      # Backend documentation
│   ├── Frontend_Explanation.md     # Frontend documentation
│   ├── API_REFERENCE.md            # API documentation
│   └── FRONTEND_CONTEXT.md         # Frontend context
│
├── LICENSE                          # MIT License
└── README.md                        # This file
```

---

## 📡 API Reference

### Authentication Endpoints

#### POST `/api/users/login/`
Login with username/email and password.

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "auth-token",
  "user": {
    "id": 1,
    "username": "username",
    "email": "user@example.com"
  }
}
```

#### POST `/api/users/register/`
Register a new user.

#### POST `/api/users/verify-code/`
Verify email with verification code.

#### GET `/auth/github/login/`
Redirect to GitHub OAuth.

#### GET `/api/users/github/callback/`
GitHub OAuth callback.

### Repository Endpoints

#### GET `/api/repositories/`
Get all user repositories.

#### POST `/api/repositories/sync/`
Sync repositories from GitHub.

#### POST `/api/repositories/select/`
Select repositories for documentation.

**Request Body:**
```json
{
  "repository_ids": [1, 2, 3]
}
```

#### POST `/api/repositories/sync-files/`
Sync files from selected repositories.

#### POST `/api/repositories/<id>/analyze-code/`
Analyze code in a repository.

#### POST `/api/repositories/<id>/generate-docs/`
Generate documentation for a repository.

#### GET `/api/repositories/jobs/`
Get all documentation jobs.

#### GET `/api/repositories/jobs/<id>/`
Get specific job details.

### User Endpoints

#### GET `/api/users/profile/`
Get current user profile.

#### GET `/api/users/stats/`
Get user statistics.

For complete API documentation, see [API_REFERENCE.md](project_context/API_REFERENCE.md).

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use ESLint for JavaScript/React code
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Google Gemini AI](https://gemini.google.com/) for AI capabilities
- [GitHub](https://github.com/) for API access
- [Django](https://www.djangoproject.com/) for the amazing framework
- [React](https://reactjs.org/) for the UI library
- All open-source contributors

---

## 📞 Support

For support, please open an issue on [GitHub Issues](https://github.com/yourusername/CodeDoc/issues).

---

## 🔮 Future Enhancements

- [ ] Support for additional programming languages
- [ ] Multiple documentation formats (Markdown, HTML, PDF)
- [ ] Team collaboration features
- [ ] Integration with more version control systems
- [ ] Advanced code analysis metrics
- [ ] Custom documentation templates
- [ ] API documentation generation
- [ ] CI/CD integration

---

<div align="center">

**Made with ❤️ by Zayf**

⭐ Star us on GitHub if you find this project helpful!

</div>


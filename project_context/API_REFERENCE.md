## Backend API Reference

Base URL: `http://localhost:8000`

Auth: add header for protected endpoints
```
Authorization: Token <token>
Content-Type: application/json
```

### Accounts (prefix: `/api/users/`)

- GET `/profile/`
  - Auth: required
  - Request: none
  - Response:
    ```json
    {
      "id": 1,
      "username": "string",
      "email": "string",
      "first_name": "string",
      "last_name": "string",
      "profile": {
        "github_username": "string|null",
        "github_id": "number|null",
        "avatar_url": "string|null",
        "created_at": "ISO8601"
      }
    }
    ```

- GET `/stats/`
  - Auth: required
  - Request: none
  - Response:
    ```json
    {
      "user_id": 1,
      "username": "string",
      "email": "string",
      "date_joined": "ISO8601",
      "github_info": {
        "github_username": "string",
        "github_avatar": "string",
        "github_id": 123
      },
      "total_repositories": 0,
      "total_jobs": 0
    }
    ```

- GET `/github/callback/`
  - Auth: browser session (from GitHub OAuth)
  - Request: none
  - Response: 302 redirect to `http://localhost:5173/auth/callback?token=<token>`

- POST `/login/`
  - Auth: public
  - Request:
    ```json
    { "username": "<username_or_email>", "password": "<password>" }
    ```
  - Response 200:
    ```json
    { "token": "string", "user": { "id": 1, "username": "string", "email": "string", "is_verified": true } }
    ```
  - Response 403 (unverified):
    ```json
    { "requires_verification": true, "email": "string", "message": "string" }
    ```

- POST `/register/`
  - Auth: public
  - Request:
    ```json
    { "email": "string", "username": "string", "password": "string" }
    ```
  - Response 201:
    ```json
    { "message": "Account created. Verification code sent to your email.", "email": "string" }
    ```

- POST `/send-verification/`
  - Auth: public
  - Request:
    ```json
    { "email": "string" }
    ```
  - Response 200:
    ```json
    { "message": "Verification code sent successfully", "email": "string" }
    ```

- POST `/verify-code/`
  - Auth: public
  - Request:
    ```json
    { "email": "string", "code": "string" }
    ```
  - Response 200:
    ```json
    { "message": "Email verified successfully", "token": "string", "user": { "id": 1, "username": "string", "email": "string" } }
    ```

- POST `/sync-session/`
  - Auth: required
  - Request: none
  - Response: `{ "detail": "Session synchronized" }`

- POST `/logout/`
  - Auth: public
  - Request: none
  - Response: `{ "detail": "Logged out" }`

- POST `/disconnect-github/`
  - Auth: required
  - Request: none
  - Response: `{ "detail": "GitHub disconnected" }`


### Repositories (prefix: `/api/repositories/`)

- GET `/`
  - Auth: required
  - Request: none
  - Response:
    ```json
    {
      "repositories": [
        {
          "id": 1,
          "github_id": 123,
          "name": "string",
          "full_name": "string",
          "description": "string|null",
          "language": "string|null",
          "private": false,
          "stars_count": 0,
          "forks_count": 0,
          "updated_at": "ISO8601",
          "is_selected": false,
          "github_url": "string|null",
          "total_files": 0,
          "python_files": 0,
          "files_synced": false
        }
      ],
      "total_count": 0
    }
    ```

- GET `/summary/`
  - Auth: required
  - Request: none
  - Response:
    ```json
    {
      "summary": {
        "total_repositories": 0,
        "selected_repositories": 0,
        "github_connected": false,
        "ready_for_analysis": 0
      },
      "selected_repositories": [
        {
          "id": 1,
          "name": "string",
          "full_name": "string",
          "description": "string|null",
          "language": "string|null",
          "stars_count": 0,
          "total_files": 0,
          "python_files": 0,
          "last_updated": "ISO8601",
          "github_url": "string|null",
          "analysis_status": "pending|no_python_files"
        }
      ],
      "next_steps": {
        "needs_github_connection": true,
        "needs_repository_sync": true,
        "needs_repository_selection": true,
        "ready_for_analysis": false
      }
    }
    ```

- POST `/sync/`
  - Auth: required
  - Request: none
  - Response 200: `{ "message": "Successfully synced N repositories", "synced_count": N }`
  - Response 400 if GitHub not connected: `{ "error": "...", "needs_github_connection": true }`

- POST `/select/`
  - Auth: required
  - Request:
    ```json
    { "repository_ids": [1, 2, 3] }
    ```
  - Response: `{ "message": "...", "selected_count": N }`

- GET `/selected/`
  - Auth: required
  - Request: none
  - Response:
    ```json
    {
      "selected_repositories": [
        {
          "id": 1,
          "name": "string",
          "full_name": "string",
          "description": "string|null",
          "language": "string|null",
          "github_url": "string|null",
          "file_count": 0,
          "supported_file_count": 0
        }
      ],
      "count": 0
    }
    ```

- POST `/sync-files/`
  - Auth: required
  - Request: none
  - Response:
    ```json
    {
      "message": "...",
      "results": [
        { "repository": "string", "total_files": 0, "python_files": 0, "status": "success|failed", "error": "string?" }
      ]
    }
    ```

- POST `/<repository_id>/files/sync/`
  - Auth: required
  - Request: none
  - Response: `{ "message": "...", "file_count": 0, "supported_files": 0 }`

- GET `/<repository_id>/files/`
  - Auth: required
  - Request: none
  - Response:
    ```json
    {
      "repository": { "id": 1, "name": "string", "full_name": "string" },
      "files": [ { "id": 1, "name": "string", "path": "string", "extension": ".py", "size": 0, "is_supported": true, "github_url": "string|null" } ],
      "total_files": 0,
      "supported_files": 0
    }
    ```

- POST `/<repository_id>/analyze-code/`
  - Auth: required
  - Request: none
  - Response (success):
    ```json
    {
      "repository": "string",
      "status": "completed",
      "files_analyzed": 0,
      "total_functions": 0,
      "total_classes": 0,
      "undocumented_functions": 0,
      "undocumented_classes": 0,
      "documentation_coverage": { "functions": 100, "classes": 100 },
      "analyzed_files": [
        {
          "file_id": 1,
          "file_name": "string.py",
          "file_path": "string",
          "file_size": 0,
          "line_count": 0,
          "functions": [ { "name": "string", "line_number": 1, "end_line": 10, "args": ["a"], "returns": "string|null", "docstring": "string|null", "has_docstring": true, "is_async": false, "decorators": [], "source_code": "string", "complexity_score": 1 } ],
          "classes": [ { "name": "string", "line_number": 1, "docstring": "string|null", "has_docstring": true, "methods": [], "base_classes": [], "decorators": [], "method_count": 0, "undocumented_methods": 0 } ],
          "imports": []
        }
      ]
    }
    ```

- GET `/<repository_id>/files/<file_id>/analysis/`
  - Auth: required
  - Request: none
  - Response:
    ```json
    {
      "file_info": { "id": 1, "name": "string", "path": "string", "size": 0, "github_url": "string|null" },
      "line_count": 0,
      "functions": [ ... ],
      "classes": [ ... ],
      "imports": [ ... ],
      "module_docstring": "string|null",
      "has_main": false
    }
    ```

- GET `/analysis-summary/`
  - Auth: required
  - Request: none
  - Response:
    ```json
    {
      "total_selected_repositories": 0,
      "repositories_with_python": 0,
      "total_python_files": 0,
      "ready_for_analysis": 0,
      "repositories": [ { "id": 1, "name": "string", "full_name": "string", "python_files": 0, "ready_for_analysis": false } ]
    }
    ```

- GET `/jobs/`
  - Auth: required
  - Request: none
  - Response:
    ```json
    {
      "documentation_jobs": [
        {
          "id": 1,
          "repository": { "id": 1, "name": "string", "full_name": "string" },
          "status": "pending|processing|completed|failed",
          "file_count": 0,
          "processed_files": 0,
          "progress_percentage": 0,
          "error_message": "string|null",
          "created_at": "ISO8601",
          "started_at": "ISO8601|null",
          "completed_at": "ISO8601|null"
        }
      ],
      "total_count": 0
    }
    ```

- POST `/<repository_id>/generate-docs/`
  - Auth: required
  - Request: none
  - Response (success):
    ```json
    {
      "message": "Documentation generated successfully",
      "job_id": 1,
      "status": "completed",
      "results": [ { "type": "readme" | "file", "title?": "string", "content?": "string", "file_name?": "string", "file_path?": "string", "documentation?": [ { "type": "function|class", "name": "string", "line": 0, "generated_doc": "string" } ] } ],
      "stats": { "files_processed": 0, "total_functions": 0, "total_classes": 0, "documentation_items": 0 }
    }
    ```

- GET `/jobs/<job_id>/`
  - Auth: required
  - Request: none
  - Response:
    ```json
    {
      "id": 1,
      "repository": { "id": 1, "name": "string", "full_name": "string" },
      "status": "pending|processing|completed|failed",
      "file_count": 0,
      "processed_files": 0,
      "progress_percentage": 0,
      "generated_docs": "string",
      "error_message": "string|null",
      "created_at": "ISO8601",
      "started_at": "ISO8601|null",
      "completed_at": "ISO8601|null"
    }
    ```



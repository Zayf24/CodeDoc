# Repository management views for CodeDoc application
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.db import transaction
from allauth.socialaccount.models import SocialAccount
from .models import Repository, RepositoryFile, DocumentationJob
from .services import GitHubService
from .gemini_services import GeminiDocService
import logging
from django.shortcuts import get_object_or_404

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_repositories(request):
    """List user's GitHub repositories"""
    try:
        repositories = Repository.objects.filter(user=request.user)
        
        repos_data = []
        for repo in repositories:
            # Count files (this will show 0 if not synced)
            total_files = repo.files.count()
            python_files = repo.files.filter(is_supported=True).count()
            
            repos_data.append({
                'id': repo.id,
                'github_id': repo.github_id,
                'name': repo.name,
                'full_name': repo.full_name,
                'description': repo.description,
                'language': repo.language,
                'private': repo.private,
                'stars_count': repo.stars_count,
                'forks_count': repo.forks_count,
                'updated_at': repo.updated_at,
                'is_selected': repo.is_selected,
                'github_url': repo.github_url,
                'total_files': total_files,
                'python_files': python_files,
                'files_synced': total_files > 0,  # Add this to indicate if files are synced
            })
        
        return Response({
            'repositories': repos_data,
            'total_count': len(repos_data)
        })
    
    except Exception as e:
        logger.error(f"Error listing repositories: {str(e)}")
        return Response({
            'error': 'Failed to fetch repositories'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def sync_repositories(request):
    """Sync user's repositories from GitHub"""
    try:
        # Check if user has GitHub connected
        if not GitHubService.has_github_connection(request.user):
            return Response({
                'error': 'GitHub account not connected. Please connect your GitHub account first.',
                'needs_github_connection': True
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Sync repositories using GitHubService
        github_service = GitHubService(request.user)
        synced_repos = github_service.sync_repositories()
        
        return Response({
            'message': f'Successfully synced {len(synced_repos)} repositories',
            'synced_count': len(synced_repos)
        })
    
    except Exception as e:
        logger.error(f"Repository sync error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def select_repositories(request):
    """
    Select/deselect repositories for documentation generation.
    
    This endpoint uses database transactions to ensure data consistency:
    1. First deselects all user repositories to reset state
    2. Then selects only the specified repositories
    3. Uses atomic transaction to prevent partial updates
    """
    try:
        selected_repo_ids = request.data.get('repository_ids', [])
        
        if not isinstance(selected_repo_ids, list):
            return Response({
                'error': 'repository_ids must be a list'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            # Reset all repositories to unselected state
            Repository.objects.filter(user=request.user).update(is_selected=False)
            
            # Select only the specified repositories
            if selected_repo_ids:
                selected_count = Repository.objects.filter(
                    user=request.user,
                    id__in=selected_repo_ids
                ).update(is_selected=True)
                
                return Response({
                    'message': f'Successfully selected {selected_count} repositories',
                    'selected_count': selected_count
                })
            else:
                return Response({
                    'message': 'All repositories deselected',
                    'selected_count': 0
                })
    
    except Exception as e:
        logger.error(f"Error selecting repositories: {str(e)}")
        return Response({
            'error': 'Failed to update repository selection'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def selected_repositories(request):
    """Get user's selected repositories"""
    try:
        selected_repos = Repository.objects.filter(user=request.user, is_selected=True)
        
        repos_data = []
        for repo in selected_repos:
            repos_data.append({
                'id': repo.id,
                'name': repo.name,
                'full_name': repo.full_name,
                'description': repo.description,
                'language': repo.language,
                'github_url': repo.github_url,
                'file_count': repo.files.count(),
                'supported_file_count': repo.files.filter(is_supported=True).count(),
            })
        
        return Response({
            'selected_repositories': repos_data,
            'count': len(repos_data)
        })
    
    except Exception as e:
        logger.error(f"Error fetching selected repositories: {str(e)}")
        return Response({
            'error': 'Failed to fetch selected repositories'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def sync_repository_files(request, repository_id):
    """Sync files for a specific repository"""
    try:
        repository = Repository.objects.get(id=repository_id, user=request.user)
        
        # Check if user has GitHub connected
        if not GitHubService.has_github_connection(request.user):
            return Response({
                'error': 'GitHub account not connected. Please connect your GitHub account first.',
                'needs_github_connection': True
            }, status=status.HTTP_400_BAD_REQUEST)
        
        github_service = GitHubService(request.user)
        files = github_service.fetch_repository_files(repository)
        
        return Response({
            'message': f'Successfully synced {len(files)} files for {repository.name}',
            'file_count': len(files),
            'supported_files': len([f for f in files if f.is_supported])
        })
    
    except Repository.DoesNotExist:
        return Response({
            'error': 'Repository not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"File sync error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def sync_selected_repositories_files(request):
    """
    Bulk sync files for all selected repositories.
    
    This endpoint processes multiple repositories in sequence:
    1. Validates GitHub connection and repository selection
    2. Iterates through each selected repository
    3. Fetches files using GitHub API with error handling per repo
    4. Aggregates results to provide comprehensive sync status
    5. Continues processing even if individual repos fail
    """
    try:
        # Check if user has GitHub connected
        if not SocialAccount.objects.filter(user=request.user, provider='github').exists():
            return Response({
                'error': 'GitHub account not connected'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        selected_repos = Repository.objects.filter(user=request.user, is_selected=True)
        
        if not selected_repos:
            return Response({
                'error': 'No repositories selected'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        github_service = GitHubService(request.user)
        synced_results = []
        
        # Process each repository individually with error isolation
        for repo in selected_repos:
            try:
                files = github_service.fetch_repository_files(repo)
                python_files_count = len([f for f in files if f.is_supported])
                
                synced_results.append({
                    'repository': repo.name,
                    'total_files': len(files),
                    'python_files': python_files_count,
                    'status': 'success'
                })
                
            except Exception as e:
                logger.error(f"Failed to sync files for {repo.name}: {str(e)}")
                synced_results.append({
                    'repository': repo.name,
                    'status': 'failed',
                    'error': str(e)
                })
        
        # Calculate success rate for user feedback
        successful_syncs = len([r for r in synced_results if r['status'] == 'success'])
        
        return Response({
            'message': f'Successfully synced files for {successful_syncs}/{len(selected_repos)} repositories',
            'results': synced_results
        })
        
    except Exception as e:
        logger.error(f"Bulk file sync error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def repository_files(request, repository_id):
    """Get files for a specific repository"""
    try:
        repository = Repository.objects.get(id=repository_id, user=request.user)
        files = repository.files.all()
        
        files_data = []
        for file in files:
            files_data.append({
                'id': file.id,
                'name': file.name,
                'path': file.path,
                'extension': file.extension,
                'size': file.size,
                'is_supported': file.is_supported,
                'github_url': file.github_url,
            })
        
        return Response({
            'repository': {
                'id': repository.id,
                'name': repository.name,
                'full_name': repository.full_name,
            },
            'files': files_data,
            'total_files': len(files_data),
            'supported_files': len([f for f in files_data if f['is_supported']])
        })
    
    except Repository.DoesNotExist:
        return Response({
            'error': 'Repository not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error fetching repository files: {str(e)}")
        return Response({
            'error': 'Failed to fetch repository files'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def documentation_jobs(request):
    """Get user's documentation jobs"""
    try:
        jobs = DocumentationJob.objects.filter(user=request.user)
        
        jobs_data = []
        for job in jobs:
            jobs_data.append({
                'id': job.id,
                'repository': {
                    'id': job.repository.id,
                    'name': job.repository.name,
                    'full_name': job.repository.full_name,
                },
                'status': job.status,
                'file_count': job.file_count,
                'processed_files': job.processed_files,
                'progress_percentage': job.progress_percentage,
                'error_message': job.error_message,
                'created_at': job.created_at,
                'started_at': job.started_at,
                'completed_at': job.completed_at,
            })
        
        return Response({
            'documentation_jobs': jobs_data,
            'total_count': len(jobs_data)
        })
    
    except Exception as e:
        logger.error(f"Error fetching documentation jobs: {str(e)}")
        return Response({
            'error': 'Failed to fetch documentation jobs'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def github_connection_status(request):
    """Check if user has GitHub connected"""
    try:
        has_connection = GitHubService.has_github_connection(request.user)
        
        if has_connection:
            # Get GitHub account info
            social_account = SocialAccount.objects.get(user=request.user, provider='github')
            github_info = {
                'username': social_account.extra_data.get('login'),
                'avatar_url': social_account.extra_data.get('avatar_url'),
                'id': social_account.extra_data.get('id'),
            }
        else:
            github_info = None
        
        return Response({
            'connected': has_connection,
            'github_info': github_info
        })
    
    except Exception as e:
        logger.error(f"Error checking GitHub connection: {str(e)}")
        return Response({
            'error': 'Failed to check GitHub connection status'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Repository Summary
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def repository_summary(request):
    """
    Get comprehensive summary of user's repository status for dashboard.
    
    This endpoint aggregates multiple data sources to provide:
    1. Repository counts and selection status
    2. GitHub connection status
    3. File analysis readiness
    4. Next steps guidance for user workflow
    5. Detailed repository metadata for selected repos
    """
    try:
        # Get user's repository statistics
        total_repos = Repository.objects.filter(user=request.user).count()
        selected_repos = Repository.objects.filter(user=request.user, is_selected=True)
        
        # Debug logging
        logger.info(f"User {request.user.id} has {total_repos} total repos, {selected_repos.count()} selected")
        
        # Get GitHub connection status
        has_github = SocialAccount.objects.filter(user=request.user, provider='github').exists()
        
        # Prepare selected repository details with file analysis
        selected_repos_data = []
        for repo in selected_repos:
            # Get basic file statistics for analysis readiness
            total_files = repo.files.count()
            python_files = repo.files.filter(is_supported=True).count()
            
            selected_repos_data.append({
                'id': repo.id,
                'name': repo.name,
                'full_name': repo.full_name,
                'description': repo.description,
                'language': repo.language,
                'stars_count': repo.stars_count,
                'total_files': total_files,
                'python_files': python_files,
                'last_updated': repo.updated_at,
                'github_url': repo.github_url,
                'analysis_status': 'pending' if python_files > 0 else 'no_python_files',
            })
        
        # Calculate analysis readiness for user guidance
        ready_for_analysis = len([r for r in selected_repos_data if r['python_files'] > 0])
        
        return Response({
            'summary': {
                'total_repositories': total_repos,
                'selected_repositories': selected_repos.count(),
                'github_connected': has_github,
                'ready_for_analysis': ready_for_analysis,
            },
            'selected_repositories': selected_repos_data,
            'next_steps': {
                'needs_github_connection': not has_github,
                'needs_repository_sync': has_github and total_repos == 0,
                'needs_repository_selection': total_repos > 0 and selected_repos.count() == 0,
                'ready_for_analysis': selected_repos.count() > 0,
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching repository summary: {str(e)}")
        return Response({
            'error': 'Failed to fetch repository summary'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def analyze_repository_code(request, repository_id):
    """Analyze Python code in a specific repository"""
    try:
        # Remove the is_selected=True requirement for analysis
        repository = Repository.objects.get(id=repository_id, user=request.user)
        
        # Debug logging
        logger.info(f"Analyzing repository {repository.name} (ID: {repository_id}) for user {request.user.id}")
        
        # Check if user has GitHub connected
        if not SocialAccount.objects.filter(user=request.user, provider='github').exists():
            logger.error(f"User {request.user.id} doesn't have GitHub connected")
            return Response({
                'error': 'GitHub account not connected'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        github_service = GitHubService(request.user)
        
        try:
            analysis_result = github_service.analyze_repository_python_files(repository)
            logger.info(f"Analysis completed for repository {repository.name}")
            return Response(analysis_result)
        except Exception as analysis_error:
            logger.error(f"Analysis failed for repository {repository.name}: {str(analysis_error)}")
            return Response({
                'error': f'Analysis failed: {str(analysis_error)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Repository.DoesNotExist:
        logger.error(f"Repository {repository_id} not found for user {request.user.id}")
        return Response({
            'error': 'Repository not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error analyzing repository code: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_python_file_analysis(request, repository_id, file_id):
    """Get detailed analysis of a specific Python file"""
    try:
        repository = Repository.objects.get(id=repository_id, user=request.user)
        file_obj = RepositoryFile.objects.get(id=file_id, repository=repository)
        
        if not file_obj.is_supported:
            return Response({
                'error': 'File type not supported for analysis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user has GitHub connected
        if not SocialAccount.objects.filter(user=request.user, provider='github').exists():
            return Response({
                'error': 'GitHub account not connected'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        github_service = GitHubService(request.user)
        
        # Fetch file content
        file_content = github_service.get_file_content(repository, file_obj.path)
        
        # Analyze the file
        analysis = github_service.analyze_python_file(file_content, file_obj.path)
        
        # Add file metadata
        analysis['file_info'] = {
            'id': file_obj.id,
            'name': file_obj.name,
            'path': file_obj.path,
            'size': file_obj.size,
            'github_url': file_obj.github_url
        }
        
        return Response(analysis)
        
    except Repository.DoesNotExist:
        return Response({
            'error': 'Repository not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except RepositoryFile.DoesNotExist:
        return Response({
            'error': 'File not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error analyzing Python file: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_repository_analysis_summary(request):
    """Get analysis summary for all selected repositories"""
    try:
        selected_repos = Repository.objects.filter(user=request.user, is_selected=True)
        
        if not selected_repos.exists():
            return Response({
                'error': 'No repositories selected'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        summary = {
            'total_selected_repositories': selected_repos.count(),
            'repositories_with_python': 0,
            'total_python_files': 0,
            'ready_for_analysis': 0,
            'repositories': []
        }
        
        for repo in selected_repos:
            python_files = repo.files.filter(is_supported=True).count()
            
            if python_files > 0:
                summary['repositories_with_python'] += 1
                summary['total_python_files'] += python_files
                summary['ready_for_analysis'] += 1
            
            summary['repositories'].append({
                'id': repo.id,
                'name': repo.name,
                'full_name': repo.full_name,
                'python_files': python_files,
                'ready_for_analysis': python_files > 0
            })
        
        return Response(summary)
        
    except Exception as e:
        logger.error(f"Error fetching analysis summary: {str(e)}")
        return Response({
            'error': 'Failed to fetch analysis summary'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# backend/repositories/views.py (update your existing generate_docs view)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_documentation(request, repository_id):
    """
    Generate documentation for a repository using asynchronous batch processing.
    
    This endpoint implements a job queue pattern:
    1. Validates repository has Python files for analysis
    2. Prevents duplicate jobs by checking existing status
    3. Creates a DocumentationJob record to track progress
    4. Queues the actual work as a Celery background task
    5. Returns immediately with job status for user feedback
    
    The actual documentation generation happens asynchronously
    to avoid blocking the user interface.
    """
    try:
        repository = get_object_or_404(Repository, id=repository_id, user=request.user)
        
        # Validate repository has analyzable Python files
        python_files = RepositoryFile.objects.filter(
            repository=repository,
            is_supported=True
        )
        
        if not python_files.exists():
            return Response({
                'error': 'No Python files found in this repository'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Prevent duplicate jobs by checking existing status
        existing_job = DocumentationJob.objects.filter(
            repository=repository,
            user=request.user,
            status__in=['pending', 'processing']
        ).first()
        
        if existing_job:
            return Response({
                'message': 'Documentation generation already in progress',
                'job_id': existing_job.id,
                'status': existing_job.status
            }, status=status.HTTP_200_OK)
        
        # Create job record to track progress and status
        job = DocumentationJob.objects.create(
            repository=repository,
            user=request.user,
            status='pending',
            file_count=python_files.count(),
            processed_files=0
        )
        
        # Queue the actual work as a Celery background task
        from .tasks import generate_repository_documentation
        generate_repository_documentation.delay(job.id, repository_id)
        
        return Response({
            'message': 'Documentation generation started',
            'job_id': job.id,
            'status': 'pending',
            'total_files': python_files.count()
        }, status=status.HTTP_202_ACCEPTED)
        
    except Exception as e:
        logger.error(f"Error starting documentation generation: {str(e)}")
        return Response({
            'error': f'Failed to start documentation generation: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_documentation_job(request, job_id):
    """Get documentation job status and results"""
    try:
        job = DocumentationJob.objects.get(id=job_id, user=request.user)
        
        return Response({
            'id': job.id,
            'repository': {
                'id': job.repository.id,
                'name': job.repository.name,
                'full_name': job.repository.full_name
            },
            'status': job.status,
            'file_count': job.file_count,
            'processed_files': job.processed_files,
            'progress_percentage': job.progress_percentage,
            'generated_docs': job.generated_docs,
            'error_message': job.error_message,
            'created_at': job.created_at,
            'started_at': job.started_at,
            'completed_at': job.completed_at
        })
        
    except DocumentationJob.DoesNotExist:
        return Response({
            'error': 'Documentation job not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_documentation_content(request, job_id):
    """Get the generated documentation content for a specific job"""
    try:
        job = DocumentationJob.objects.get(id=job_id, user=request.user)
        
        if job.status != 'completed':
            return Response({
                'error': 'Documentation job is not completed yet'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not job.generated_docs:
            return Response({
                'error': 'No documentation content found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Parse the JSON content
        import json
        try:
            documentation_content = json.loads(job.generated_docs)
        except json.JSONDecodeError:
            return Response({
                'error': 'Invalid documentation content format'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'job_id': job.id,
            'repository': {
                'id': job.repository.id,
                'name': job.repository.name,
                'full_name': job.repository.full_name
            },
            'content': documentation_content,
            'generated_at': job.completed_at
        })
        
    except DocumentationJob.DoesNotExist:
        return Response({
            'error': 'Documentation job not found'
        }, status=status.HTTP_404_NOT_FOUND)

# GitHub API service for repository management and code analysis
import requests
from django.conf import settings
from allauth.socialaccount.models import SocialAccount, SocialToken
from .models import Repository, RepositoryFile
import logging
import os
import ast
import base64

logger = logging.getLogger(__name__)

class GitHubService:
    """Service for interacting with GitHub API"""
    
    def __init__(self, user):
        self.user = user
        self.access_token = self._get_github_token()
    
    def _get_github_token(self):
        """Get GitHub access token for the user"""
        try:
            social_account = SocialAccount.objects.get(user=self.user, provider='github')
            social_token = SocialToken.objects.get(account=social_account)
            return social_token.token
        except SocialAccount.DoesNotExist:
            raise Exception("GitHub account not connected. Please connect your GitHub account first.")
        except SocialToken.DoesNotExist:
            raise Exception("GitHub token not found. Please reconnect your GitHub account.")
    
    def _get_headers(self):
        """Get headers for GitHub API requests"""
        if not self.access_token:
            raise Exception("No GitHub access token available")
        
        return {
            'Authorization': f'token {self.access_token}',
            'Accept': 'application/vnd.github.v3+json'
        }
    
    def fetch_repositories(self, per_page=100):
        """
        Fetch user's repositories from GitHub API with pagination.
        
        This method implements efficient GitHub API pagination:
        1. Makes requests to GitHub API with proper authentication
        2. Handles pagination automatically to fetch all repositories
        3. Sorts repositories by update date (most recent first)
        4. Limits results to 100 repositories for performance
        5. Handles API errors gracefully with logging
        
        The method continues fetching pages until all repositories
        are retrieved or the limit is reached.
        """
        headers = self._get_headers()
        repositories = []
        page = 1
        
        while True:
            url = 'https://api.github.com/user/repos'
            params = {
                'type': 'all',  # all, owner, public, private, member
                'sort': 'updated',
                'per_page': per_page,
                'page': page
            }
            
            response = requests.get(url, headers=headers, params=params)
            
            if response.status_code != 200:
                logger.error(f"GitHub API error: {response.status_code} - {response.text}")
                break
            
            page_repos = response.json()
            
            if not page_repos:  # No more repositories
                break
            
            repositories.extend(page_repos)
            
            # For demo purposes, limit to first 100 repos
            if len(repositories) >= 100:
                break
            
            page += 1
        
        return repositories
    
    def sync_repositories(self):
        """Sync user's repositories with local database"""
        try:
            github_repos = self.fetch_repositories()
            synced_repos = []
            
            for repo_data in github_repos:
                # Skip forks for demo (focus on original repos)
                if repo_data.get('fork', False):
                    continue
                
                repo, created = Repository.objects.update_or_create(
                    github_id=repo_data['id'],
                    defaults={
                        'user': self.user,
                        'name': repo_data['name'],
                        'full_name': repo_data['full_name'],
                        'description': repo_data.get('description', ''),
                        'language': repo_data.get('language'),
                        'private': repo_data['private'],
                        'stars_count': repo_data['stargazers_count'],
                        'forks_count': repo_data['forks_count'],
                        'updated_at': repo_data['updated_at']
                    }
                )
                synced_repos.append(repo)
            
            return synced_repos
        
        except Exception as e:
            logger.error(f"Error syncing repositories: {str(e)}")
            raise Exception(f"Failed to sync repositories: {str(e)}")
    
    def fetch_repository_files(self, repository, path=""):
        """
        Fetch files from a specific repository with recursive directory traversal.
        
        This method implements comprehensive file discovery:
        1. Fetches files from the specified path in the repository
        2. Recursively explores subdirectories (limited depth for performance)
        3. Identifies supported file types (Python files for documentation)
        4. Creates or updates RepositoryFile records in the database
        5. Handles both files and directories appropriately
        
        The method limits directory depth to prevent excessive API calls
        while ensuring comprehensive file coverage.
        """
        headers = self._get_headers()
        url = f'https://api.github.com/repos/{repository.full_name}/contents/{path}'
        
        response = requests.get(url, headers=headers)
        
        if response.status_code != 200:
            raise Exception(f"Failed to fetch repository files: {response.status_code}")
        
        files_data = response.json()
        files = []
        
        for file_data in files_data:
            if file_data['type'] == 'file':
                # Extract file extension properly
                file_name = file_data['name']
                _, extension = os.path.splitext(file_name)
                
                # Check if file type is supported (for demo, only Python)
                is_supported = extension.lower() == '.py'
                
                # Debug logging
                logger.info(f"Processing file: {file_name}, extension: {extension}, is_supported: {is_supported}")
                
                file_obj, created = RepositoryFile.objects.update_or_create(
                    repository=repository,
                    path=file_data['path'],
                    defaults={
                        'name': file_name,
                        'extension': extension,
                        'size': file_data['size'],
                        'content_sha': file_data['sha'],
                        'is_supported': is_supported,
                    }
                )
                files.append(file_obj)
            
            elif file_data['type'] == 'dir':
                # Recursively fetch files from subdirectories (limit depth for demo)
                if path.count('/') < 2:  # Reduced depth to avoid too many API calls
                    try:
                        subdir_files = self.fetch_repository_files(repository, file_data['path'])
                        files.extend(subdir_files)
                    except Exception as e:
                        logger.warning(f"Failed to fetch files from {file_data['path']}: {str(e)}")
        
        return files
    
    def get_file_content(self, repository, file_path):
        """
        Get raw content of a specific file from GitHub API.
        
        This method handles GitHub's file content API:
        1. Makes authenticated request to GitHub's contents endpoint
        2. Handles base64-encoded content from GitHub API
        3. Decodes content to UTF-8 for Python processing
        4. Provides detailed error handling for network and API issues
        5. Returns file content as a string for AST analysis
        
        The method is essential for code analysis and documentation
        generation, as it provides the actual source code content.
        """
        headers = self._get_headers()
        url = f'https://api.github.com/repos/{repository.full_name}/contents/{file_path}'
        
        try:
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                file_data = response.json()
                
                # Handle base64 encoded content
                if file_data.get('encoding') == 'base64':
                    content = base64.b64decode(file_data['content']).decode('utf-8')
                    return content
                else:
                    return file_data.get('content', '')
            else:
                raise Exception(f"GitHub API returned {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            raise Exception(f"Network error fetching file content: {str(e)}")
        except Exception as e:
            raise Exception(f"Error fetching file content: {str(e)}")
    
    def analyze_python_file(self, file_content, file_path):
        """
        Analyze Python file content to extract functions, classes, and metadata.
        
        This method implements comprehensive Python code analysis:
        1. Parses Python source code using AST (Abstract Syntax Tree)
        2. Extracts function definitions with detailed metadata
        3. Extracts class definitions with method information
        4. Identifies import statements and module structure
        5. Calculates complexity metrics for code quality assessment
        
        The AST-based approach provides accurate parsing without
        executing code, making it safe for untrusted repositories.
        """
        try:
            # Parse the Python AST
            tree = ast.parse(file_content)
            
            analysis = {
                'file_path': file_path,
                'line_count': len(file_content.splitlines()),
                'functions': [],
                'classes': [],
                'imports': [],
                'module_docstring': ast.get_docstring(tree),
                'has_main': False
            }
            
            # Walk through AST nodes
            for node in ast.walk(tree):
                
                # Extract function definitions
                if isinstance(node, ast.FunctionDef):
                    func_info = self._extract_function_info(node, file_content)
                    analysis['functions'].append(func_info)
                    
                    # Check for main function
                    if node.name == 'main':
                        analysis['has_main'] = True
                
                # Extract class definitions
                elif isinstance(node, ast.ClassDef):
                    class_info = self._extract_class_info(node, file_content)
                    analysis['classes'].append(class_info)
                
                # Extract import statements
                elif isinstance(node, ast.Import):
                    for alias in node.names:
                        analysis['imports'].append({
                            'type': 'import',
                            'name': alias.name,
                            'alias': alias.asname,
                            'line': node.lineno
                        })
                
                elif isinstance(node, ast.ImportFrom):
                    module = node.module or ''
                    for alias in node.names:
                        analysis['imports'].append({
                            'type': 'from_import',
                            'module': module,
                            'name': alias.name,
                            'alias': alias.asname,
                            'line': node.lineno
                        })
            
            return analysis
            
        except SyntaxError as e:
            logger.warning(f"Syntax error in Python file {file_path}: {str(e)}")
            return {
                'file_path': file_path,
                'error': f"Syntax error: {str(e)}",
                'line_count': len(file_content.splitlines()),
                'functions': [],
                'classes': []
            }
        except Exception as e:
            logger.error(f"Error analyzing Python file {file_path}: {str(e)}")
            return {
                'file_path': file_path,
                'error': str(e),
                'line_count': 0,
                'functions': [],
                'classes': []
            }
    
    def _extract_function_info(self, node, file_content):
        """
        Extract detailed information about a Python function.
        
        This method analyzes function AST nodes to extract:
        1. Function signature (name, arguments, return type)
        2. Source code lines for context analysis
        3. Decorators and async status
        4. Docstring presence and content
        5. Complexity metrics for code quality assessment
        
        The method uses line-based analysis to determine function
        boundaries and extract relevant source code segments.
        """
        # Get function source code lines
        file_lines = file_content.splitlines()
        
        # Calculate function end line (approximate)
        func_lines = []
        if node.lineno <= len(file_lines):
            start_line = node.lineno - 1  # Convert to 0-based indexing
            
            # Try to get the function body (simplified approach)
            indent_level = None
            for i in range(start_line, min(len(file_lines), start_line + 50)):  # Look ahead max 50 lines
                line = file_lines[i]
                if line.strip():  # Non-empty line
                    if indent_level is None:
                        indent_level = len(line) - len(line.lstrip())
                    elif len(line) - len(line.lstrip()) <= indent_level and i > start_line:
                        break  # End of function
                func_lines.append(line)
        
        return {
            'name': node.name,
            'line_number': node.lineno,
            'end_line': node.lineno + len(func_lines) - 1,
            'args': [arg.arg for arg in node.args.args],
            'returns': ast.unparse(node.returns) if node.returns else None,
            'docstring': ast.get_docstring(node),
            'has_docstring': ast.get_docstring(node) is not None,
            'is_async': isinstance(node, ast.AsyncFunctionDef),
            'decorators': [ast.unparse(dec) for dec in node.decorator_list],
            'source_code': '\n'.join(func_lines),
            'complexity_score': self._calculate_complexity(node)
        }
    
    def _extract_class_info(self, node, file_content):
        """
        Extract detailed information about a Python class.
        
        This method analyzes class AST nodes to extract:
        1. Class name, base classes, and decorators
        2. Method definitions with detailed metadata
        3. Method types (instance, static, class methods)
        4. Private method identification
        5. Documentation coverage statistics
        
        The method provides comprehensive class analysis for
        documentation generation and code quality assessment.
        """
        methods = []
        
        # Extract methods within the class
        for class_node in node.body:
            if isinstance(class_node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                method_info = self._extract_function_info(class_node, file_content)
                method_info['is_method'] = True
                method_info['is_private'] = class_node.name.startswith('_')
                method_info['is_magic'] = class_node.name.startswith('__') and class_node.name.endswith('__')
                methods.append(method_info)
        
        return {
            'name': node.name,
            'line_number': node.lineno,
            'docstring': ast.get_docstring(node),
            'has_docstring': ast.get_docstring(node) is not None,
            'methods': methods,
            'base_classes': [ast.unparse(base) for base in node.bases],
            'decorators': [ast.unparse(dec) for dec in node.decorator_list],
            'method_count': len(methods),
            'undocumented_methods': len([m for m in methods if not m['has_docstring']])
        }
    
    def _calculate_complexity(self, node):
        """
        Calculate a simple complexity score for a Python function.
        
        This method implements cyclomatic complexity calculation:
        1. Base complexity of 1 for any function
        2. +1 for each decision point (if, while, for, try/except)
        3. +1 for each boolean operator (and, or) that creates branching
        4. +1 for each context manager (with statement)
        
        Higher complexity indicates more complex logic and potential
        maintenance issues. This metric helps identify functions that
        might benefit from refactoring.
        """
        complexity = 1  # Base complexity
        
        for child in ast.walk(node):
            # Count decision points
            if isinstance(child, (ast.If, ast.While, ast.For, ast.Try, ast.With)):
                complexity += 1
            elif isinstance(child, ast.BoolOp):
                complexity += len(child.values) - 1
        
        return complexity
    
    def analyze_repository_python_files(self, repository):
        """
        Analyze all Python files in a repository for comprehensive insights.
        
        This method implements repository-wide code analysis:
        1. Identifies all Python files in the repository
        2. Analyzes each file individually using AST parsing
        3. Aggregates statistics across all files
        4. Calculates documentation coverage metrics
        5. Provides detailed analysis results for each file
        
        The method handles errors gracefully and continues processing
        even if individual files fail analysis, ensuring comprehensive
        repository coverage.
        """
        try:
            # Get all Python files for this repository
            python_files = repository.files.filter(is_supported=True, extension='.py')
            
            if not python_files.exists():
                return {
                    'repository': repository.name,
                    'status': 'no_python_files',
                    'message': 'No Python files found in repository'
                }
            
            analyzed_files = []
            total_functions = 0
            total_classes = 0
            undocumented_functions = 0
            undocumented_classes = 0
            
            for file_obj in python_files:
                try:
                    # Fetch file content
                    file_content = self.get_file_content(repository, file_obj.path)
                    
                    # Analyze the file
                    analysis = self.analyze_python_file(file_content, file_obj.path)
                    
                    # Add file metadata
                    analysis['file_id'] = file_obj.id
                    analysis['file_name'] = file_obj.name
                    analysis['file_size'] = file_obj.size
                    
                    analyzed_files.append(analysis)
                    
                    # Update counters
                    if 'error' not in analysis:
                        total_functions += len(analysis['functions'])
                        total_classes += len(analysis['classes'])
                        
                        undocumented_functions += len([f for f in analysis['functions'] if not f['has_docstring']])
                        undocumented_classes += len([c for c in analysis['classes'] if not c['has_docstring']])
                    
                except Exception as e:
                    logger.error(f"Failed to analyze file {file_obj.path}: {str(e)}")
                    analyzed_files.append({
                        'file_id': file_obj.id,
                        'file_name': file_obj.name,
                        'file_path': file_obj.path,
                        'error': str(e)
                    })
            
            return {
                'repository': repository.name,
                'status': 'completed',
                'files_analyzed': len(analyzed_files),
                'total_functions': total_functions,
                'total_classes': total_classes,
                'undocumented_functions': undocumented_functions,
                'undocumented_classes': undocumented_classes,
                'documentation_coverage': {
                    'functions': round((total_functions - undocumented_functions) / total_functions * 100, 1) if total_functions > 0 else 100,
                    'classes': round((total_classes - undocumented_classes) / total_classes * 100, 1) if total_classes > 0 else 100
                },
                'analyzed_files': analyzed_files
            }
            
        except Exception as e:
            logger.error(f"Error analyzing repository {repository.name}: {str(e)}")
            return {
                'repository': repository.name,
                'status': 'error',
                'error': str(e)
            }
    
    @classmethod
    def has_github_connection(cls, user):
        """Check if user has a valid GitHub connection"""
        try:
            social_account = SocialAccount.objects.get(user=user, provider='github')
            social_token = SocialToken.objects.get(account=social_account)
            return True
        except (SocialAccount.DoesNotExist, SocialToken.DoesNotExist):
            return False

# Context enhancement for AI-powered documentation generation
import ast
from typing import Dict, List, Any
from .models import RepositoryFile, Repository
from .ast_utils import (
    get_base_class_name,
    get_decorator_name,
    get_return_annotation,
    extract_class_variables,
    get_inheritance_info,
    extract_function_calls,
    extract_variables,
    extract_imports,
    extract_constants,
    calculate_function_complexity,
    analyze_class_usage_patterns,
    infer_file_purpose,
    calculate_complexity_metrics
)

def extract_enhanced_context(file_obj: RepositoryFile, repository: Repository, github_service) -> Dict[str, Any]:
    """
    Extract comprehensive context for better AI documentation generation.
    
    This function implements sophisticated context extraction:
    1. Fetches file content from GitHub API using GitHubService
    2. Parses Python code using AST for structural analysis
    3. Extracts functions, classes, imports, and constants
    4. Identifies file purpose and complexity metrics
    5. Finds related files for broader context understanding
    
    Enhanced context significantly improves AI documentation quality
    by providing comprehensive information about code structure,
    relationships, and purpose within the repository.
    """
    try:
        # Use GitHubService to fetch file content from GitHub API
        print(f"Fetching content for file: {file_obj.path} in repo: {repository.name}")
        file_content = github_service.get_file_content(repository, file_obj.path)
        
        if not file_content:
            print(f"Warning: No content received for file {file_obj.path}")
            return {'error': 'No file content received'}
        
        print(f"File content length: {len(file_content)} characters")
        
        # Parse the file content with AST
        tree = ast.parse(file_content)
        
        # Extract comprehensive context
        context = {
            'file_info': {
                'name': file_obj.name,
                'path': file_obj.path,
                'size': file_obj.size,
                'repository': repository.name
            },
            'module_docstring': ast.get_docstring(tree),
            'imports': extract_imports(tree),
            'functions': extract_functions_with_context(tree, file_content),
            'classes': extract_classes_with_context(tree, file_content),
            'constants': extract_constants(tree),
            'related_files': get_related_files(file_obj, repository),
            'file_purpose': infer_file_purpose(file_obj, tree),
            'complexity_metrics': calculate_complexity_metrics(tree)
        }

        print(f'Context extracted for {file_obj.name}: {len(context.get("functions", []))} functions, {len(context.get("classes", []))} classes')
        print(f'Context keys: {list(context.keys())}')
        return context
        
    except Exception as e:
        print(f"Error extracting context for {file_obj.name}: {str(e)}")
        import traceback
        traceback.print_exc()
        return {'error': str(e)}

# Rest of your existing functions remain the same...
def extract_functions_with_context(tree: ast.AST, file_content: str) -> List[Dict[str, Any]]:
    """
    Extract functions with comprehensive context for documentation.
    
    This function analyzes function AST nodes to extract:
    1. Function signature (name, arguments, return type)
    2. Source code lines for context analysis
    3. Decorators and async status
    4. Complexity metrics and function calls
    5. Surrounding code context for better understanding
    
    The function provides rich context that helps AI generate
    more accurate and relevant documentation by understanding
    the function's role and usage patterns.
    """
    functions = []
    lines = file_content.split('\n')
    
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            # Get function source code
            func_lines = lines[node.lineno - 1:node.end_lineno]
            source_code = '\n'.join(func_lines)
            
            # Extract detailed function info
            func_info = {
                'name': node.name,
                'line_start': node.lineno,
                'line_end': node.end_lineno,
                'args': [arg.arg for arg in node.args.args],
                'returns': get_return_annotation(node),
                'decorators': [get_decorator_name(d) for d in node.decorator_list],
                'docstring': ast.get_docstring(node),
                'source_code': source_code,
                'is_async': isinstance(node, ast.AsyncFunctionDef),
                'complexity_score': calculate_function_complexity(node),
                'calls_made': extract_function_calls(node),
                'variables_used': extract_variables(node),
                'surrounding_context': get_surrounding_context(lines, node.lineno, node.end_lineno)
            }
            
            functions.append(func_info)
    
    return functions

def extract_classes_with_context(tree: ast.AST, file_content: str) -> List[Dict[str, Any]]:
    """
    Extract classes with comprehensive context for documentation.
    
    This function analyzes class AST nodes to extract:
    1. Class name, base classes, and inheritance information
    2. Method definitions with types (property, static, class)
    3. Class variables and decorators
    4. Usage patterns and design characteristics
    5. Relationships with other classes in the file
    
    The function provides detailed class analysis that helps AI
    understand class responsibilities and generate appropriate
    documentation for object-oriented code.
    """
    classes = []
    lines = file_content.split('\n')
    
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            # Extract methods
            methods = []
            for item in node.body:
                if isinstance(item, ast.FunctionDef):
                    methods.append({
                        'name': item.name,
                        'docstring': ast.get_docstring(item),
                        'is_property': any(isinstance(d, ast.Name) and d.id == 'property' 
                                         for d in item.decorator_list),
                        'is_static': any(isinstance(d, ast.Name) and d.id == 'staticmethod' 
                                       for d in item.decorator_list),
                        'is_class_method': any(isinstance(d, ast.Name) and d.id == 'classmethod' 
                                             for d in item.decorator_list)
                    })
            
            class_info = {
                'name': node.name,
                'line_start': node.lineno,
                'line_end': node.end_lineno,
                'docstring': ast.get_docstring(node),
                'base_classes': [get_base_class_name(base) for base in node.bases],
                'methods': methods,
                'decorators': [get_decorator_name(d) for d in node.decorator_list],
                'class_variables': extract_class_variables(node),
                'inheritance_chain': get_inheritance_info(node),
                'usage_patterns': analyze_class_usage_patterns(node)
            }
            
            classes.append(class_info)
    
    return classes

def get_surrounding_context(lines: List[str], start_line: int, end_line: int, context_size: int = 3) -> Dict[str, str]:
    """
    Get code context around function/class for better understanding.
    
    This function extracts surrounding code context:
    1. Captures lines before the function/class definition
    2. Captures lines after the function/class definition
    3. Provides context_size lines of surrounding code
    4. Helps AI understand the broader code structure
    5. Improves documentation relevance and accuracy
    
    Context lines help AI understand how the function/class
    fits into the overall code structure and usage patterns.
    """
    return {
        'before': '\n'.join(lines[max(0, start_line - context_size - 1):start_line - 1]),
        'after': '\n'.join(lines[end_line:min(len(lines), end_line + context_size)])
    }

def get_related_files(file_obj: RepositoryFile, repository: Repository) -> List[Dict[str, str]]:
    """
    Find related files in the same directory or with similar names.
    
    This function identifies files that are contextually related:
    1. Finds files in the same directory for module context
    2. Limits results to prevent information overload
    3. Provides relationship context for AI understanding
    4. Helps AI understand file dependencies and relationships
    5. Improves documentation quality through broader context
    
    Related files help AI understand how the current file
    fits into the broader module and package structure.
    """
    related = []
    
    # Files in same directory
    same_dir_files = RepositoryFile.objects.filter(
        repository=repository,
        path__startswith=file_obj.path.rsplit('/', 1)[0]
    ).exclude(id=file_obj.id)[:5]
    
    for related_file in same_dir_files:
        related.append({
            'name': related_file.name,
            'path': related_file.path,
            'relationship': 'same_directory'
        })
    
    return related

def infer_file_purpose(file_obj: RepositoryFile, tree: ast.AST) -> str:
    """
    Infer the purpose of the file based on its content and name.
    
    This function implements intelligent file purpose detection:
    1. Analyzes filename patterns for common conventions
    2. Examines AST content for structural characteristics
    3. Identifies executable scripts vs. library modules
    4. Categorizes files by function/class ratios
    5. Provides context for AI documentation generation
    
    Understanding file purpose helps AI generate more relevant
    and contextual documentation for different types of code files.
    """
    filename = file_obj.name.lower()
    
    # Common patterns
    if filename.startswith('test_') or filename.endswith('_test.py'):
        return 'test_file'
    elif filename == '__init__.py':
        return 'package_init'
    elif filename in ['settings.py', 'config.py']:
        return 'configuration'
    elif filename in ['models.py', 'model.py']:
        return 'data_models'
    elif filename in ['views.py', 'view.py']:
        return 'web_views'
    elif filename == 'utils.py':
        return 'utilities'
    
    # Analyze content
    has_main = any(isinstance(node, ast.If) and 
                   isinstance(node.test, ast.Compare) and
                   any(isinstance(comp, ast.Str) and comp.s == '__main__' 
                       for comp in ast.walk(node.test))
                   for node in ast.walk(tree))
    
    if has_main:
        return 'executable_script'
    
    # Count functions vs classes
    functions = sum(1 for node in ast.walk(tree) if isinstance(node, ast.FunctionDef))
    classes = sum(1 for node in ast.walk(tree) if isinstance(node, ast.ClassDef))
    
    if classes > functions:
        return 'class_definitions'
    elif functions > 0:
        return 'function_library'
    
    return 'module'

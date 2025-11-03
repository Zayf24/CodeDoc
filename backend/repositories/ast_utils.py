# AST utilities for Python code analysis and documentation generation
import ast
from typing import List, Dict, Any, Optional

def get_base_class_name(node: ast.expr) -> str:
    """Extract base class name from an AST node."""
    if isinstance(node, ast.Name):
        return node.id
    elif isinstance(node, ast.Attribute):
        return f"{get_base_class_name(node.value)}.{node.attr}"
    elif isinstance(node, ast.Constant):
        return str(node.value)
    return "Unknown"

def get_decorator_name(node: ast.expr) -> str:
    """Extract decorator name from an AST node."""
    if isinstance(node, ast.Name):
        return node.id
    elif isinstance(node, ast.Attribute):
        return f"{get_decorator_name(node.value)}.{node.attr}"
    elif isinstance(node, ast.Call):
        return get_decorator_name(node.func)
    return "Unknown"

def get_return_annotation(node: ast.FunctionDef) -> Optional[str]:
    """Extract return type annotation from function node."""
    if node.returns:
        try:
            if hasattr(ast, 'unparse'):
                return ast.unparse(node.returns)
            else:
                # Fallback for older Python versions
                if isinstance(node.returns, ast.Name):
                    return node.returns.id
                elif isinstance(node.returns, ast.Constant):
                    return str(node.returns.value)
        except:
            pass
    return None

def extract_class_variables(class_node: ast.ClassDef) -> List[str]:
    """Extract class variable names from a class node."""
    variables = []
    
    for node in class_node.body:
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    variables.append(target.id)
        elif isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            # Type annotated assignments
            variables.append(node.target.id)
    
    return variables

def get_inheritance_info(class_node: ast.ClassDef) -> Dict[str, Any]:
    """Extract inheritance information from a class node."""
    base_classes = [get_base_class_name(base) for base in class_node.bases]
    
    return {
        'base_classes': base_classes,
        'has_inheritance': len(base_classes) > 0,
        'inheritance_depth': len(base_classes)
    }

def extract_function_calls(node: ast.FunctionDef) -> List[str]:
    """Extract function calls made within a function."""
    calls = []
    
    for child in ast.walk(node):
        if isinstance(child, ast.Call):
            if isinstance(child.func, ast.Name):
                calls.append(child.func.id)
            elif isinstance(child.func, ast.Attribute):
                calls.append(child.func.attr)
    
    return list(set(calls))  # Remove duplicates

def extract_variables(node: ast.FunctionDef) -> List[str]:
    """Extract variable names used within a function."""
    variables = []
    
    for child in ast.walk(node):
        if isinstance(child, ast.Name) and isinstance(child.ctx, ast.Load):
            variables.append(child.id)
    
    return list(set(variables))  # Remove duplicates

def extract_imports(tree: ast.AST) -> List[Dict[str, Any]]:
    """Extract import statements from AST."""
    imports = []
    
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.append({
                    'type': 'import',
                    'name': alias.name,
                    'alias': alias.asname,
                    'from_module': None
                })
        elif isinstance(node, ast.ImportFrom):
            module = node.module if node.module else ''
            for alias in node.names:
                imports.append({
                    'type': 'from_import',
                    'name': alias.name,
                    'alias': alias.asname,
                    'from_module': module
                })
    
    return imports

def extract_constants(tree: ast.AST) -> List[Dict[str, Any]]:
    """Extract module-level constants."""
    constants = []
    
    # Only look at module-level assignments
    if isinstance(tree, ast.Module):
        for node in tree.body:
            if isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name) and target.id.isupper():
                        try:
                            value = ast.literal_eval(node.value) if isinstance(node.value, (ast.Constant, ast.Num, ast.Str, ast.List, ast.Tuple, ast.Dict)) else "Complex value"
                            constants.append({
                                'name': target.id,
                                'value': value,
                                'line': node.lineno
                            })
                        except:
                            constants.append({
                                'name': target.id,
                                'value': "Unknown",
                                'line': node.lineno
                            })
    
    return constants

def calculate_function_complexity(node: ast.FunctionDef) -> int:
    """
    Calculate cyclomatic complexity of a function.
    
    Cyclomatic complexity measures the number of linearly independent paths through code:
    - Base complexity of 1 for any function
    - +1 for each decision point (if, while, for, try/except)
    - +1 for each boolean operator (and, or) that creates branching
    - +1 for each comprehension (list, dict, set comprehensions)
    
    Higher complexity indicates more complex logic and potential maintenance issues.
    """
    complexity = 1  # Base complexity
    
    for child in ast.walk(node):
        if isinstance(child, (ast.If, ast.While, ast.For, ast.AsyncFor)):
            complexity += 1
        elif isinstance(child, ast.ExceptHandler):
            complexity += 1
        elif isinstance(child, (ast.And, ast.Or)):
            complexity += 1
        elif isinstance(child, ast.comprehension):
            complexity += 1
    
    return complexity

def analyze_class_usage_patterns(class_node: ast.ClassDef) -> Dict[str, Any]:
    """Analyze usage patterns within a class."""
    patterns = {
        'has_init': False,
        'has_str': False,
        'has_repr': False,
        'property_count': 0,
        'static_method_count': 0,
        'class_method_count': 0,
        'private_method_count': 0
    }
    
    for node in class_node.body:
        if isinstance(node, ast.FunctionDef):
            # Check special methods
            if node.name == '__init__':
                patterns['has_init'] = True
            elif node.name == '__str__':
                patterns['has_str'] = True
            elif node.name == '__repr__':
                patterns['has_repr'] = True
            
            # Check method types
            for decorator in node.decorator_list:
                decorator_name = get_decorator_name(decorator)
                if decorator_name == 'property':
                    patterns['property_count'] += 1
                elif decorator_name == 'staticmethod':
                    patterns['static_method_count'] += 1
                elif decorator_name == 'classmethod':
                    patterns['class_method_count'] += 1
            
            # Check private methods
            if node.name.startswith('_') and not node.name.startswith('__'):
                patterns['private_method_count'] += 1
    
    return patterns

def infer_file_purpose(file_obj, tree: ast.AST) -> str:
    """
    Infer the purpose of a Python file based on its content and name.
    
    This function uses a two-stage approach:
    1. Filename pattern matching for common Django/Python conventions
    2. AST content analysis for files without clear naming patterns
    
    The content analysis examines:
    - Presence of __main__ check for executable scripts
    - Ratio of classes vs functions to determine file type
    - Overall structure to categorize the module's purpose
    """
    filename = file_obj.name.lower()
    
    # Stage 1: Check filename patterns for common conventions
    if filename.startswith('test_') or filename.endswith('_test.py') or 'test' in filename:
        return 'test_file'
    elif filename == '__init__.py':
        return 'package_init'
    elif filename in ['settings.py', 'config.py', 'configuration.py']:
        return 'configuration'
    elif filename in ['models.py', 'model.py']:
        return 'data_models'
    elif filename in ['views.py', 'view.py']:
        return 'web_views'
    elif filename in ['urls.py', 'routing.py']:
        return 'url_routing'
    elif filename in ['utils.py', 'utilities.py', 'helpers.py']:
        return 'utilities'
    elif filename in ['admin.py']:
        return 'admin_interface'
    elif filename in ['tasks.py', 'jobs.py']:
        return 'background_tasks'
    elif filename in ['serializers.py']:
        return 'data_serialization'
    elif filename.endswith('_api.py') or filename.endswith('_client.py'):
        return 'api_interface'
    
    # Stage 2: Analyze content structure when filename patterns don't match
    has_main = False
    class_count = 0
    function_count = 0
    
    for node in ast.walk(tree):
        if isinstance(node, ast.If):
            # Detect executable script pattern: if __name__ == "__main__":
            if (isinstance(node.test, ast.Compare) and
                isinstance(node.test.left, ast.Name) and
                node.test.left.id == '__name__' and
                any(isinstance(comp, ast.Constant) and comp.value == '__main__' 
                    for comp in node.test.comparators)):
                has_main = True
        elif isinstance(node, ast.ClassDef):
            class_count += 1
        elif isinstance(node, ast.FunctionDef):
            function_count += 1
    
    # Determine purpose based on content analysis results
    if has_main:
        return 'executable_script'
    elif class_count > function_count and class_count > 2:
        return 'class_definitions'
    elif function_count > class_count and function_count > 3:
        return 'function_library'
    elif class_count == 0 and function_count == 0:
        return 'constants_or_config'
    else:
        return 'general_module'

def calculate_complexity_metrics(tree: ast.AST) -> Dict[str, int]:
    """Calculate various complexity metrics for the module."""
    metrics = {
        'total_lines': 0,
        'total_functions': 0,
        'total_classes': 0,
        'total_imports': 0,
        'max_function_complexity': 0,
        'avg_function_complexity': 0
    }
    
    function_complexities = []
    
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            metrics['total_functions'] += 1
            complexity = calculate_function_complexity(node)
            function_complexities.append(complexity)
            metrics['max_function_complexity'] = max(metrics['max_function_complexity'], complexity)
        elif isinstance(node, ast.ClassDef):
            metrics['total_classes'] += 1
        elif isinstance(node, (ast.Import, ast.ImportFrom)):
            metrics['total_imports'] += 1
    
    if function_complexities:
        metrics['avg_function_complexity'] = sum(function_complexities) // len(function_complexities)
    
    return metrics

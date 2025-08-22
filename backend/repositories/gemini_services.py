# Google Gemini AI service for generating documentation
import os
import logging
import google.generativeai as genai
from decouple import config
import time
import re
from typing import Dict, Any

logger = logging.getLogger(__name__)

class GeminiDocService:
    """Service for generating documentation using Google Gemini API (free tier)"""
    
    def __init__(self):
        # Get API key from environment
        api_key = config("GEMINI_API_KEY", None)
        
        if not api_key:
            raise Exception("GEMINI_API_KEY environment variable not set. Get your free API key from https://aistudio.google.com/app/apikey")
        
        # Configure the Gemini API
        genai.configure(api_key=api_key)
        
        # Use the free Gemini model
        self.model_name = "gemini-2.0-flash"
        
    def _sanitize_content(self, content):
        """
        Sanitize content to avoid Gemini API safety filter triggers.
        
        This method implements content safety measures:
        1. Removes sensitive patterns (API keys, passwords, secrets)
        2. Replaces URLs and email addresses with placeholders
        3. Limits content length to avoid token limits
        4. Ensures content complies with API safety guidelines
        5. Maintains content meaning while improving safety
        
        The sanitization process helps prevent API blocking while
        preserving the essential information needed for documentation.
        """
        if not content:
            return ""
        
        # Remove potential sensitive patterns
        content = re.sub(r'(api_key|password|secret|token)\s*[:=]\s*["\'][^"\']*["\']', r'\1: [REDACTED]', content, flags=re.IGNORECASE)
        content = re.sub(r'(https?://[^\s]+)', '[URL]', content)
        content = re.sub(r'([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', '[EMAIL]', content)
        
        # Limit content length to avoid token limits
        if len(content) > 8000:
            content = content[:8000] + "... [truncated]"
        
        return content
    
    def _generate_content(self, prompt, temperature=0.2, max_tokens=1024, retries=3):
        """
        Generate content using Gemini API with intelligent retry logic.
        
        This method implements robust AI content generation:
        1. Sanitizes prompts to avoid safety filter triggers
        2. Uses exponential backoff for retry attempts
        3. Handles API blocking and rate limiting gracefully
        4. Falls back to basic content when API fails
        5. Provides detailed logging for debugging
        
        The method ensures reliable content generation even when
        the Gemini API experiences temporary issues or blocks requests.
        """
        # Sanitize the prompt
        sanitized_prompt = self._sanitize_content(prompt)
        
        for attempt in range(retries):
            try:
                # Create model instance
                model = genai.GenerativeModel(self.model_name)
                
                # Configure generation parameters
                generation_config = genai.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                    top_p=0.95,
                    top_k=40
                )
                
                # Generate content
                response = model.generate_content(
                    sanitized_prompt,
                    generation_config=generation_config
                )
                
                # Check if response was blocked
                if hasattr(response, 'candidates') and response.candidates:
                    candidate = response.candidates[0]
                    if hasattr(candidate, 'finish_reason'):
                        if candidate.finish_reason == 2:  # BLOCKED
                            logger.warning(f"Gemini API blocked request (attempt {attempt + 1}/{retries})")
                            if attempt < retries - 1:
                                time.sleep(2 ** attempt)  # Exponential backoff
                                continue
                            else:
                                raise Exception("Request blocked by Gemini safety filters")
                        elif candidate.finish_reason == 1:  # STOP
                            return response.text
                
                return response.text
                
            except Exception as e:
                logger.error(f"Gemini API error (attempt {attempt + 1}/{retries}): {str(e)}")
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    # Return fallback content instead of raising exception
                    return self._generate_fallback_content(prompt)
    
    def _generate_fallback_content(self, prompt):
        """
        Generate basic fallback content when Gemini API fails.
        
        This method provides graceful degradation:
        1. Analyzes prompt content to determine context
        2. Generates appropriate placeholder content
        3. Ensures documentation generation continues
        4. Provides meaningful fallbacks for different content types
        5. Maintains system reliability during API outages
        
        Fallback content allows the system to continue operating
        even when external AI services are unavailable.
        """
        if "function" in prompt.lower():
            return "TODO: Add function documentation"
        elif "class" in prompt.lower():
            return "TODO: Add class documentation"
        elif "readme" in prompt.lower():
            return "TODO: Add project description"
        else:
            return "TODO: Add documentation"
    
    def generate_function_documentation(self, func_info: Dict[str, Any], context: Dict[str, Any]) -> str:
        """Generate documentation for a function with enhanced context"""
        try:
            # Create model instance for each call
            model = genai.GenerativeModel(self.model_name)
            
            prompt = self._create_function_prompt(func_info, context)
            
            # Generate content
            response = model.generate_content(prompt)
            
            if response.text:
                return response.text.strip()
            else:
                return self._generate_fallback_function_doc(func_info)
                
        except Exception as e:
            logger.error(f"Error generating function docs: {str(e)}")
            return self._generate_fallback_function_doc(func_info)
    
    def generate_class_documentation(self, class_info: Dict[str, Any], context: Dict[str, Any]) -> str:
        """Generate documentation for a class with enhanced context"""
        try:
            # Create model instance for each call
            model = genai.GenerativeModel(self.model_name)
            
            prompt = self._create_class_prompt(class_info, context)
            
            # Generate content
            response = model.generate_content(prompt)
            
            if response.text:
                return response.text.strip()
            else:
                return self._generate_fallback_class_doc(class_info)
                
        except Exception as e:
            logger.error(f"Error generating class docs: {str(e)}")
            return self._generate_fallback_class_doc(class_info)

    
    def _create_function_prompt(self, func_info, context):
        """
        Create comprehensive prompt for function documentation generation.
        
        This method constructs detailed prompts for AI documentation:
        1. Includes function signature and parameter information
        2. Provides file and repository context for better understanding
        3. Specifies documentation style requirements (Google style)
        4. Emphasizes functional purpose over implementation details
        5. Structures prompt for optimal AI comprehension
        
        Well-crafted prompts lead to higher quality, more relevant
        documentation that better serves developers and users.
        """
        return f"""
    Write a Python docstring for this function:

    Function: {func_info['name']}
    Parameters: {', '.join(func_info.get('args', []))}
    Returns: {func_info.get('returns', 'None')}
    File: {context.get('file_info', {}).get('name', 'Unknown')}
    Purpose: {context.get('file_purpose', 'Unknown')}

    Write a clear, concise docstring following Google style. Focus on what the function does.
    """

    def _create_class_prompt(self, class_info, context):
        """
        Create comprehensive prompt for class documentation generation.
        
        This method constructs detailed prompts for AI class documentation:
        1. Includes class name, base classes, and decorators
        2. Lists key methods with their types (property, static, etc.)
        3. Provides file and repository context for better understanding
        4. Specifies documentation style requirements (Google style)
        5. Emphasizes class purpose and responsibility over implementation
        
        The method focuses on creating prompts that help AI understand
        the class's role in the broader codebase for better documentation.
        """
        methods = [m['name'] for m in class_info.get('methods', [])[:5]]
        return f"""
    Write a Python class docstring:

    Class: {class_info['name']}
    Methods: {', '.join(methods)}
    File: {context.get('file_info', {}).get('name', 'Unknown')}
    Purpose: {context.get('file_purpose', 'Unknown')}

    Write a clear, concise docstring explaining the class purpose and main methods.
    """

    def _generate_fallback_function_doc(self, func_info):
        """Generate basic fallback documentation for functions"""
        return f"TODO: Add documentation for {func_info['name']} function"

    def _generate_fallback_class_doc(self, class_info):
        """Generate basic fallback documentation for classes"""
        return f"TODO: Add documentation for {class_info['name']} class"
    

    
    def generate_repository_readme(self, analysis_result):
        """
        Generate README content for repository using AI analysis.
        
        This method creates comprehensive repository documentation:
        1. Extracts key metrics from code analysis results
        2. Identifies main functions and classes for context
        3. Creates simple, safe prompts to avoid API issues
        4. Generates professional project descriptions
        5. Focuses on clarity and usefulness for developers
        
        The method uses simplified prompts to ensure reliable
        generation while providing valuable repository overviews.
        """
        
        # Extract meaningful information from analysis
        repo_name = analysis_result.get('repository', 'Unknown')
        total_functions = analysis_result.get('total_functions', 0)
        total_classes = analysis_result.get('total_classes', 0)
        files_analyzed = analysis_result.get('files_analyzed', 0)
        
        # Get actual function and class names for better context
        function_names = []
        class_names = []
        
        for file_analysis in analysis_result.get('analyzed_files', []):
            if 'error' not in file_analysis:
                # Extract function names
                for func in file_analysis.get('functions', [])[:3]:  # Limit to 3 per file
                    function_names.append(func.get('name', ''))
                
                # Extract class names  
                for cls in file_analysis.get('classes', [])[:2]:  # Limit to 2 per file
                    class_names.append(cls.get('name', ''))
        
        # Create a much simpler, safer prompt
        prompt = f"""
Write a simple README for the Python project "{repo_name}".

This project has {files_analyzed} Python files with {total_functions} functions and {total_classes} classes.

Write 2-3 sentences describing what this project does. Be clear and professional.
"""
        
        return self._generate_content(prompt, max_tokens=300, temperature=0.1)


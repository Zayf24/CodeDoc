# Celery tasks for asynchronous documentation generation
import json
import time
from celery import shared_task
from celery.utils.log import get_task_logger
from django.utils import timezone
from django.contrib.auth import get_user_model

from .simple_batch_processor import SimpleBatchProcessor
from .models import DocumentationJob, Repository, RepositoryFile
from .services import GitHubService
from .gemini_services import GeminiDocService
from .context_enhancer import extract_enhanced_context

logger = get_task_logger(__name__)
User = get_user_model()

@shared_task(bind=True, max_retries=2)
def generate_repository_documentation(self, job_id, repository_id):
    """
    Generate documentation for a repository using AI-powered analysis.
    
    This Celery task implements a sophisticated batch processing pipeline:
    1. Fetches Python files from the repository
    2. Processes files in batches to manage API rate limits
    3. Extracts enhanced context using AST analysis
    4. Generates documentation using Google Gemini AI
    5. Tracks progress and handles errors gracefully
    
    The task uses retry logic for resilience and processes files
    in batches to optimize API usage and memory consumption.
    """
    try:
        # Get job and repository objects
        job = DocumentationJob.objects.get(id=job_id)
        repository = Repository.objects.get(id=repository_id)
        user = job.user

        # Update job status to indicate processing has begun
        job.status = 'processing'
        job.started_at = timezone.now()
        job.save()

        # Get all Python files that can be analyzed
        files = RepositoryFile.objects.filter(
            repository=repository,
            is_supported=True
        ).order_by('id')

        if not files.exists():
            job.status = 'completed'
            job.generated_docs = json.dumps({'message': 'No Python files found'})
            job.completed_at = timezone.now()
            job.save()
            return {'status': 'completed', 'message': 'No files to process'}

        # Initialize services for file processing and AI generation
        github_service = GitHubService(user)
        gemini_service = GeminiDocService()
        processor = SimpleBatchProcessor(
            max_tokens_per_batch=40000,  # Token limit per batch
            max_requests_per_minute=12   # Rate limit for Gemini API
        )

        # Process files in optimized batches
        all_documentation = []
        processed_count = 0
        total_files = files.count()
        
        logger.info(f"Processing {total_files} files for repository {repository.name}")

        for file_obj in files:
            try:
                # Fetch file content from GitHub API
                file_content = github_service.get_file_content(repository, file_obj.path)
                
                # Extract comprehensive context using AST analysis
                enhanced_context = extract_enhanced_context(file_obj, repository, github_service)

                # Prepare file data for batch processing
                file_data = {
                    'file_obj': file_obj,
                    'content': file_content,
                    'context': enhanced_context
                }

                processor.add_file(file_data)

                # Process batch when it reaches optimal size (3 files)
                if len(processor.current_batch) >= 3:
                    batch_results = _process_batch(processor, gemini_service)
                    if batch_results:
                        all_documentation.extend(batch_results)
                    processed_count += len(processor.current_batch)

                    # Update job progress for user feedback
                    job.processed_files = processed_count
                    job.progress_percentage = (processed_count / total_files) * 100
                    job.save()

                    processor._reset_batch()

            except Exception as e:
                logger.error(f"Error processing file {file_obj.name}: {str(e)}")
                continue

        # Process any remaining files in the final batch
        if processor.current_batch:
            batch_results = _process_batch(processor, gemini_service)
            if batch_results:
                all_documentation.extend(batch_results)

        # Generate final documentation
        final_docs = _combine_documentation(all_documentation, repository)
        
        # Debug logging
        logger.info(f"Final documentation structure: {json.dumps(final_docs, indent=2)}")
        logger.info(f"Total documentation items: {len(all_documentation)}")
        logger.info(f"Files with documentation: {[doc['file_name'] for doc in all_documentation if doc and doc.get('documentation')]}")

        # Save results
        job.status = 'completed'
        job.processed_files = total_files
        job.progress_percentage = 100.0
        job.generated_docs = json.dumps(final_docs, indent=2)
        print(f'docs================={json.dumps(final_docs, indent=2)}')
        job.completed_at = timezone.now()
        job.save()

        logger.info(f"Successfully generated documentation for {repository.name}")
        return {'status': 'completed', 'files_processed': total_files}

    except Exception as exc:
        logger.error(f"Documentation generation failed: {str(exc)}")
        
        # Retry logic
        if self.request.retries < self.max_retries:
            countdown = 60 * (self.request.retries + 1)
            raise self.retry(exc=exc, countdown=countdown)

        # Final failure
        job = DocumentationJob.objects.get(id=job_id)
        job.status = 'failed'
        job.error_message = str(exc)
        job.save()
        return {'status': 'failed', 'error': str(exc)}

def _process_batch(processor, gemini_service):
    """
    Process a batch of files and generate documentation.
    
    This function handles the core batch processing logic:
    1. Waits for rate limit compliance before processing
    2. Iterates through each file in the batch
    3. Skips files with context extraction errors
    4. Generates documentation using AI service
    5. Tracks API request count for rate limiting
    
    The function is designed to be resilient - individual file failures
    don't stop the entire batch from being processed.
    """
    if not processor.current_batch:
        return []

    # Ensure we don't exceed API rate limits
    processor._wait_if_rate_limited()
    batch_docs = []
    
    logger.info(f"Processing batch of {len(processor.current_batch)} files")

    for file_data in processor.current_batch:
        try:
            file_obj = file_data['file_obj']
            context = file_data['context']

            # Skip files where context extraction failed
            if 'error' in context:
                logger.warning(f"Skipping {file_obj.name}: {context['error']}")
                continue

            # Generate documentation for this file using AI
            file_documentation = _generate_file_docs(file_obj, context, gemini_service)
            if file_documentation:
                batch_docs.append(file_documentation)

        except Exception as e:
            logger.error(f"Error generating docs for file: {str(e)}")
            continue

    # Track API usage for rate limiting
    processor.requests_made += 1
    return batch_docs

def _generate_file_docs(file_obj, context, gemini_service):
    """
    Generate documentation for a single Python file.
    
    This function processes each file to generate missing documentation:
    1. Analyzes functions and classes that lack docstrings
    2. Uses AI service to generate appropriate documentation
    3. Only processes items that need documentation (missing docstrings)
    4. Handles errors gracefully for individual items
    5. Returns structured documentation data for the file
    
    The function focuses on efficiency by only generating docs
    for items that actually need them.
    """
    file_docs = {
        'file_name': file_obj.name,
        'file_path': file_obj.path,
        'documentation': []
    }

    # Generate documentation for functions missing docstrings
    for func_info in context.get('functions', []):
        if not func_info.get('docstring'):  # Only process undocumented functions
            try:
                doc_content = gemini_service.generate_function_documentation(func_info, context)
                if doc_content and doc_content.strip():
                    file_docs['documentation'].append({
                        'type': 'function',
                        'name': func_info['name'],
                        'line': func_info['line_start'],
                        'generated_doc': doc_content.strip()
                    })
            except Exception as e:
                logger.error(f"Error generating function doc for {func_info['name']}: {str(e)}")

    # Generate documentation for classes missing docstrings
    for class_info in context.get('classes', []):
        if not class_info.get('docstring'):  # Only process undocumented classes
            try:
                doc_content = gemini_service.generate_class_documentation(class_info, context)
                if doc_content and doc_content.strip():
                    file_docs['documentation'].append({
                        'type': 'class',
                        'name': class_info['name'],
                        'line': class_info['line_start'],
                        'generated_doc': doc_content.strip()
                    })
            except Exception as e:
                logger.error(f"Error generating class doc for {class_info['name']}: {str(e)}")

    # Return documentation only if we generated something useful
    return file_docs if file_docs['documentation'] else None


def _combine_documentation(all_docs, repository):
    """
    Combine all generated documentation into a unified format.
    
    This function aggregates documentation from multiple files and calculates
    comprehensive statistics for the entire repository:
    1. Repository metadata and generation timestamp
    2. All file documentation in structured format
    3. Statistical summary of functions, classes, and documentation items
    4. Total counts for user feedback and analysis
    
    The function provides both the raw documentation data and
    meaningful metrics for understanding the documentation coverage.
    """
    combined = {
        'repository': repository.name,
        'generated_at': timezone.now().isoformat(),
        'files': all_docs,
        'stats': {
            'files_processed': len(all_docs),
            'total_functions': 0,
            'total_classes': 0,
            'documentation_items': 0
        }
    }

    # Calculate comprehensive statistics across all files
    for file_doc in all_docs:
        for doc_item in file_doc.get('documentation', []):
            if doc_item['type'] == 'function':
                combined['stats']['total_functions'] += 1
            elif doc_item['type'] == 'class':
                combined['stats']['total_classes'] += 1
            combined['stats']['documentation_items'] += 1

    return combined

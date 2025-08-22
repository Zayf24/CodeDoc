from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Repository(models.Model):
    """Store GitHub repository information"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='repositories')
    github_id = models.IntegerField(unique=True)  # GitHub's repository ID
    name = models.CharField(max_length=200)  # Repository name
    full_name = models.CharField(max_length=200)  # owner/repo-name format
    description = models.TextField(blank=True, null=True)
    language = models.CharField(max_length=50, blank=True, null=True)
    private = models.BooleanField(default=False)
    stars_count = models.IntegerField(default=0)
    forks_count = models.IntegerField(default=0)
    updated_at = models.DateTimeField()  # Last updated on GitHub
    is_selected = models.BooleanField(default=False)  # Selected for documentation
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'repositories'
        ordering = ['-updated_at']  # Show recently updated repos first
        
    def __str__(self):
        return self.full_name
    
    @property
    def github_url(self):
        """Get GitHub URL for this repository"""
        return f"https://github.com/{self.full_name}"

class RepositoryFile(models.Model):
    """Store information about files in repositories"""
    repository = models.ForeignKey(Repository, on_delete=models.CASCADE, related_name='files')
    path = models.CharField(max_length=500)  # File path in repo
    name = models.CharField(max_length=200)  # File name
    extension = models.CharField(max_length=10)  # File extension (.py, .js, etc.)
    size = models.IntegerField(default=0)  # File size in bytes
    content_sha = models.CharField(max_length=40)  # GitHub content SHA
    is_supported = models.BooleanField(default=False)  # Whether we can generate docs for this file type
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'repository_files'
        unique_together = ['repository', 'path']
        ordering = ['path']
    
    def __str__(self):
        return f"{self.repository.name}/{self.path}"
    
    @property
    def is_python_file(self):
        """Check if this is a Python file"""
        return self.extension.lower() == '.py'
    
    @property
    def github_url(self):
        """Get GitHub URL for this file"""
        return f"https://github.com/{self.repository.full_name}/blob/main/{self.path}"

class DocumentationJob(models.Model):
    """Track documentation generation jobs"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    repository = models.ForeignKey(Repository, on_delete=models.CASCADE, related_name='documentation_jobs')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documentation_jobs')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    file_count = models.IntegerField(default=0)  # Number of files to process
    processed_files = models.IntegerField(default=0)  # Number of files processed
    progress_percentage = models.FloatField(default=0.0)
    generated_docs = models.TextField(blank=True)  # Generated documentation content
    error_message = models.TextField(blank=True)  # Error details if failed
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'documentation_jobs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Documentation job for {self.repository.name} - {self.status}"
    
    
    def mark_as_processing(self):
        """Mark job as processing"""
        self.status = 'processing'
        self.started_at = timezone.now()
        self.save()
    
    def mark_as_completed(self, generated_content=""):
        """Mark job as completed"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.generated_docs = generated_content
        self.save()
    
    def mark_as_failed(self, error_message=""):
        """Mark job as failed"""
        self.status = 'failed'
        self.completed_at = timezone.now()
        self.error_message = error_message
        self.save()
    
    def update_progress(self):
        """Calculate and update progress percentage"""
        if self.file_count > 0:
            self.progress_percentage = (self.processed_files / self.file_count) * 100
        else:
            self.progress_percentage = 0.0
        return self.progress_percentage

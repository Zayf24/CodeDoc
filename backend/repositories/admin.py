# Django admin configuration for repository management
from django.contrib import admin
from .models import Repository, RepositoryFile, DocumentationJob

@admin.register(Repository)
class RepositoryAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'user', 'language', 'is_selected', 'stars_count', 'updated_at')
    list_filter = ('language', 'is_selected', 'private')
    search_fields = ('name', 'full_name', 'description')
    readonly_fields = ('github_id', 'created_at')

@admin.register(RepositoryFile)
class RepositoryFileAdmin(admin.ModelAdmin):
    list_display = ('name', 'repository', 'extension', 'is_supported', 'size')
    list_filter = ('extension', 'is_supported')
    search_fields = ('name', 'path')

@admin.register(DocumentationJob)
class DocumentationJobAdmin(admin.ModelAdmin):
    list_display = ('repository', 'user', 'status', 'progress_percentage', 'created_at')
    list_filter = ('status',)
    readonly_fields = ('created_at', 'started_at', 'completed_at')

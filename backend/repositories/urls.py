from django.urls import path
from . import views

urlpatterns = [
    # Repository management
    path('', views.list_repositories, name='list-repositories'),
    path('summary/', views.repository_summary, name='repository-summary'),
    path('sync/', views.sync_repositories, name='sync-repositories'),
    path('sync-files/', views.sync_selected_repositories_files, name='sync-selected-repositories-files'),
    path('select/', views.select_repositories, name='select-repositories'),
    path('selected/', views.selected_repositories, name='selected-repositories'),
    
    # GitHub connection
    path('github-status/', views.github_connection_status, name='github-connection-status'),
    
    # Repository files
    path('<int:repository_id>/files/', views.repository_files, name='repository-files'),
    path('<int:repository_id>/files/sync/', views.sync_repository_files, name='sync-repository-files'),

    # Code analysis - NEW ENDPOINTS
    path('<int:repository_id>/analyze-code/', views.analyze_repository_code, name='analyze-repository-code'),
    path('<int:repository_id>/files/<int:file_id>/analysis/', views.get_python_file_analysis, name='python-file-analysis'),
    path('analysis-summary/', views.get_repository_analysis_summary, name='analysis-summary'),
    
    # Documentation jobs
    path('jobs/', views.documentation_jobs, name='documentation-jobs'),
    path('<int:repository_id>/generate-docs/', views.generate_documentation, name='generate-documentation'),
    path('jobs/<int:job_id>/', views.get_documentation_job, name='get-documentation-job'),
    path('jobs/<int:job_id>/content/', views.get_documentation_content, name='get-documentation-content'),
]


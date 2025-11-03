import apiClient from './api'

export const repositoryService = {
    // Enhanced existing methods
    getUserStats: async () => {
        try {
            const response = await apiClient.get('/api/users/stats/')
            return response.data
        } catch (error) {
            console.error('Failed to fetch user stats:', error)
            throw error
        }
    },

    getRepositorySummary: async () => {
        try {
            const response = await apiClient.get('/api/repositories/summary/')
            return response.data
        } catch (error) {
            console.error('Failed to fetch repository summary:', error)
            // Return safe default
            return {
                summary: {
                    github_connected: false,
                    total_repositories: 0,
                    selected_repositories: 0,
                    ready_for_analysis: 0
                },
                selected_repositories: [],
                next_steps: {
                    needs_github_connection: true,
                    needs_repository_sync: true,
                    needs_repository_selection: true,
                    ready_for_analysis: false
                }
            }
        }
    },

    // ✅ NEW: Get all repositories
    getRepositories: async () => {
        try {
            const response = await apiClient.get('/api/repositories/')
            return response.data
        } catch (error) {
            console.error('Failed to fetch repositories:', error)
            throw error
        }
    },

    // ✅ NEW: Sync repositories from GitHub
    syncRepositories: async () => {
        try {
            const response = await apiClient.post('/api/repositories/sync/')
            return response.data
        } catch (error) {
            console.error('Failed to sync repositories:', error)
            // Handle specific error cases
            if (error.response?.status === 400 && error.response.data?.needs_github_connection) {
                throw new Error('GitHub account not connected. Please connect your GitHub account first.')
            }
            throw error
        }
    },

    // Existing methods
    disconnectGitHub: async () => {
        const response = await apiClient.post('/api/users/disconnect-github/')
        return response.data
    },

    selectRepositories: async (repositoryIds) => {
        const response = await apiClient.post('/api/repositories/select/', {
            repository_ids: repositoryIds
        })
        return response.data
    },

    getSelectedRepositories: async () => {
        const response = await apiClient.get('/api/repositories/selected/')
        return response.data
    },

    syncFiles: async () => {
        try {
            const response = await apiClient.post('/api/repositories/sync-files/')
            return response.data
        } catch (error) {
            console.error('Failed to sync files:', error)
            throw error
        }
    },

    // ✅ NEW: Sync files for a specific repository
    syncRepositoryFiles: async (repositoryId) => {
        try {
            const response = await apiClient.post(`/api/repositories/${repositoryId}/files/sync/`)
            return response.data
        } catch (error) {
            console.error(`Failed to sync files for repository ${repositoryId}:`, error)
            throw error
        }
    },

    // ✅ NEW: Get files for a repository
    getRepositoryFiles: async (repositoryId) => {
        try {
            const response = await apiClient.get(`/api/repositories/${repositoryId}/files/`)
            return response.data
        } catch (error) {
            console.error(`Failed to get files for repository ${repositoryId}:`, error)
            throw error
        }
    },

    // ✅ NEW: Get analysis summary
    getAnalysisSummary: async () => {
        try {
            const response = await apiClient.get('/api/repositories/analysis-summary/')
            return response.data
        } catch (error) {
            console.error('Failed to get analysis summary:', error)
            throw error
        }
    },

    analyzeRepository: async (repositoryId) => {
        const response = await apiClient.post(`/api/repositories/${repositoryId}/analyze-code/`)
        return response.data
    },

    pollJobStatus: async (jobId) => {
        const maxAttempts = 60; // 5 minutes with 5-second intervals
        let attempts = 0;
        
        return new Promise((resolve, reject) => {
          const interval = setInterval(async () => {
            try {
              attempts++;
              const response = await apiClient.get(`/api/repositories/jobs/${jobId}/`);
              const job = response.data;
              
              if (job.status === 'completed' || job.status === 'failed') {
                clearInterval(interval);
                resolve(job);
              } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                reject(new Error('Job polling timeout'));
              }
            } catch (error) {
              clearInterval(interval);
              reject(error);
            }
          }, 5000); // Poll every 5 seconds
        });
      },
      
    generateDocumentation: async (repositoryId) => {
        const response = await apiClient.post(`/api/repositories/${repositoryId}/generate-docs/`);
        const jobData = response.data;
        
        // Start polling for job completion
        const completedJob = await repositoryService.pollJobStatus(jobData.job_id);
        return completedJob;
      },

    // ✅ NEW: Get all documentation jobs
    getDocumentationJobs: async () => {
        try {
            const response = await apiClient.get('/api/repositories/jobs/')
            return response.data
        } catch (error) {
            console.error('Failed to get documentation jobs:', error)
            throw error
        }
    },

    // ✅ NEW: Get specific documentation job
    getDocumentationJob: async (jobId) => {
        try {
            const response = await apiClient.get(`/api/repositories/jobs/${jobId}/`)
            return response.data
        } catch (error) {
            console.error(`Failed to get documentation job ${jobId}:`, error)
            throw error
        }
    },

    // ✅ NEW: Get documentation content for a specific job
    getDocumentationContent: async (jobId) => {
        try {
            const response = await apiClient.get(`/api/repositories/jobs/${jobId}/content/`)
            return response.data
        } catch (error) {
            console.error(`Failed to get documentation content for job ${jobId}:`, error)
            throw error
        }
    },

    getJob: async (jobId) => {
        const response = await apiClient.get(`/api/repositories/jobs/${jobId}/`)
        return response.data
    }
}

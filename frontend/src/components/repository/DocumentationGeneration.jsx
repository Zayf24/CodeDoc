import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    FileText, Play, CheckCircle, AlertCircle, Clock, Download,
    Loader2, RefreshCw, ArrowRight, Sparkles, Code, Book,
    FileCheck, Eye, ExternalLink, Copy, AlertTriangle
} from 'lucide-react'
import { repositoryService } from '@/services/repositoryService'
import { cn } from '@/lib/utils'
import DocumentationViewer from './DocumentationViewer'

const DocumentationGeneration = ({ selectedRepositories }) => {
    const [state, setState] = useState({
        jobs: [],
        generating: false,
        error: null,
        selectedRepoForGeneration: null,
        generationResults: {},
        showJobDetails: {},
        viewingJobId: null
    })

    // Filter repositories that have Python files and are ready for documentation
    const readyRepositories = selectedRepositories?.filter(repo =>
        repo.python_files > 0 && repo.syncStatus === 'completed'
    ) || []

    // Fetch existing documentation jobs on mount
    useEffect(() => {
        fetchDocumentationJobs()
    }, [])

    // Refresh jobs periodically for active jobs
    useEffect(() => {
        const activeJobs = state.jobs.filter(job =>
            job.status === 'pending' || job.status === 'processing'
        )

        if (activeJobs.length > 0) {
            const interval = setInterval(fetchDocumentationJobs, 5000) // Every 5 seconds
            return () => clearInterval(interval)
        }
    }, [state.jobs])

    const fetchDocumentationJobs = async () => {
        try {
            const jobsData = await repositoryService.getDocumentationJobs()
            setState(prev => ({
                ...prev,
                jobs: jobsData.documentation_jobs || []
            }))
        } catch (error) {
            console.error('Failed to fetch documentation jobs:', error)
        }
    }

    // Handle documentation generation for a specific repository
    const handleGenerateDocumentation = async (repositoryId) => {
        setState(prev => ({
            ...prev,
            generating: true,
            selectedRepoForGeneration: repositoryId,
            error: null
        }))

        try {
            const result = await repositoryService.generateDocumentation(repositoryId)

            // Add the new job to the jobs list
            setState(prev => ({
                ...prev,
                generating: false,
                selectedRepoForGeneration: null,
                generationResults: {
                    ...prev.generationResults,
                    [repositoryId]: result
                }
            }))

            // Refresh jobs to get the latest status
            await fetchDocumentationJobs()
        } catch (error) {
            console.error('Documentation generation failed:', error)
            setState(prev => ({
                ...prev,
                generating: false,
                selectedRepoForGeneration: null,
                error: error.message || 'Failed to generate documentation'
            }))
        }
    }

    // Handle bulk documentation generation
    const handleGenerateAllDocumentation = async () => {
        setState(prev => ({ ...prev, generating: true, error: null }))

        try {
            const results = {}

            for (const repo of readyRepositories) {
                try {
                    const result = await repositoryService.generateDocumentation(repo.id)
                    results[repo.id] = result
                } catch (error) {
                    console.error(`Failed to generate docs for ${repo.name}:`, error)
                }
            }

            setState(prev => ({
                ...prev,
                generating: false,
                generationResults: { ...prev.generationResults, ...results }
            }))

            // Refresh jobs
            await fetchDocumentationJobs()
        } catch (error) {
            setState(prev => ({
                ...prev,
                generating: false,
                error: error.message || 'Failed to generate documentation for some repositories'
            }))
        }
    }

    // Toggle job details view
    const toggleJobDetails = (jobId) => {
        setState(prev => ({
            ...prev,
            showJobDetails: {
                ...prev.showJobDetails,
                [jobId]: !prev.showJobDetails[jobId]
            }
        }))
    }

    const handleViewDocumentation = (jobId) => {
        setState(prev => ({ ...prev, viewingJobId: jobId }))
    }

    const handleCloseViewer = () => {
        setState(prev => ({ ...prev, viewingJobId: null }))
    }

    // Get job statistics
    const jobStats = {
        total: state.jobs.length,
        pending: state.jobs.filter(job => job.status === 'pending').length,
        processing: state.jobs.filter(job => job.status === 'processing').length,
        completed: state.jobs.filter(job => job.status === 'completed').length,
        failed: state.jobs.filter(job => job.status === 'failed').length
    }

    if (!selectedRepositories || selectedRepositories.length === 0) {
        return (
            <motion.div
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="text-muted-foreground">
                    <Book className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg mb-2">No repositories selected</p>
                    <p className="text-sm">Please select and sync repositories to generate documentation</p>
                </div>
            </motion.div>
        )
    }

    if (readyRepositories.length === 0) {
        return (
            <motion.div
                className="bg-card border border-border rounded-lg p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                        <AlertTriangle className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">No Python Files Ready</h3>
                        <p className="text-sm text-muted-foreground">
                            No repositories with Python files are ready for documentation generation
                        </p>
                    </div>
                </div>

                <div className="text-center py-8 text-muted-foreground">
                    <Code className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Please select repositories with Python files and sync them first</p>
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div
            className="bg-card border border-border rounded-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                        <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">AI Documentation Generation</h3>
                        <p className="text-sm text-muted-foreground">
                            {readyRepositories.length} repositories ready for documentation
                            {jobStats.total > 0 && (
                                <span className="ml-2">
                                    • {jobStats.completed} completed, {jobStats.processing} processing
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <motion.button
                        onClick={handleGenerateAllDocumentation}
                        disabled={state.generating || readyRepositories.length === 0}
                        className={cn(
                            "inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all duration-300",
                            (state.generating || readyRepositories.length === 0) && "opacity-50 cursor-not-allowed"
                        )}
                        whileHover={state.generating ? {} : { scale: 1.02, boxShadow: "0 0 20px rgba(74, 144, 226, 0.3)" }}
                        whileTap={state.generating ? {} : { scale: 0.98 }}
                    >
                        {state.generating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Generate All Documentation
                            </>
                        )}
                    </motion.button>
                </div>
            </div>

            {/* Error message */}
            {state.error && (
                <motion.div
                    className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive text-sm flex items-start gap-3"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium">Documentation Generation Error</p>
                        <p>{state.error}</p>
                    </div>
                </motion.div>
            )}

            {/* Job Statistics */}
            {jobStats.total > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-muted/20 border border-border rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-foreground">{jobStats.total}</div>
                        <div className="text-xs text-muted-foreground">Total Jobs</div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-500">{jobStats.processing}</div>
                        <div className="text-xs text-muted-foreground">Processing</div>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-500">{jobStats.completed}</div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-red-500">{jobStats.failed}</div>
                        <div className="text-xs text-muted-foreground">Failed</div>
                    </div>
                </div>
            )}

            {/* Repository List */}
            <div className="space-y-4">
                <h4 className="font-medium text-foreground mb-3">Ready for Documentation</h4>
                {readyRepositories.map((repo, index) => (
                    <motion.div
                        key={repo.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                        <RepositoryDocumentationCard
                            repository={repo}
                            onGenerate={() => handleGenerateDocumentation(repo.id)}
                            isGenerating={state.generating && state.selectedRepoForGeneration === repo.id}
                            disabled={state.generating}
                            jobs={state.jobs.filter(job => job.repository.id === repo.id)}
                            onToggleJobDetails={toggleJobDetails}
                            showJobDetails={state.showJobDetails}
                            onViewDocumentation={handleViewDocumentation}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Completed Jobs Summary */}
            {jobStats.completed > 0 && (
                <motion.div
                    className="mt-6 p-6 bg-gradient-to-r from-green-500/5 to-blue-500/5 border border-green-500/20 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-foreground">Documentation Generated</h4>
                                <p className="text-sm text-muted-foreground">
                                    {jobStats.completed} documentation jobs completed successfully
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <motion.div
                                className="flex items-center gap-2 text-green-500"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <CheckCircle className="w-5 h-5" />
                                <span className="text-sm font-medium">Ready to view and download</span>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Documentation Viewer Modal */}
            {state.viewingJobId && (
                <DocumentationViewer
                    jobId={state.viewingJobId}
                    onClose={handleCloseViewer}
                />
            )}
        </motion.div>
    )
}

// Individual repository documentation card
const RepositoryDocumentationCard = ({
    repository,
    onGenerate,
    isGenerating,
    disabled,
    jobs,
    onToggleJobDetails,
    showJobDetails,
    onViewDocumentation
}) => {
    const latestJob = jobs[0] // Most recent job
    const hasCompletedJob = jobs.some(job => job.status === 'completed')

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-green-500" />
            case 'processing':
                return <Loader2 className="w-5 h-5 text-primary animate-spin" />
            case 'failed':
                return <AlertCircle className="w-5 h-5 text-destructive" />
            case 'pending':
                return <Clock className="w-5 h-5 text-orange-500" />
            default:
                return <FileText className="w-5 h-5 text-muted-foreground" />
        }
    }

    return (
        <div className={cn(
            "p-4 border rounded-lg transition-all duration-300",
            latestJob?.status === 'completed' ? "bg-green-500/5 border-green-500/20" :
                latestJob?.status === 'processing' ? "bg-primary/5 border-primary/20" :
                    latestJob?.status === 'failed' ? "bg-destructive/5 border-destructive/20" :
                        "bg-muted/20 border-border"
        )}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                    {latestJob && (
                        <div className="flex items-center gap-2">
                            {getStatusIcon(latestJob.status)}
                            <span className={cn(
                                "text-sm font-medium",
                                latestJob.status === 'completed' ? "text-green-500" :
                                    latestJob.status === 'processing' ? "text-primary" :
                                        latestJob.status === 'failed' ? "text-destructive" :
                                            latestJob.status === 'pending' ? "text-orange-500" :
                                                "text-muted-foreground"
                            )}>
                                {latestJob.status.charAt(0).toUpperCase() + latestJob.status.slice(1)}
                                {latestJob.status === 'processing' && (
                                    <span className="ml-1">({latestJob.progress_percentage || 0}%)</span>
                                )}
                            </span>
                        </div>
                    )}

                    <div className="min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                            {repository.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            {repository.python_files} Python files ready for documentation
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!latestJob && (
                        <motion.button
                            onClick={onGenerate}
                            disabled={disabled}
                            className={cn(
                                "inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg transition-colors",
                                disabled && "opacity-50 cursor-not-allowed"
                            )}
                            whileHover={disabled ? {} : { scale: 1.02 }}
                            whileTap={disabled ? {} : { scale: 0.98 }}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Generate Docs
                                </>
                            )}
                        </motion.button>
                    )}

                    {hasCompletedJob && (
                        <motion.button
                            onClick={() => onViewDocumentation(latestJob.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 rounded-lg transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Eye className="w-4 h-4" />
                            View Docs
                        </motion.button>
                    )}

                    {latestJob && (
                        <motion.button
                            onClick={() => onToggleJobDetails(latestJob.id)}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border hover:border-primary/30 rounded-lg transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <FileCheck className="w-4 h-4" />
                            Details
                        </motion.button>
                    )}
                </div>
            </div>

            {/* Job Details */}
            <AnimatePresence>
                {latestJob && showJobDetails[latestJob.id] && (
                    <motion.div
                        className="mt-4 p-4 bg-muted/20 border border-border rounded-lg"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-foreground">Status:</span>
                                    <span className="ml-2 text-muted-foreground capitalize">{latestJob.status}</span>
                                </div>
                                <div>
                                    <span className="font-medium text-foreground">Progress:</span>
                                    <span className="ml-2 text-muted-foreground">{latestJob.progress_percentage || 0}%</span>
                                </div>
                                <div>
                                    <span className="font-medium text-foreground">Files:</span>
                                    <span className="ml-2 text-muted-foreground">
                                        {latestJob.processed_files || 0} / {latestJob.file_count || 0}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-foreground">Created:</span>
                                    <span className="ml-2 text-muted-foreground">
                                        {new Date(latestJob.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {latestJob.error_message && (
                                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                                    <span className="font-medium">Error:</span> {latestJob.error_message}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default DocumentationGeneration

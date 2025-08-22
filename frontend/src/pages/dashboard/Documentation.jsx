import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import {
    FileText, Download, Play, CheckCircle, AlertCircle,
    Clock, Sparkles, ArrowLeft, Eye, ExternalLink,
    Loader2, Book, Code, BarChart3
} from 'lucide-react'
import { repositoryService } from '@/services/repositoryService'
import { cn } from '@/lib/utils'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import DocumentationViewer from '@/components/repository/DocumentationViewer'

const Documentation = () => {
    const [searchParams] = useSearchParams()
    const [state, setState] = useState({
        jobs: [],
        repositories: [],
        loading: true,
        error: null,
        generating: false,
        viewingJobId: null
    })

    // Fetch data on mount
    useEffect(() => {
        Promise.all([
            fetchDocumentationJobs(),
            fetchReadyRepositories()
        ]).finally(() => {
            setState(prev => ({ ...prev, loading: false }))
        })
    }, [])

    // Handle job parameter from URL
    useEffect(() => {
        const jobId = searchParams.get('job')
        if (jobId && !state.viewingJobId) {
            setState(prev => ({ ...prev, viewingJobId: jobId }))
        }
    }, [searchParams, state.viewingJobId])

    // Auto-refresh jobs every 5 seconds for active jobs
    useEffect(() => {
        const activeJobs = state.jobs.filter(job =>
            job.status === 'pending' || job.status === 'processing'
        )

        if (activeJobs.length > 0) {
            const interval = setInterval(fetchDocumentationJobs, 5000)
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
            setState(prev => ({
                ...prev,
                error: 'Failed to load documentation jobs'
            }))
        }
    }

    const fetchReadyRepositories = async () => {
        try {
            const reposData = await repositoryService.getRepositories()
            const readyRepos = reposData.repositories.filter(repo =>
                repo.is_selected &&
                repo.python_files > 0 &&
                repo.files_synced
            )
            setState(prev => ({
                ...prev,
                repositories: readyRepos
            }))
        } catch (error) {
            console.error('Failed to fetch repositories:', error)
        }
    }

    const handleGenerateDocumentation = async (repositoryId) => {
        setState(prev => ({ ...prev, generating: true, error: null }))

        try {
            await repositoryService.generateDocumentation(repositoryId)
            await fetchDocumentationJobs() // Refresh jobs
            setState(prev => ({ ...prev, generating: false }))
        } catch (error) {
            console.error('Documentation generation failed:', error)
            setState(prev => ({
                ...prev,
                generating: false,
                error: error.message || 'Failed to generate documentation'
            }))
        }
    }

    const handleGenerateAll = async () => {
        setState(prev => ({ ...prev, generating: true, error: null }))

        try {
            for (const repo of state.repositories) {
                try {
                    await repositoryService.generateDocumentation(repo.id)
                } catch (error) {
                    console.error(`Failed to generate docs for ${repo.name}:`, error)
                }
            }
            await fetchDocumentationJobs()
            setState(prev => ({ ...prev, generating: false }))
        } catch (error) {
            setState(prev => ({
                ...prev,
                generating: false,
                error: 'Failed to generate documentation for some repositories'
            }))
        }
    }

    const handleViewDocumentation = (jobId) => {
        setState(prev => ({ ...prev, viewingJobId: jobId }))
    }

    const handleCloseViewer = () => {
        setState(prev => ({ ...prev, viewingJobId: null }))
        // Clear the job parameter from URL
        const newSearchParams = new URLSearchParams(searchParams)
        newSearchParams.delete('job')
        window.history.replaceState({}, '', `${window.location.pathname}${newSearchParams.toString() ? '?' + newSearchParams.toString() : ''}`)
    }

    // Calculate job statistics
    const jobStats = {
        total: state.jobs.length,
        pending: state.jobs.filter(job => job.status === 'pending').length,
        processing: state.jobs.filter(job => job.status === 'processing').length,
        completed: state.jobs.filter(job => job.status === 'completed').length,
        failed: state.jobs.filter(job => job.status === 'failed').length
    }

    if (state.loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading documentation...</span>
            </div>
        )
    }

    return (
        <ErrorBoundary>
            <div className="space-y-8">
                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <Link
                            to="/dashboard/repositories"
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground font-mono uppercase tracking-wider">
                                AI Documentation
                            </h1>
                            <p className="mt-2 text-lg text-muted-foreground">
                                Generate and manage AI-powered documentation for your repositories
                            </p>
                        </div>
                    </div>

                    {state.repositories.length > 0 && (
                        <motion.button
                            onClick={handleGenerateAll}
                            disabled={state.generating}
                            className={cn(
                                "inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all duration-300",
                                state.generating && "opacity-50 cursor-not-allowed"
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
                    )}
                </motion.div>

                {/* Error Message */}
                {state.error && (
                    <motion.div
                        className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive text-sm flex items-start gap-3"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium">Error</p>
                            <p>{state.error}</p>
                        </div>
                    </motion.div>
                )}

                {/* Statistics Dashboard */}
                {jobStats.total > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                        <div className="bg-card border border-border rounded-lg p-4 text-center">
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
                    </motion.div>
                )}

                {/* Ready Repositories */}
                {state.repositories.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-border rounded-lg p-6"
                    >
                        <h3 className="text-lg font-semibold text-foreground mb-4">
                            Repositories Ready for Documentation
                        </h3>
                        <div className="grid gap-4">
                            {state.repositories.map((repo, index) => (
                                <motion.div
                                    key={repo.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/30 transition-colors"
                                >
                                    <div>
                                        <h4 className="font-medium text-foreground">{repo.name}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {repo.python_files} Python files • {repo.total_files} total files
                                        </p>
                                    </div>
                                    <motion.button
                                        onClick={() => handleGenerateDocumentation(repo.id)}
                                        disabled={state.generating}
                                        className={cn(
                                            "inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg transition-colors",
                                            state.generating && "opacity-50 cursor-not-allowed"
                                        )}
                                        whileHover={state.generating ? {} : { scale: 1.02 }}
                                        whileTap={state.generating ? {} : { scale: 0.98 }}
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Generate Docs
                                    </motion.button>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Documentation Jobs */}
                {state.jobs.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-border rounded-lg p-6"
                    >
                        <h3 className="text-lg font-semibold text-foreground mb-4">
                            Documentation Jobs
                        </h3>
                        <div className="space-y-4">
                            {state.jobs.map((job) => (
                                <DocumentationJobCard
                                    key={job.id}
                                    job={job}
                                    onView={() => handleViewDocumentation(job.id)}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Empty State */}
                {state.repositories.length === 0 && state.jobs.length === 0 && (
                    <motion.div
                        className="text-center py-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <Book className="w-16 h-16 mx-auto mb-4 opacity-20 text-muted-foreground" />
                        <p className="text-lg mb-2 text-foreground">No documentation available</p>
                        <p className="text-sm text-muted-foreground mb-6">
                            Select repositories with Python files and sync them to generate documentation
                        </p>
                        <Link
                            to="/dashboard/repositories"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Repositories
                        </Link>
                    </motion.div>
                )}

                {/* Documentation Viewer Modal */}
                {state.viewingJobId && (
                    <DocumentationViewer
                        jobId={state.viewingJobId}
                        onClose={handleCloseViewer}
                    />
                )}
            </div>
        </ErrorBoundary>
    )
}

// Documentation Job Card Component
const DocumentationJobCard = ({ job, onView }) => {
    const getStatusIcon = () => {
        switch (job.status) {
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

    const getStatusColor = () => {
        switch (job.status) {
            case 'completed': return 'text-green-500'
            case 'processing': return 'text-primary'
            case 'failed': return 'text-destructive'
            case 'pending': return 'text-orange-500'
            default: return 'text-muted-foreground'
        }
    }

    return (
        <div className={cn(
            "p-4 border rounded-lg transition-colors",
            job.status === 'completed' ? "bg-green-500/5 border-green-500/20" :
                job.status === 'processing' ? "bg-primary/5 border-primary/20" :
                    job.status === 'failed' ? "bg-destructive/5 border-destructive/20" :
                        "bg-muted/20 border-border"
        )}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {getStatusIcon()}
                    <div>
                        <h4 className="font-medium text-foreground">{job.repository.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className={cn("font-medium", getStatusColor())}>
                                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                            </span>
                            {job.status === 'processing' && (
                                <span>{job.progress_percentage || 0}% complete</span>
                            )}
                            <span>{job.processed_files || 0} / {job.file_count || 0} files</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {job.status === 'completed' && (
                        <>
                            <motion.button
                                onClick={onView}
                                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 rounded-lg transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Eye className="w-4 h-4" />
                                View
                            </motion.button>
                            <motion.button
                                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </motion.button>
                        </>
                    )}
                </div>
            </div>

            {job.error_message && (
                <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                    <span className="font-medium">Error:</span> {job.error_message}
                </div>
            )}
        </div>
    )
}

export default Documentation

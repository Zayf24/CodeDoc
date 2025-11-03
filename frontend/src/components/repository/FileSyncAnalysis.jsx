import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
    FileText, Download, Play, CheckCircle, AlertCircle,
    Clock, Code, Loader2, RefreshCw, ArrowRight, FileCheck,
    BarChart3, Zap, AlertTriangle
} from 'lucide-react'
import { repositoryService } from '@/services/repositoryService'
import { cn } from '@/lib/utils'

const FileSyncAnalysis = ({ selectedRepositories, onSyncComplete }) => {
    const [state, setState] = useState({
        repositories: [],
        syncing: false,
        analyzing: false,
        error: null,
        syncResults: {},
        analysisResults: {},
        overallProgress: 0
    })

    // Initialize repositories with sync status
    useEffect(() => {
        if (selectedRepositories && selectedRepositories.length > 0) {
            const reposWithStatus = selectedRepositories.map(repo => ({
                ...repo,
                syncStatus: repo.files_synced ? 'completed' : 'pending',
                analysisStatus: repo.analysis_status || 'pending',
                fileCount: repo.total_files || 0,
                pythonFiles: repo.python_files || 0
            }))

            setState(prev => ({
                ...prev,
                repositories: reposWithStatus
            }))
        }
    }, [selectedRepositories])

    // Handle bulk file sync for all selected repositories
    const handleBulkSync = async () => {
        setState(prev => ({ ...prev, syncing: true, error: null }))

        try {
            const result = await repositoryService.syncFiles()

            // Update repositories with correct sync status
            const updatedRepos = selectedRepositories.map(repo => ({
                ...repo,
                files_synced: true,
                syncStatus: 'completed',
                fileCount: result.results?.find(r => r.repository === repo.full_name)?.total_files || repo.total_files || 0,
                pythonFiles: result.results?.find(r => r.repository === repo.full_name)?.python_files || repo.python_files || 0
            }))

            setState(prev => ({
                ...prev,
                syncing: false,
                syncResults: result,
                repositories: updatedRepos
            }))

            // Notify parent component of sync completion
            if (onSyncComplete) {
                onSyncComplete(updatedRepos)
            }
        } catch (error) {
            console.error('Bulk sync failed:', error)
            setState(prev => ({
                ...prev,
                syncing: false,
                error: error.message || 'Failed to sync repository files'
            }))
        }
    }

    // Handle individual repository sync
    const handleIndividualSync = async (repositoryId) => {
        setState(prev => ({
            ...prev,
            repositories: prev.repositories.map(repo =>
                repo.id === repositoryId
                    ? { ...repo, syncStatus: 'syncing' }
                    : repo
            ),
            error: null
        }))

        try {
            const result = await repositoryService.syncRepositoryFiles(repositoryId)

            setState(prev => ({
                ...prev,
                repositories: prev.repositories.map(repo =>
                    repo.id === repositoryId
                        ? {
                            ...repo,
                            syncStatus: 'completed',
                            fileCount: result.file_count || 0,
                            pythonFiles: result.supported_files || 0
                        }
                        : repo
                )
            }))
        } catch (error) {
            console.error('Individual sync failed:', error)
            setState(prev => ({
                ...prev,
                repositories: prev.repositories.map(repo =>
                    repo.id === repositoryId
                        ? { ...repo, syncStatus: 'failed' }
                        : repo
                ),
                error: `Failed to sync ${selectedRepositories.find(r => r.id === repositoryId)?.name}: ${error.message}`
            }))
        }
    }

    // Get analysis summary
    const fetchAnalysisSummary = async () => {
        try {
            const summary = await repositoryService.getAnalysisSummary()
            setState(prev => ({ ...prev, analysisResults: summary }))
        } catch (error) {
            console.error('Failed to fetch analysis summary:', error)
        }
    }

    useEffect(() => {
        if (state.repositories.some(repo => repo.syncStatus === 'completed')) {
            fetchAnalysisSummary()
        }
    }, [state.repositories])

    // Calculate sync statistics
    const syncStats = {
        total: state.repositories.length,
        completed: state.repositories.filter(repo => repo.syncStatus === 'completed').length,
        pending: state.repositories.filter(repo => repo.syncStatus === 'pending').length,
        syncing: state.repositories.filter(repo => repo.syncStatus === 'syncing').length,
        failed: state.repositories.filter(repo => repo.syncStatus === 'failed').length,
        totalFiles: state.repositories.reduce((sum, repo) => sum + repo.fileCount, 0),
        totalPythonFiles: state.repositories.reduce((sum, repo) => sum + repo.pythonFiles, 0)
    }

    const allSynced = syncStats.completed === syncStats.total && syncStats.total > 0
    // Correct the readiness calculation
    const readyForAnalysis = selectedRepositories.filter(repo =>
        repo.python_files > 0 && (repo.files_synced === true || repo.syncStatus === 'completed')
    ).length > 0

    if (!selectedRepositories || selectedRepositories.length === 0) {
        return (
            <motion.div
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="text-muted-foreground">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg mb-2">No repositories selected</p>
                    <p className="text-sm">Please select repositories to sync files and prepare for analysis</p>
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
                        <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">File Sync & Analysis</h3>
                        <p className="text-sm text-muted-foreground">
                            {syncStats.completed} of {syncStats.total} repositories synced
                            {readyForAnalysis && (
                                <span className="ml-2 text-green-500">
                                    • {syncStats.totalPythonFiles} Python files ready
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <motion.button
                        onClick={handleBulkSync}
                        disabled={state.syncing || allSynced}
                        className={cn(
                            "inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all duration-300",
                            (state.syncing || allSynced) && "opacity-50 cursor-not-allowed"
                        )}
                        whileHover={state.syncing || allSynced ? {} : { scale: 1.02, boxShadow: "0 0 20px rgba(74, 144, 226, 0.3)" }}
                        whileTap={state.syncing || allSynced ? {} : { scale: 0.98 }}
                    >
                        {state.syncing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Syncing Files...
                            </>
                        ) : allSynced ? (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                All Synced
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5" />
                                Sync All Files
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
                        <p className="font-medium">Sync Error</p>
                        <p>{state.error}</p>
                    </div>
                </motion.div>
            )}

            {/* Sync Statistics */}
            {syncStats.total > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-muted/20 border border-border rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-foreground">{syncStats.total}</div>
                        <div className="text-xs text-muted-foreground">Total Repos</div>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-500">{syncStats.completed}</div>
                        <div className="text-xs text-muted-foreground">Synced</div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-500">{syncStats.totalFiles}</div>
                        <div className="text-xs text-muted-foreground">Total Files</div>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-orange-500">{syncStats.totalPythonFiles}</div>
                        <div className="text-xs text-muted-foreground">Python Files</div>
                    </div>
                </div>
            )}

            {/* Repository List */}
            <div className="space-y-4">
                {state.repositories.map((repo, index) => (
                    <motion.div
                        key={repo.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                        <RepositoryFileSyncCard
                            repository={repo}
                            onSync={() => handleIndividualSync(repo.id)}
                            disabled={state.syncing}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Analysis Readiness Status */}
            {allSynced && (
                <motion.div
                    className="mt-6 p-6 bg-gradient-to-r from-primary/5 to-green-500/5 border border-primary/20 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                {readyForAnalysis ? (
                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                ) : (
                                    <AlertTriangle className="w-6 h-6 text-orange-500" />
                                )}
                            </div>
                            <div>
                                <h4 className="font-semibold text-foreground">
                                    {readyForAnalysis ? 'Ready for Documentation' : 'No Python Files Ready'}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    {readyForAnalysis
                                        ? `${syncStats.totalPythonFiles} Python files ready for documentation generation`
                                        : 'No Python files were found in the synced repositories'
                                    }
                                </p>
                            </div>
                        </div>

                        {readyForAnalysis && (
                            <Link
                                to="/dashboard/documentation"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                            >
                                <ArrowRight className="w-5 h-5" />
                                <span className="text-sm font-medium">Ready for next step</span>
                            </Link>
                        )}
                    </div>
                </motion.div>
            )}
        </motion.div>
    )
}

// Individual repository file sync card
const RepositoryFileSyncCard = ({ repository, onSync, disabled }) => {
    const getStatusIcon = () => {
        switch (repository.syncStatus) {
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-green-500" />
            case 'syncing':
                return <Loader2 className="w-5 h-5 text-primary animate-spin" />
            case 'failed':
                return <AlertCircle className="w-5 h-5 text-destructive" />
            default:
                return <Clock className="w-5 h-5 text-muted-foreground" />
        }
    }

    const getStatusText = () => {
        switch (repository.syncStatus) {
            case 'completed':
                return 'Synced'
            case 'syncing':
                return 'Syncing...'
            case 'failed':
                return 'Failed'
            default:
                return 'Pending'
        }
    }

    const getStatusColor = () => {
        switch (repository.syncStatus) {
            case 'completed':
                return 'text-green-500'
            case 'syncing':
                return 'text-primary'
            case 'failed':
                return 'text-destructive'
            default:
                return 'text-muted-foreground'
        }
    }

    return (
        <div className={cn(
            "p-4 border rounded-lg transition-all duration-300",
            repository.syncStatus === 'completed' ? "bg-green-500/5 border-green-500/20" :
                repository.syncStatus === 'syncing' ? "bg-primary/5 border-primary/20" :
                    repository.syncStatus === 'failed' ? "bg-destructive/5 border-destructive/20" :
                        "bg-muted/20 border-border"
        )}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        {getStatusIcon()}
                        <span className={cn("text-sm font-medium", getStatusColor())}>
                            {getStatusText()}
                        </span>
                    </div>

                    <div className="min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                            {repository.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            {repository.language && (
                                <span className="mr-3">{repository.language}</span>
                            )}
                            {repository.fileCount > 0 && (
                                <span className="mr-3">{repository.fileCount} files</span>
                            )}
                            {repository.pythonFiles > 0 && (
                                <span className="text-green-500">{repository.pythonFiles} Python files</span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {repository.syncStatus === 'pending' && (
                        <motion.button
                            onClick={onSync}
                            disabled={disabled}
                            className={cn(
                                "inline-flex items-center gap-2 px-3 py-2 text-sm bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg transition-colors",
                                disabled && "opacity-50 cursor-not-allowed"
                            )}
                            whileHover={disabled ? {} : { scale: 1.02 }}
                            whileTap={disabled ? {} : { scale: 0.98 }}
                        >
                            <Download className="w-4 h-4" />
                            Sync Files
                        </motion.button>
                    )}

                    {repository.syncStatus === 'failed' && (
                        <motion.button
                            onClick={onSync}
                            disabled={disabled}
                            className={cn(
                                "inline-flex items-center gap-2 px-3 py-2 text-sm bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 rounded-lg transition-colors",
                                disabled && "opacity-50 cursor-not-allowed"
                            )}
                            whileHover={disabled ? {} : { scale: 1.02 }}
                            whileTap={disabled ? {} : { scale: 0.98 }}
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </motion.button>
                    )}

                    {repository.syncStatus === 'completed' && repository.pythonFiles > 0 && (
                        <div className="flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded">
                            <FileCheck className="w-3 h-3" />
                            Ready
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default FileSyncAnalysis

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams, Link } from 'react-router-dom'
import { GitBranch, Search, Filter, Github, CheckSquare, ArrowRight, FileText, Sparkles, CheckCircle } from 'lucide-react'
import GitHubConnectionStatus from '@/components/repository/GitHubConnectionStatus'
import RepositorySync from '@/components/repository/RepositorySync'
import RepositorySelection from '@/components/repository/RepositorySelection'
import FileSyncAnalysis from '@/components/repository/FileSyncAnalysis'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { cn } from '@/lib/utils'

const Repositories = () => {
  const [searchParams] = useSearchParams()
  const [githubConnected, setGitHubConnected] = useState(false)
  const [repositories, setRepositories] = useState([])
  const [selectedRepositories, setSelectedRepositories] = useState([])
  const [loading, setLoading] = useState(true)

  const handleGitHubStatusChange = (connected) => {
    setGitHubConnected(connected)
    setLoading(false)
  }

  const handleRepositoriesChange = (repos) => {
    setRepositories(repos)
  }

  const handleSelectionChange = (selectedIds) => {
    const selected = repositories.filter(repo => selectedIds.includes(repo.id))
    setSelectedRepositories(selected)
  }

  // ✅ FIX: Correct the readiness calculation
  const readyForDocumentation = selectedRepositories.filter(repo =>
    repo.python_files > 0 &&
    (repo.files_synced === true || repo.syncStatus === 'completed') // ✅ Check both flags
  )

  // ✅ NEW: Calculate file sync status more accurately
  const allFilesSynced = selectedRepositories.every(repo =>
    repo.files_synced === true || repo.syncStatus === 'completed'
  )

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-mono uppercase tracking-wider">
                Repository Management
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">
                Connect GitHub, sync repositories, and generate AI-powered documentation
              </p>
            </div>

            {githubConnected && repositories.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {selectedRepositories.length} selected
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {repositories.length} total repositories
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Step 1: GitHub Connection Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <GitHubConnectionStatus onStatusChange={handleGitHubStatusChange} />
        </motion.div>

        {/* Step 2: Repository Sync */}
        {githubConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <RepositorySync onRepositoriesChange={handleRepositoriesChange} />
          </motion.div>
        )}

        {/* Step 3: Repository Selection */}
        {githubConnected && repositories.length > 0 && (
          <motion.div
            id="repository-selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <RepositorySelection
              repositories={repositories}
              onSelectionChange={handleSelectionChange}
            />
          </motion.div>
        )}

        {/* ✅ FIXED: File Sync & Analysis with corrected messaging */}
        {selectedRepositories.length > 0 && (
          <motion.div
            id="file-sync-analysis"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <FileSyncAnalysis
              selectedRepositories={selectedRepositories}
              onSyncComplete={(repos) => {
                // Update repositories with sync status
                setRepositories(prevRepos =>
                  prevRepos.map(repo => {
                    const syncedRepo = repos.find(r => r.id === repo.id)
                    return syncedRepo ? { ...repo, ...syncedRepo, files_synced: true, syncStatus: 'completed' } : repo
                  })
                )
              }}
            />
          </motion.div>
        )}



        {/* Empty state when not connected */}
        {!loading && !githubConnected && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="text-muted-foreground">
              <Github className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg mb-2">Connect your GitHub account to get started</p>
              <p className="text-sm">
                Once connected, you'll be able to sync repositories and generate documentation
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default Repositories

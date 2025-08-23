import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  GitBranch, RefreshCw, Download, AlertCircle, CheckCircle, 
  Star, GitFork, Lock, Globe, Calendar, Loader2
} from 'lucide-react'
import { repositoryService } from '@/services/repositoryService'
import { cn } from '@/lib/utils'

const RepositorySync = ({ onRepositoriesChange }) => {
  const [state, setState] = useState({
    repositories: [],
    loading: true,
    syncing: false,
    error: null,
    lastSyncAt: null
  })

  const fetchRepositories = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const data = await repositoryService.getRepositories()
      
      setState(prev => ({
        ...prev,
        repositories: data.repositories || [],
        loading: false,
        error: null
      }))

      // Notify parent component
      if (onRepositoriesChange) {
        onRepositoriesChange(data.repositories || [])
      }
    } catch (error) {
      console.error('Failed to fetch repositories:', error)
      setState(prev => ({
        ...prev,
        repositories: [],
        loading: false,
        error: error.message || 'Failed to load repositories'
      }))
    }
  }

  const handleSync = async () => {
    try {
      setState(prev => ({ ...prev, syncing: true, error: null }))
      
      const result = await repositoryService.syncRepositories()
      
      // Refresh the repository list
      await fetchRepositories()
      
      setState(prev => ({
        ...prev,
        syncing: false,
        lastSyncAt: new Date(),
        error: null
      }))
    } catch (error) {
      console.error('Sync failed:', error)
      setState(prev => ({
        ...prev,
        syncing: false,
        error: error.message || 'Failed to sync repositories'
      }))
    }
  }

  useEffect(() => {
    fetchRepositories()
  }, [])

  if (state.loading) {
    return (
      <motion.div 
        className="bg-card border border-border rounded-lg p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading repositories...</p>
          </div>
        </div>
      </motion.div>
    )
  }

  if (state.error && state.repositories.length === 0) {
    return (
      <motion.div 
        className="bg-card border border-destructive/20 rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Failed to Load Repositories</h3>
            <p className="text-sm text-destructive mt-1">{state.error}</p>
          </div>
          <motion.button
            onClick={fetchRepositories}
            className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Retry
          </motion.button>
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
            <GitBranch className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Repository Sync</h3>
            <p className="text-sm text-muted-foreground">
              {state.repositories.length} repositories synced
              {state.lastSyncAt && (
                <span className="ml-2">
                  • Last synced {formatRelativeTime(state.lastSyncAt)}
                </span>
              )}
            </p>
          </div>
        </div>

        <motion.button
          onClick={handleSync}
          disabled={state.syncing}
          className={cn(
            "inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all duration-300",
            state.syncing && "opacity-50 cursor-not-allowed"
          )}
          whileHover={state.syncing ? {} : { scale: 1.02, boxShadow: "0 0 20px rgba(74, 144, 226, 0.3)" }}
          whileTap={state.syncing ? {} : { scale: 0.98 }}
        >
          {state.syncing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              Sync Repositories
            </>
          )}
        </motion.button>
      </div>

      {/* Error message during sync */}
      {state.error && state.repositories.length > 0 && (
        <motion.div 
          className="mb-4 bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {state.error}
        </motion.div>
      )}

      {/* Repository List */}
      {state.repositories.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            <GitBranch className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg mb-2">No repositories found</p>
            <p className="text-sm">
              Click "Sync Repositories" to fetch your GitHub repositories
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {state.repositories.slice(0, 6).map((repo, index) => (
              <motion.div
                key={repo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <RepositoryCard repo={repo} />
              </motion.div>
            ))}
          </div>

          {state.repositories.length > 6 && (
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Showing 6 of {state.repositories.length} repositories
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

// Repository card component
const RepositoryCard = ({ repo }) => {
  return (
    <motion.div
      className="p-4 bg-muted/20 border border-border rounded-lg hover:border-primary/30 transition-all duration-300 group"
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-foreground truncate">
              {repo.name}
            </h4>
            {repo.private ? (
              <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            ) : (
              <Globe className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          {repo.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {repo.description}
            </p>
          )}
        </div>
        
        {repo.is_selected && (
          <div className="flex-shrink-0 ml-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
        )}
      </div>

      {/* Repository stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {repo.language && (
          <div className="flex items-center gap-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              getLanguageColor(repo.language)
            )} />
            <span>{repo.language}</span>
          </div>
        )}
        
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3" />
          <span>{repo.stars_count || 0}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <GitFork className="w-3 h-3" />
          <span>{repo.forks_count || 0}</span>
        </div>
      </div>

      {/* Updated date */}
      <div className="mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>Updated {formatRelativeTime(new Date(repo.updated_at))}</span>
        </div>
      </div>
    </motion.div>
  )
}

// Helper functions
const formatRelativeTime = (date) => {
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

const getLanguageColor = (language) => {
  const colors = {
    JavaScript: 'bg-yellow-400',
    TypeScript: 'bg-blue-400',
    Python: 'bg-green-400',
    Java: 'bg-orange-400',
    'C#': 'bg-purple-400',
    Go: 'bg-cyan-400',
    Rust: 'bg-orange-600',
    PHP: 'bg-indigo-400',
    Ruby: 'bg-red-400',
    Swift: 'bg-orange-500',
  }
  return colors[language] || 'bg-gray-400'
}

export default RepositorySync

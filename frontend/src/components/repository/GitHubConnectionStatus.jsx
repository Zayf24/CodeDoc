import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Github, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react'
import { repositoryService } from '@/services/repositoryService'
import { cn } from '@/lib/utils'

const GitHubConnectionStatus = ({ onStatusChange }) => {
  const [status, setStatus] = useState({
    connected: false,
    loading: true,
    error: null,
    username: null,
    avatar: null
  })

  const fetchConnectionStatus = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }))
      
      const [summary, userStats] = await Promise.all([
        repositoryService.getRepositorySummary(),
        repositoryService.getUserStats().catch(() => null) // Optional - may fail if not connected
      ])

      const connected = summary?.summary?.github_connected || false
      const githubInfo = userStats?.github_info || null

      setStatus({
        connected,
        loading: false,
        error: null,
        username: githubInfo?.github_username || null,
        avatar: githubInfo?.github_avatar || null
      })

      // Notify parent component of status change
      if (onStatusChange) {
        onStatusChange(connected)
      }
    } catch (error) {
      console.error('Failed to fetch GitHub status:', error)
      setStatus({
        connected: false,
        loading: false,
        error: error.message || 'Failed to check GitHub connection',
        username: null,
        avatar: null
      })
    }
  }

  useEffect(() => {
    fetchConnectionStatus()
  }, [])

  const handleConnect = () => {
    // Redirect to GitHub OAuth - using the correct endpoint from API reference
    window.location.href = '/api/users/github/callback/'
  }

  const handleDisconnect = async () => {
    try {
      await repositoryService.disconnectGitHub()
      await fetchConnectionStatus() // Refresh status
    } catch (error) {
      setStatus(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to disconnect GitHub' 
      }))
    }
  }

  const handleRetry = () => {
    fetchConnectionStatus()
  }

  if (status.loading) {
    return (
      <motion.div 
        className="bg-card border border-border rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-muted/30 rounded-lg">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Checking GitHub Connection</h3>
            <p className="text-sm text-muted-foreground">Please wait...</p>
          </div>
        </div>
      </motion.div>
    )
  }

  if (status.error) {
    return (
      <motion.div 
        className="bg-card border border-destructive/20 rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-destructive/10 rounded-lg">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Connection Error</h3>
              <p className="text-sm text-destructive">{status.error}</p>
            </div>
          </div>
          <motion.button
            onClick={handleRetry}
            className="px-4 py-2 text-sm bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Retry
          </motion.button>
        </div>
      </motion.div>
    )
  }

  if (!status.connected) {
    return (
      <motion.div 
        className="bg-card border border-border rounded-lg p-6 hover:border-primary/30 transition-colors"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted/30 border border-border rounded-lg">
              <Github className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Connect GitHub Account</h3>
              <p className="text-sm text-muted-foreground">
                Connect your GitHub account to sync repositories and generate documentation
              </p>
            </div>
          </div>
          <motion.button
            onClick={handleConnect}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-lg transition-colors"
            whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(74, 144, 226, 0.3)" }}
            whileTap={{ scale: 0.98 }}
          >
            <Github className="w-5 h-5" />
            Connect GitHub
            <ExternalLink className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>
    )
  }

  // Connected state
  return (
    <motion.div 
      className="bg-card border border-green-500/20 rounded-lg p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <Github className="w-6 h-6 text-green-500" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-foreground">GitHub Connected</h3>
              <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-medium rounded">
                ACTIVE
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {status.avatar && (
                <img 
                  src={status.avatar} 
                  alt={status.username}
                  className="w-5 h-5 rounded-full border border-border"
                />
              )}
              <p className="text-sm text-muted-foreground">
                Connected as <span className="font-medium text-foreground">{status.username}</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button
            onClick={handleRetry}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:border-primary/30 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Refresh
          </motion.button>
          <motion.button
            onClick={handleDisconnect}
            className="px-4 py-2 text-sm text-destructive border border-destructive/30 hover:bg-destructive/10 rounded-lg transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Disconnect
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

export default GitHubConnectionStatus

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckSquare, Square, Filter, Search, Star, GitFork, 
  Lock, Globe, Calendar, Code, AlertCircle, CheckCircle, 
  Loader2, ArrowRight
} from 'lucide-react'
import { repositoryService } from '@/services/repositoryService'
import { cn } from '@/lib/utils'

const RepositorySelection = ({ repositories, onSelectionChange }) => {
  const [state, setState] = useState({
    repositories: repositories || [],
    selectedIds: new Set(),
    updating: false,
    error: null,
    searchTerm: '',
    filterLanguage: 'all'
  })

  const [showFilters, setShowFilters] = useState(false)

  // Initialize selection state
  useEffect(() => {
    if (repositories && repositories.length > 0) {
      const selectedIds = new Set(
        repositories.filter(repo => repo.is_selected).map(repo => repo.id)
      )
      setState(prev => ({
        ...prev,
        repositories,
        selectedIds
      }))
    }
  }, [repositories])

  // Handle individual repository selection
  const handleToggleRepository = async (repositoryId) => {
    if (state.updating) return

    const newSelectedIds = new Set(state.selectedIds)
    
    if (newSelectedIds.has(repositoryId)) {
      newSelectedIds.delete(repositoryId)
    } else {
      newSelectedIds.add(repositoryId)
    }

    // Update local state immediately for responsiveness
    setState(prev => ({
      ...prev,
      selectedIds: newSelectedIds,
      updating: true,
      error: null,
      repositories: prev.repositories.map(repo => ({
        ...repo,
        is_selected: newSelectedIds.has(repo.id)
      }))
    }))

    try {
      await repositoryService.selectRepositories(Array.from(newSelectedIds))
      
      // Notify parent component
      if (onSelectionChange) {
        onSelectionChange(Array.from(newSelectedIds))
      }

      setState(prev => ({ ...prev, updating: false }))
    } catch (error) {
      console.error('Failed to update selection:', error)
      
      // Revert local state on error
      setState(prev => ({
        ...prev,
        updating: false,
        error: error.message || 'Failed to update repository selection',
        selectedIds: state.selectedIds,
        repositories: prev.repositories.map(repo => ({
          ...repo,
          is_selected: state.selectedIds.has(repo.id)
        }))
      }))
    }
  }

  // Handle select all/none
  const handleSelectAll = async () => {
    if (state.updating) return

    const allIds = new Set(filteredRepositories.map(repo => repo.id))
    const isSelectingAll = filteredRepositories.some(repo => !state.selectedIds.has(repo.id))
    
    const newSelectedIds = new Set(state.selectedIds)
    
    if (isSelectingAll) {
      // Add all filtered repositories to selection
      filteredRepositories.forEach(repo => newSelectedIds.add(repo.id))
    } else {
      // Remove all filtered repositories from selection
      filteredRepositories.forEach(repo => newSelectedIds.delete(repo.id))
    }

    setState(prev => ({
      ...prev,
      selectedIds: newSelectedIds,
      updating: true,
      error: null,
      repositories: prev.repositories.map(repo => ({
        ...repo,
        is_selected: newSelectedIds.has(repo.id)
      }))
    }))

    try {
      await repositoryService.selectRepositories(Array.from(newSelectedIds))
      
      if (onSelectionChange) {
        onSelectionChange(Array.from(newSelectedIds))
      }

      setState(prev => ({ ...prev, updating: false }))
    } catch (error) {
      console.error('Failed to update bulk selection:', error)
      setState(prev => ({
        ...prev,
        updating: false,
        error: error.message || 'Failed to update repository selection'
      }))
    }
  }

  // Filter repositories based on search and language
  const filteredRepositories = state.repositories.filter(repo => {
    const matchesSearch = repo.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
                         repo.full_name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
                         (repo.description && repo.description.toLowerCase().includes(state.searchTerm.toLowerCase()))
    
    const matchesLanguage = state.filterLanguage === 'all' || repo.language === state.filterLanguage

    return matchesSearch && matchesLanguage
  })

  // Get unique languages for filter
  const availableLanguages = [...new Set(state.repositories.map(repo => repo.language).filter(Boolean))]

  const selectedCount = state.selectedIds.size
  const pythonReposCount = state.repositories.filter(repo => 
    repo.language === 'Python' && state.selectedIds.has(repo.id)
  ).length

  if (state.repositories.length === 0) {
    return (
      <motion.div
        className="text-center py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-muted-foreground">
          <Code className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg mb-2">No repositories to select</p>
          <p className="text-sm">Please sync your repositories first</p>
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
            <CheckSquare className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Repository Selection</h3>
            <p className="text-sm text-muted-foreground">
              {selectedCount} of {state.repositories.length} repositories selected
              {pythonReposCount > 0 && (
                <span className="ml-2 text-primary">
                  • {pythonReposCount} Python projects
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-border hover:border-primary/30 rounded-lg transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Filter className="w-4 h-4" />
            Filters
          </motion.button>
          
          <motion.button
            onClick={handleSelectAll}
            disabled={state.updating || filteredRepositories.length === 0}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg transition-colors",
              (state.updating || filteredRepositories.length === 0) && "opacity-50 cursor-not-allowed"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {state.updating && <Loader2 className="w-4 h-4 animate-spin" />}
            {filteredRepositories.every(repo => state.selectedIds.has(repo.id)) ? 'Deselect All' : 'Select All'}
          </motion.button>
        </div>
      </div>

      {/* Error message */}
      {state.error && (
        <motion.div 
          className="mb-4 bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm flex items-center gap-2"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {state.error}
        </motion.div>
      )}

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="mb-6 p-4 bg-muted/20 border border-border rounded-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search repositories..."
                  value={state.searchTerm}
                  onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Language filter */}
              <select
                value={state.filterLanguage}
                onChange={(e) => setState(prev => ({ ...prev, filterLanguage: e.target.value }))}
                className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="all">All languages</option>
                {availableLanguages.map(language => (
                  <option key={language} value={language}>{language}</option>
                ))}
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Repository Grid */}
      {filteredRepositories.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No repositories match your filters</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRepositories.map((repo, index) => (
            <motion.div
              key={repo.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <RepositorySelectionCard
                repository={repo}
                isSelected={state.selectedIds.has(repo.id)}
                onToggle={() => handleToggleRepository(repo.id)}
                disabled={state.updating}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Selection Summary */}
      {selectedCount > 0 && (
        <motion.div
          className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">
                  {selectedCount} repositories selected
                </p>
                <p className="text-sm text-muted-foreground">
                  Ready for file sync and documentation generation
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-primary" />
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// Repository selection card component
const RepositorySelectionCard = ({ repository, isSelected, onToggle, disabled }) => {
  return (
    <motion.div
      className={cn(
        "p-4 border rounded-lg cursor-pointer transition-all duration-300 group",
        isSelected 
          ? "bg-primary/10 border-primary/30 shadow-sm"
          : "bg-muted/20 border-border hover:border-primary/30 hover:bg-muted/30",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={disabled ? undefined : onToggle}
      whileHover={disabled ? {} : { scale: 1.02, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1 mr-3">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-foreground truncate">
              {repository.name}
            </h4>
            {repository.private ? (
              <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            ) : (
              <Globe className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          
          {repository.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {repository.description}
            </p>
          )}
        </div>
        
        <div className="flex-shrink-0">
          {isSelected ? (
            <CheckSquare className="w-5 h-5 text-primary" />
          ) : (
            <Square className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
        </div>
      </div>

      {/* Repository metadata */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {repository.language && (
          <div className="flex items-center gap-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              getLanguageColor(repository.language)
            )} />
            <span>{repository.language}</span>
          </div>
        )}
        
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3" />
          <span>{repository.stars_count || 0}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <GitFork className="w-3 h-3" />
          <span>{repository.forks_count || 0}</span>
        </div>
      </div>

      {/* Python files indicator */}
      {repository.language === 'Python' && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1 text-xs text-primary">
            <Code className="w-3 h-3" />
            <span>Python project - Ready for documentation</span>
          </div>
        </div>
      )}

      {/* Updated time */}
      <div className="mt-2 pt-2 border-t border-border/50">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>Updated {formatRelativeTime(new Date(repository.updated_at))}</span>
        </div>
      </div>
    </motion.div>
  )
}

// Helper functions (reused from previous step)
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

export default RepositorySelection

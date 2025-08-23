import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
    User, Mail, Calendar, Github, ExternalLink,
    Settings, LogOut, BarChart3, GitBranch,
    FileText, Loader2, AlertCircle, CheckCircle,
    Unlink, RefreshCw
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/authService'
import { cn } from '@/lib/utils'
import ErrorBoundary from '@/components/common/ErrorBoundary'

const Profile = () => {
    const { user, logout } = useAuth()
    const [state, setState] = useState({
        profile: null,
        stats: null,
        loading: true,
        error: null,
        disconnecting: false,
        syncing: false
    })

    // Fetch profile and stats on mount
    useEffect(() => {
        Promise.all([
            fetchProfile(),
            fetchStats()
        ]).finally(() => {
            setState(prev => ({ ...prev, loading: false }))
        })
    }, [])

    const fetchProfile = async () => {
        try {
            const profileData = await authService.getProfile()
            setState(prev => ({ ...prev, profile: profileData }))
        } catch (error) {
            console.error('Failed to fetch profile:', error)
            setState(prev => ({
                ...prev,
                error: 'Failed to load profile information'
            }))
        }
    }

    const fetchStats = async () => {
        try {
            const statsData = await authService.getStats()
            setState(prev => ({ ...prev, stats: statsData }))
        } catch (error) {
            console.error('Failed to fetch stats:', error)
            // Don't set error for stats as it's not critical
        }
    }

    const handleSyncGitHubProfile = async () => {
        setState(prev => ({ ...prev, syncing: true, error: null }))

        try {
            // First sync the GitHub profile
            await authService.syncGitHubProfile()

            // Then refresh the profile and stats
            await fetchProfile()
            await fetchStats()

            setState(prev => ({ ...prev, syncing: false }))
        } catch (error) {
            console.error('Failed to sync GitHub profile:', error)
            setState(prev => ({
                ...prev,
                syncing: false,
                error: 'Failed to sync GitHub profile. Please try again.'
            }))
        }
    }

    const handleDisconnectGitHub = async () => {
        setState(prev => ({ ...prev, disconnecting: true }))

        try {
            await authService.disconnectGitHub()

            // Refresh profile data
            await fetchProfile()
            await fetchStats()

            setState(prev => ({ ...prev, disconnecting: false }))
        } catch (error) {
            console.error('Failed to disconnect GitHub:', error)
            setState(prev => ({
                ...prev,
                disconnecting: false,
                error: 'Failed to disconnect GitHub account'
            }))
        }
    }

    const handleLogout = () => {
        logout()
        // The logout function in AuthContext will handle the redirect
    }

    if (state.loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading profile...</span>
            </div>
        )
    }

    if (state.error) {
        return (
            <motion.div
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive opacity-20" />
                <p className="text-lg mb-2 text-foreground">Failed to Load Profile</p>
                <p className="text-sm text-muted-foreground mb-6">{state.error}</p>
                <motion.button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                </motion.button>
            </motion.div>
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
                    <div>
                        <h1 className="text-3xl font-bold text-foreground font-mono uppercase tracking-wider">
                            Profile Settings
                        </h1>
                        <p className="mt-2 text-lg text-muted-foreground">
                            Manage your account information and preferences
                        </p>
                    </div>

                    <motion.button
                        onClick={handleLogout}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 rounded-lg transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </motion.button>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Profile Card */}
                    <motion.div
                        className="lg:col-span-2 bg-card border border-border rounded-lg p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="flex items-center gap-6 mb-6">
                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center border-2 border-primary/20">
                                    {state.profile?.profile?.avatar_url ? (
                                        <img
                                            src={state.profile.profile.avatar_url}
                                            alt={state.profile.username}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-8 h-8 text-primary" />
                                    )}
                                </div>
                                {state.profile?.profile?.github_username && (
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-card border-2 border-border rounded-full flex items-center justify-center">
                                        <Github className="w-3 h-3 text-foreground" />
                                    </div>
                                )}
                            </div>

                            {/* User Info */}
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-foreground">
                                    {state.profile?.first_name && state.profile?.last_name
                                        ? `${state.profile.first_name} ${state.profile.last_name}`
                                        : state.profile?.username
                                    }
                                </h2>
                                <p className="text-muted-foreground">@{state.profile?.username}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">{state.profile?.email}</span>
                                </div>
                                {state.profile?.profile?.created_at && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">
                                            Joined {new Date(state.profile.profile.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Profile Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">First Name</h3>
                                <p className="text-foreground">
                                    {state.profile?.first_name || 'Not provided'}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">Last Name</h3>
                                <p className="text-foreground">
                                    {state.profile?.last_name || 'Not provided'}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">Username</h3>
                                <p className="text-foreground">{state.profile?.username}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">Email</h3>
                                <p className="text-foreground">{state.profile?.email}</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats Card */}
                    <motion.div
                        className="bg-card border border-border rounded-lg p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            Statistics
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <GitBranch className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Repositories</span>
                                </div>
                                <span className="text-lg font-semibold text-foreground">
                                    {state.stats?.total_repositories || 0}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Documentation Jobs</span>
                                </div>
                                <span className="text-lg font-semibold text-foreground">
                                    {state.stats?.total_jobs || 0}
                                </span>
                            </div>

                            {state.stats?.date_joined && (
                                <div className="pt-4 border-t border-border">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Member since</span>
                                    </div>
                                    <p className="text-sm font-medium text-foreground">
                                        {new Date(state.stats.date_joined).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* GitHub Integration Card */}
                <motion.div
                    className="bg-card border border-border rounded-lg p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Github className="w-5 h-5" />
                            GitHub Integration
                        </h3>

                        <motion.button
                            onClick={handleSyncGitHubProfile}
                            disabled={state.syncing}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border hover:border-primary/30 rounded-lg transition-colors"
                            whileHover={state.syncing ? {} : { scale: 1.02 }}
                            whileTap={state.syncing ? {} : { scale: 0.98 }}
                        >
                            {state.syncing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Syncing...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4" />
                                    Sync Profile
                                </>
                            )}
                        </motion.button>
                    </div>

                    {state.profile?.profile?.github_username ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-lg flex items-center justify-center border border-green-500/20">
                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">Connected to GitHub</p>
                                    <p className="text-sm text-muted-foreground">
                                        Connected as <span className="font-medium">@{state.profile.profile.github_username}</span>
                                    </p>
                                    {state.profile.profile.avatar_url && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <img
                                                src={state.profile.profile.avatar_url}
                                                alt="GitHub Avatar"
                                                className="w-4 h-4 rounded-full"
                                            />
                                            <span className="text-xs text-muted-foreground">GitHub avatar available</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <a
                                    href={`https://github.com/${state.profile.profile.github_username}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border hover:border-primary/30 rounded-lg transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    View Profile
                                </a>

                                <motion.button
                                    onClick={handleDisconnectGitHub}
                                    disabled={state.disconnecting}
                                    className={cn(
                                        "inline-flex items-center gap-2 px-3 py-2 text-sm bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 rounded-lg transition-colors",
                                        state.disconnecting && "opacity-50 cursor-not-allowed"
                                    )}
                                    whileHover={state.disconnecting ? {} : { scale: 1.02 }}
                                    whileTap={state.disconnecting ? {} : { scale: 0.98 }}
                                >
                                    {state.disconnecting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Disconnecting...
                                        </>
                                    ) : (
                                        <>
                                            <Unlink className="w-4 h-4" />
                                            Disconnect
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-orange-500/5 rounded-lg flex items-center justify-center border border-orange-500/20">
                                    <AlertCircle className="w-6 h-6 text-orange-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">GitHub Not Connected</p>
                                    <p className="text-sm text-muted-foreground">
                                        Connect your GitHub account to sync repositories
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        If you recently connected GitHub, try refreshing the profile data
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Link
                                    to="/dashboard/repositories"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                                >
                                    <Github className="w-4 h-4" />
                                    Connect GitHub
                                </Link>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    className="bg-card border border-border rounded-lg p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Quick Actions
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link
                            to="/dashboard/repositories"
                            className="flex items-center gap-3 p-4 border border-border hover:border-primary/30 rounded-lg transition-colors group"
                        >
                            <GitBranch className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                            <div>
                                <p className="font-medium text-foreground">Manage Repositories</p>
                                <p className="text-xs text-muted-foreground">Sync and select repositories</p>
                            </div>
                        </Link>

                        <Link
                            to="/dashboard/documentation"
                            className="flex items-center gap-3 p-4 border border-border hover:border-primary/30 rounded-lg transition-colors group"
                        >
                            <FileText className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                            <div>
                                <p className="font-medium text-foreground">View Documentation</p>
                                <p className="text-xs text-muted-foreground">Generated documentation jobs</p>
                            </div>
                        </Link>

                        <Link
                            to="/dashboard/overview"
                            className="flex items-center gap-3 p-4 border border-border hover:border-primary/30 rounded-lg transition-colors group"
                        >
                            <BarChart3 className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                            <div>
                                <p className="font-medium text-foreground">Dashboard Overview</p>
                                <p className="text-xs text-muted-foreground">View activity summary</p>
                            </div>
                        </Link>
                    </div>
                </motion.div>


            </div>
        </ErrorBoundary>
    )
}

export default Profile

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    GitBranch, FileText, Clock, TrendingUp, Github,
    Plus, ArrowRight, CheckCircle, AlertCircle
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { repositoryService } from '@/services/repositoryService'
import StatsCard from '@/components/dashboard/StatsCard'
import QuickActions from '@/components/dashboard/QuickActions'

const Overview = () => {
    const { user } = useAuth()
    const [stats, setStats] = useState(null)
    const [summary, setSummary] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [userStats, repoSummary] = await Promise.all([
                    repositoryService.getUserStats(),
                    repositoryService.getRepositorySummary()
                ])
                setStats(userStats)
                setSummary(repoSummary)
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    const statsData = [
        {
            title: 'Total Repositories',
            value: summary?.summary?.total_repositories || 0,
            icon: GitBranch,
            trend: '+2.3%',
            trendUp: true
        },
        {
            title: 'Selected Repositories',
            value: summary?.summary?.selected_repositories || 0,
            icon: CheckCircle,
            trend: '+12%',
            trendUp: true
        },
        {
            title: 'Documentation Jobs',
            value: stats?.total_jobs || 0,
            icon: FileText,
            trend: '+8.1%',
            trendUp: true
        },
        {
            title: 'Ready for Analysis',
            value: summary?.summary?.ready_for_analysis || 0,
            icon: TrendingUp,
            trend: '+4.2%',
            trendUp: true
        }
    ]

    return (
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
                            Welcome back, {user?.username}
                        </h1>
                        <p className="mt-2 text-lg text-muted-foreground">
                            Here's what's happening with your documentation projects
                        </p>
                    </div>

                    <motion.div
                        className="text-right"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <p className="text-sm text-muted-foreground">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </motion.div>
                </div>
            </motion.div>

            {/* Stats grid */}
            <motion.div
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
            >
                {statsData.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                    >
                        <StatsCard {...stat} />
                    </motion.div>
                ))}
            </motion.div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quick actions */}
                <motion.div
                    className="lg:col-span-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <QuickActions summary={summary} />
                </motion.div>
            </div>

            {/* Repository status */}
            {summary?.selected_repositories && summary.selected_repositories.length > 0 && (
                <motion.div
                    className="bg-card border border-border rounded-lg p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                >
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <GitBranch className="w-5 h-5 text-primary" />
                        Selected Repositories
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {summary.selected_repositories.slice(0, 6).map((repo, index) => (
                            <motion.div
                                key={repo.id}
                                className="p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, delay: 0.6 + index * 0.05 }}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-medium text-foreground truncate">
                                            {repo.name}
                                        </h4>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {repo.language} • {repo.python_files} Python files
                                        </p>
                                    </div>
                                    <div className={cn(
                                        "ml-2 flex-shrink-0 w-2 h-2 rounded-full",
                                        repo.analysis_status === 'pending' ? 'bg-yellow-500' : 'bg-green-500'
                                    )} />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {summary.selected_repositories.length > 6 && (
                        <div className="mt-4 text-center">
                            <motion.a
                                href="/dashboard/repositories"
                                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm"
                                whileHover={{ x: 4 }}
                            >
                                View all repositories
                                <ArrowRight className="w-4 h-4" />
                            </motion.a>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    )
}

export default Overview

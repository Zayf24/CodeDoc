import { motion } from 'framer-motion'
import { Github, GitBranch, FileText, Plus, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

const QuickActions = ({ summary }) => {
  const navigate = useNavigate()

  const actions = [
    {
      title: 'Connect GitHub',
      description: 'Link your GitHub account to sync repositories',
      icon: Github,
      action: () => window.location.href = '/api/users/github/callback/',
      disabled: summary?.summary?.github_connected,
      completed: summary?.summary?.github_connected,
      primary: !summary?.summary?.github_connected
    },
    {
      title: 'Sync Repositories',
      description: 'Import your latest repositories from GitHub',
      icon: GitBranch,
      action: () => navigate('/dashboard/repositories?action=sync'),
      disabled: !summary?.summary?.github_connected,
      primary: summary?.summary?.github_connected && summary?.summary?.total_repositories === 0
    },
    {
      title: 'Generate Documentation',
      description: 'Create AI-powered docs for your code',
      icon: FileText,
      action: () => navigate('/dashboard/docs'),
      disabled: summary?.summary?.ready_for_analysis === 0,
      primary: summary?.summary?.ready_for_analysis > 0
    }
  ]

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">
        Quick Actions
      </h3>

      <div className="space-y-4">
        {actions.map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <QuickActionCard {...action} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

const QuickActionCard = ({
  title,
  description,
  icon: Icon,
  action,
  disabled,
  completed,
  primary
}) => {
  // If completed, render as info card instead of button
  if (completed) {
    return (
      <div className="w-full p-4 rounded-lg border bg-green-500/10 border-green-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg border bg-green-500/20 border-green-500/40 text-green-500">
              <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <h4 className="font-medium mb-1 text-foreground">
                {title} ✓
              </h4>
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Regular button for non-completed actions
  return (
    <motion.button
      onClick={action}
      disabled={disabled}
      className={cn(
        "w-full p-4 rounded-lg border text-left transition-all duration-300 group",
        disabled
          ? "bg-muted/30 border-border/50 cursor-not-allowed opacity-50"
          : primary
            ? "bg-primary/10 border-primary/30 hover:bg-primary/20 hover:border-primary/50"
            : "bg-muted/30 border-border/50 hover:bg-muted/50 hover:border-primary/30"
      )}
      whileHover={disabled ? {} : { scale: 1.02, x: 4 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className={cn(
            "p-2 rounded-lg border",
            primary
              ? "bg-primary/20 border-primary/40 text-primary"
              : "bg-muted border-border text-muted-foreground"
          )}>
            <Icon className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <h4 className={cn(
              "font-medium mb-1",
              disabled ? "text-muted-foreground" : "text-foreground"
            )}>
              {title}
            </h4>
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        {!disabled && (
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        )}
      </div>
    </motion.button>
  )
}

export default QuickActions

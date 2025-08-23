import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const StatsCard = ({ title, value, icon: Icon, trend, trendUp }) => {
  return (
    <motion.div
      className="bg-card border border-border rounded-lg p-6 hover:border-primary/30 transition-colors group"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {title}
          </p>
          <motion.p 
            className="text-3xl font-bold text-foreground font-mono"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: "spring" }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </motion.p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg group-hover:bg-primary/20 transition-colors">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trendUp ? "text-green-500" : "text-red-500"
            )}>
              {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default StatsCard

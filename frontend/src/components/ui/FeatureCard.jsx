import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const FeatureCard = ({ icon: Icon, title, description, index, className }) => {
  return (
    <motion.div
      className={cn("group relative p-6 rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-300", className)}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1]
      }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className="mb-4 p-3 rounded-lg bg-primary/10 w-fit">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-glow transition-all duration-300">
          {title}
        </h3>
        
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  )
}

export default FeatureCard

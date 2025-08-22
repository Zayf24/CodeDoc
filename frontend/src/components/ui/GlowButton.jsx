import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const GlowButton = ({ children, className = "", onClick, ...props }) => {
  return (
    <motion.button
      className={cn("glow-button", className)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">
        <Clock className="w-5 h-5 hourglass-animation" />
        {children}
      </span>
    </motion.button>
  )
}

export default GlowButton

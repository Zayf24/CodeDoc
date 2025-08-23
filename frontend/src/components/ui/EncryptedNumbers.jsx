import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const EncryptedNumber = ({ value, duration = 2000, delay = 0 }) => {
  const [displayValue, setDisplayValue] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const startAnimation = setTimeout(() => {
      setIsAnimating(true)
      let frameId
      let start = null
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%^&*'
      
      function step(timestamp) {
        if (!start) start = timestamp
        const progress = timestamp - start
        const percent = Math.min(progress / duration, 1)
        let newVal = ''

        for (let i = 0; i < value.length; i++) {
          const char = value[i]
          // Calculate when this character should be revealed
          const charRevealPoint = (i / value.length) * 0.7 + 0.3
          
          if (percent >= charRevealPoint) {
            newVal += char
          } else if (char.match(/[0-9+%]/)) {
            // Only scramble numbers and special chars
            newVal += chars[Math.floor(Math.random() * chars.length)]
          } else {
            newVal += char
          }
        }
        
        setDisplayValue(newVal)

        if (percent < 1) {
          frameId = requestAnimationFrame(step)
        } else {
          setDisplayValue(value)
          setIsAnimating(false)
        }
      }

      frameId = requestAnimationFrame(step)

      return () => {
        if (frameId) cancelAnimationFrame(frameId)
      }
    }, delay)

    return () => clearTimeout(startAnimation)
  }, [value, duration, delay])

  return (
    <motion.span 
      className={`font-mono ${isAnimating ? 'text-primary' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: delay / 1000 }}
    >
      {displayValue || value}
    </motion.span>
  )
}

export default EncryptedNumber

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const ParallaxElement = ({ children, intensity = 0.2, className = "" }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX - window.innerWidth / 2) * intensity
      const y = (e.clientY - window.innerHeight / 2) * intensity
      setMousePosition({ x, y })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [intensity])
  
  return (
    <motion.div
      className={className}
      animate={{
        x: mousePosition.x,
        y: mousePosition.y,
      }}
      transition={{
        type: "spring",
        stiffness: 150,
        damping: 15,
        mass: 0.1
      }}
    >
      {children}
    </motion.div>
  )
}

export default ParallaxElement

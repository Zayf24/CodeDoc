import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import FunctionDemo from '@/components/ui/FunctionDemo'

const ActTwo = () => {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })
  
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0])
  
  return (
    <section ref={ref} className="section-spacing py-20">
      <motion.div 
        className="max-w-7xl mx-auto px-6"
        style={{ opacity }}
      >
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-6 text-glow">
            From Chaos to Clarity
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Watch your undocumented codebase transform into a professional, 
            well-documented system with comprehensive docstrings and type hints.
          </p>
        </motion.div>
        
        <FunctionDemo />
      </motion.div>
    </section>
  )
}

export default ActTwo

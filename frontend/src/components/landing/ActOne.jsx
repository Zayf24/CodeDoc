import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import DecodeText from '@/components/ui/DecodeText'
import ParallaxElement from '@/components/ui/ParallaxElement'
import GlowButton from '@/components/ui/GlowButton'

const ActOne = () => {
  const navigate = useNavigate()

  const handleGetStarted = () => {
    navigate('/login')
  }

  return (
    <section className="section-spacing relative overflow-hidden">
      <ParallaxElement intensity={0.1} className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/20 rounded-full animate-pulse" />
        <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-primary/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-primary/25 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </ParallaxElement>

      <div className="text-center max-w-4xl mx-auto px-6">
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <span className="inline-block px-4 py-2 rounded-full border border-primary/30 text-sm font-medium text-primary bg-primary/5 backdrop-blur">
            AI-Powered Code Documentation
          </span>
        </motion.div>

        <motion.h1
          className="text-5xl md:text-7xl font-black uppercase tracking-tight mb-8 text-glow"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <DecodeText
            text="Transform Your Code"
            className="block"
            delay={500}
          />
          <DecodeText
            text="Into Living Docs"
            className="block text-primary"
            delay={1000}
          />
        </motion.h1>

        <motion.div
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.8 }}
        >
          CodeDoc AI analyzes your repositories and generates professional documentation
          using advanced AI models. Connect GitHub, analyze code structure, and export
          comprehensive docstrings in minutes.
        </motion.div>

        <motion.div
          className="flex justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.2 }}
        >
          <GlowButton onClick={handleGetStarted}>
            Get Started
          </GlowButton>
        </motion.div>
      </div>
    </section>
  )
}

export default ActOne

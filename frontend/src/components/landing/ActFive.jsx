import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import GlowButton from '@/components/ui/GlowButton'

const features = [
  "Connect unlimited GitHub repositories",
  "AI-powered documentation generation",
  "Multiple export formats",
  "Real-time code analysis",
  "Professional README generation"
]

const ActFive = () => {
  const navigate = useNavigate()

  const handleGetStarted = () => {
    navigate('/login')
  }

  return (
    <section className="section-spacing py-20">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.h2
          className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-6 text-glow"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Ready to Transform Your Code?
        </motion.h2>

        <motion.p
          className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Join thousands of developers who are already using CodeDoc AI to create
          professional documentation automatically.
        </motion.p>

        <motion.div
          className="grid md:grid-cols-3 gap-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="md:col-span-2">
            <div className="text-left space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <motion.div
              className="p-6 rounded-lg border border-primary/30 bg-primary/5 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="text-2xl font-bold text-primary mb-2">Free</div>
              <div className="text-sm text-muted-foreground mb-4">14-day trial</div>
              <div className="text-xs text-muted-foreground">No credit card required</div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className="flex justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          viewport={{ once: true }}
        >
          <GlowButton onClick={handleGetStarted}>
            Get Started
          </GlowButton>
        </motion.div>
      </div>
    </section>
  )
}

export default ActFive

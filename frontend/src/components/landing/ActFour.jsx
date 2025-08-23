import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import EncryptedNumber from '@/components/ui/EncryptedNumbers'

const testimonials = [
  {
    quote: "CodeDoc AI transformed our entire development workflow. What used to take hours now happens in minutes.",
    author: "Sarah Chen",
    role: "Senior Developer",
    company: "TechFlow Inc."
  },
  {
    quote: "The AI-generated documentation is incredibly accurate and follows our coding standards perfectly.",
    author: "Marcus Rodriguez",
    role: "Lead Engineer",
    company: "DataStream"
  },
  {
    quote: "Finally, a tool that makes documentation feel effortless. Our code quality has improved dramatically.",
    author: "Emily Watson",
    role: "CTO",
    company: "InnovateLab"
  }
]

const stats = [
  { number: "10,000+", label: "Functions Documented" },
  { number: "500+", label: "Repositories Processed" },
  { number: "95%", label: "Time Saved" },
  { number: "99%", label: "Accuracy Rate" }
]

const ActFour = () => {
  return (
    <section className="section-spacing py-20">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-6 text-glow">
            Trusted by Developers
          </h2>
        </motion.div>

        {/* Stats with Encrypted Numbers */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {stats.map((stat, index) => (
            <motion.div 
              key={index} 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                <EncryptedNumber 
                  value={stat.number} 
                  duration={2000}
                  delay={600 + index * 200}
                />
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="p-6 rounded-lg border border-border/50 bg-card/50 backdrop-blur"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                ))}
              </div>
              
              <p className="text-foreground mb-6 italic">
                "{testimonial.quote}"
              </p>
              
              <div>
                <div className="font-semibold text-foreground">
                  {testimonial.author}
                </div>
                <div className="text-sm text-muted-foreground">
                  {testimonial.role} at {testimonial.company}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ActFour

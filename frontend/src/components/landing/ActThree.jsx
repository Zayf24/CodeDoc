import { motion } from 'framer-motion'
import { Code2, Zap, FileText, GitBranch, Download, Shield } from 'lucide-react'
import FeatureCard from '@/components/ui/FeatureCard'

const features = [
  {
    icon: Code2,
    title: "Deep Code Analysis",
    description: "Advanced AST parsing extracts functions, classes, and complexity metrics with surgical precision."
  },
  {
    icon: Zap,
    title: "AI Documentation Generation",
    description: "Gemini-powered intelligence creates professional docstrings and README files in seconds."
  },
  {
    icon: GitBranch,
    title: "GitHub Integration",
    description: "Seamlessly connect repositories, analyze code structure, and sync changes without breaking your workflow."
  },
  {
    icon: FileText,
    title: "Multiple Export Formats",
    description: "Export AI-generated documentation as JSON or copy generated content directly into your existing documentation workflows with one-click ease."
  },
  {
    icon: Download,
    title: "Batch Processing",
    description: "Process entire repositories at once with intelligent file detection and prioritization."
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your code never leaves your control. All processing happens securely with enterprise-grade privacy."
  }
]

const ActThree = () => {
  return (
    <section className="section-spacing py-20">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-6 text-glow">
            Powerful Features
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to transform your codebase into a comprehensive,
            professional documentation system.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default ActThree

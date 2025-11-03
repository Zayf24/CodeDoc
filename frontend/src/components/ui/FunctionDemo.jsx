import { motion } from 'framer-motion'
import { useRef } from 'react'
import { Code2, Sparkles, XCircle, CheckCircle } from 'lucide-react'
import { useSyncHeight } from '@/hooks/useSyncHeight'

const FunctionDemo = ({ className = "" }) => {
  const leftRef = useRef(null)
  const rightRef = useRef(null)
  
  // Sync heights of both code blocks
  useSyncHeight([leftRef, rightRef], [])

  const beforeCode = `def calculate_total(price, quantity):
    # TODO: Add documentation later
    return price * quantity * 1.08`

  const afterCode = `def calculate_total(price: float, quantity: int) -> float:
    """Calculate the total cost including tax.
    
    This function computes the total cost of items by 
    multiplying the unit price by quantity and adding 
    an 8% tax rate.
    
    Args:
        price (float): The unit price per item in dollars
        quantity (int): The number of items to purchase
        
    Returns:
        float: The total cost including 8% tax
        
    Example:
        >>> calculate_total(10.50, 3)
        34.02
        
    Raises:
        ValueError: If price or quantity is negative
    """
    if price < 0 or quantity < 0:
        raise ValueError("Price and quantity must be non-negative")
    
    return price * quantity * 1.08`

  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      <div className="code-comparison-grid">
        {/* Before Section */}
        <motion.div
          ref={leftRef}
          className="code-block-wrapper"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="code-caption before">
            <XCircle className="w-5 h-5" />
            Before: Undocumented Code
          </div>
          
          <div className="code-container">
            <div className="code-header">
              <Code2 className="w-4 h-4" />
              <span>main.py</span>
              <div className="ml-auto flex gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full opacity-60"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full opacity-60"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full opacity-60"></div>
              </div>
            </div>
            <div className="code-content">
              <pre className="text-foreground">
                <code>{beforeCode}</code>
              </pre>
            </div>
          </div>
          
          <div className="status-indicator missing">
            <div className="font-bold">Missing Documentation</div>
            <div className="text-sm mt-1 opacity-80">
              No type hints, docstrings, or error handling
            </div>
          </div>
        </motion.div>

        {/* After Section */}
        <motion.div
          ref={rightRef}
          className="code-block-wrapper"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="code-caption after">
            <CheckCircle className="w-5 h-5" />
            After: AI-Generated Documentation
          </div>
          
          <div className="code-container">
            <div className="code-header">
              <Sparkles className="w-4 h-4" />
              <span>main.py (Enhanced)</span>
              <div className="ml-auto flex gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full opacity-60"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full opacity-60"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div className="code-content">
              <pre className="text-foreground text-sm">
                <code>{afterCode}</code>
              </pre>
            </div>
          </div>
          
          <div className="status-indicator complete">
            <div className="font-bold">Complete Documentation</div>
            <div className="text-sm mt-1 opacity-80">
              Type hints, comprehensive docstring, and error handling
            </div>
          </div>
        </motion.div>
      </div>

      {/* Results Summary */}
      <motion.div 
        className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="text-center p-6 rounded-lg bg-card/50 border border-border">
          <div className="text-2xl font-bold text-primary mb-2">15x</div>
          <div className="text-sm text-muted-foreground">More Documentation</div>
        </div>
        <div className="text-center p-6 rounded-lg bg-card/50 border border-border">
          <div className="text-2xl font-bold text-primary mb-2">100%</div>
          <div className="text-sm text-muted-foreground">Type Coverage</div>
        </div>
        <div className="text-center p-6 rounded-lg bg-card/50 border border-border">
          <div className="text-2xl font-bold text-primary mb-2">30s</div>
          <div className="text-sm text-muted-foreground">Generation Time</div>
        </div>
      </motion.div>
      </div>
  )
}

export default FunctionDemo

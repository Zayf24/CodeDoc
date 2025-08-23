import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const DecodeText = ({ text, className = "", delay = 0 }) => {
  const [decodedText, setDecodedText] = useState('')
  const [isDecoding, setIsDecoding] = useState(false)
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*'
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsDecoding(true)
      let iteration = 0
      
      const interval = setInterval(() => {
        setDecodedText(current => 
          text
            .split('')
            .map((char, index) => {
              if (index < iteration) {
                return text[index]
              }
              return chars[Math.floor(Math.random() * chars.length)]
            })
            .join('')
        )
        
        if (iteration >= text.length) {
          clearInterval(interval)
          setDecodedText(text)
          setIsDecoding(false)
        }
        
        iteration += 1 / 3
      }, 30)
      
      return () => clearInterval(interval)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [text, delay])
  
  return (
    <motion.span 
      className={`${className} ${isDecoding ? 'text-primary' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: delay / 1000 }}
    >
      {decodedText || text}
    </motion.span>
  )
}

export default DecodeText

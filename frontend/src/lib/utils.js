import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) { 
  return twMerge(clsx(...inputs)) 
}

export const glitchText = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1]
    }
  }
}

export const decodeAnimation = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      duration: 1.2,
      ease: "easeOut"
    }
  }
}

export const glowAnimation = {
  initial: { boxShadow: "0 0 0 0 rgba(74, 144, 226, 0)" },
  animate: { 
    boxShadow: [
      "0 0 0 0 rgba(74, 144, 226, 0)",
      "0 0 20px 5px rgba(74, 144, 226, 0.3)",
      "0 0 0 0 rgba(74, 144, 226, 0)"
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

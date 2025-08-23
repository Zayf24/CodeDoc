import { useLayoutEffect } from 'react'

export const useSyncHeight = (refs, dependencies = []) => {
  useLayoutEffect(() => {
    const syncHeights = () => {
      if (refs.length === 0) return
      
      // Reset heights first
      refs.forEach(ref => {
        if (ref.current) {
          ref.current.style.height = 'auto'
        }
      })
      
      // Get the maximum height
      const heights = refs.map(ref => ref.current?.offsetHeight || 0)
      const maxHeight = Math.max(...heights)
      
      // Set all to max height
      refs.forEach(ref => {
        if (ref.current) {
          ref.current.style.height = `${maxHeight}px`
        }
      })
    }
    
    // Initial sync
    syncHeights()
    
    // Sync on window resize
    window.addEventListener('resize', syncHeights)
    
    return () => {
      window.removeEventListener('resize', syncHeights)
    }
  }, dependencies)
}

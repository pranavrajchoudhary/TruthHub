import { useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

export function SmoothCursor() {
  const cursorRef = useRef(null)
  const [isHovering, setIsHovering] = useState(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const xSpring = useSpring(x, { stiffness: 300, damping: 25, mass: 0.5 })
  const ySpring = useSpring(y, { stiffness: 300, damping: 25, mass: 0.5 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      x.set(e.clientX)
      y.set(e.clientY)
      
      // Check if hovering over interactive elements
      const target = e.target
      const isInteractive = target.matches('button, a, input, textarea, select, [role="button"], [onclick]') || 
                           target.closest('button, a, input, textarea, select, [role="button"], [onclick]')
      setIsHovering(isInteractive)
    }
    
    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [x, y])

  return (
    <motion.div
      ref={cursorRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[999] hidden md:block"
      style={{ 
        translateX: xSpring, 
        translateY: ySpring,
        transform: "translate(-25%, -25%)"
      }}
    >
      {/* Enhanced green cursor with multiple layers */}
      <motion.div 
        className="relative"
        animate={{
          scale: isHovering ? 1.5 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25
        }}
      >
        {/* Outer glow ring */}
        <div className={`h-12 w-12 rounded-full blur-lg animate-pulse transition-colors duration-300 ${
          isHovering ? 'bg-dark-green/20' : 'bg-dark-green/10'
        }`} />
        
        {/* Middle ring */}
        <div className={`absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full blur-sm animate-pulse transition-colors duration-300 ${
          isHovering ? 'bg-dark-green/30' : 'bg-dark-green/20'
        }`} style={{ animationDelay: '0.5s' }} />
        
        {/* Inner solid circle */}
        <div className={`absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-lg border transition-all duration-300 ${
          isHovering 
            ? 'bg-dark-green border-dark-green/50 shadow-dark-green/30' 
            : 'bg-dark-green/90 border-dark-green/30'
        }`} />
        
        {/* Center dot */}
        <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm" />
      </motion.div>
    </motion.div>
  )
}

export default SmoothCursor
import { useRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface MagneticButtonProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  strength?: number
  type?: 'button' | 'submit'
  disabled?: boolean
}

export default function MagneticButton({
  children, className = '', onClick, strength = 0.3, type = 'button', disabled = false,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useRef(0)
  const y = useRef(0)

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current || disabled) return
    const rect = ref.current.getBoundingClientRect()
    const dx = e.clientX - (rect.left + rect.width / 2)
    const dy = e.clientY - (rect.top + rect.height / 2)
    x.current = dx * strength
    y.current = dy * strength
    ref.current.style.transform = `translate(${x.current}px, ${y.current}px)`
  }

  const handleLeave = () => {
    if (!ref.current) return
    ref.current.style.transform = 'translate(0px, 0px)'
  }

  return (
    <motion.button
      ref={ref as any}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`transition-transform duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
    >
      {children}
    </motion.button>
  )
}

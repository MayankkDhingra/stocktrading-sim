import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface GSAPRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  duration?: number
}

export default function GSAPReveal({ children, className = '', delay = 0, direction = 'up', duration = 0.8 }: GSAPRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const ctx = useRef<gsap.Context | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const dirMap = { up: { y: 60 }, down: { y: -60 }, left: { x: 60 }, right: { x: -60 } }
    const from = dirMap[direction]

    ctx.current = gsap.context(() => {
      gsap.fromTo(ref.current,
        { ...from, opacity: 0 },
        {
          ...(direction === 'left' || direction === 'right' ? { x: 0 } : { y: 0 }),
          opacity: 1, duration, delay,
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
          ease: 'power3.out',
        }
      )
    })
    return () => ctx.current?.revert()
  }, [delay, direction, duration])

  return <div ref={ref} className={className}>{children}</div>
}

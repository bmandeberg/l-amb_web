'use client'

import { useEffect, useRef } from 'react'
import styles from './index.module.css'

interface TiltContainerProps {
  children: React.ReactNode
  maxTilt: number
  perspective: number
}

export default function TiltContainer({ children, maxTilt, perspective }: TiltContainerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Bail‑out during SSR (shouldn’t ever run, but double safety)
    if (typeof window === 'undefined') return

    const el = ref.current
    if (!el) return

    let rafId: number

    const handleMouseMove = (e: MouseEvent) => {
      // throttle with rAF
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const { clientX, clientY } = e

        // Viewport half‑sizes
        const halfW = window.innerWidth / 2
        const halfH = window.innerHeight / 2

        // Normalized offsets from screen centre (‑1 … 1)
        const dx = (clientX - halfW) / halfW
        const dy = (clientY - halfH) / halfH

        // Clamp + convert to small angles
        const ry = Math.max(Math.min(dx, 1), -1) * maxTilt // rotateY by X‑offset
        const rx = Math.max(Math.min(dy, 1), -1) * -maxTilt // invert for natural tilt

        el.style.transform = `perspective(${perspective}px) rotateX(${rx}deg) rotateY(${ry}deg)`
      })
    }

    const reset = () => {
      el.style.transform = `perspective(${perspective}px)`
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', reset) // pointer leaves viewport
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', reset)
    }
  }, [maxTilt, perspective])

  return (
    <div ref={ref} className={styles.tiltContainer}>
      {children}
    </div>
  )
}

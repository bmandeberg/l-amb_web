import { useEffect, useRef } from 'react'
import { secondaryColor } from '@/app/globals'

interface LFOScopeProps {
  value: number
}

const width = 310
const height = 40

export default function LFOScope({ value }: LFOScopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const latest = useRef(value)
  const idxRef = useRef(0)
  const dataRef = useRef<Float32Array>(new Float32Array(width).fill(0))
  const rafRef = useRef(0)
  const loopRef = useRef<() => void>(() => {})
  const parkedRef = useRef(false)

  latest.current = value // keep newest sample

  useEffect(() => {
    const dpr = window.devicePixelRatio ?? 1
    const cvs = canvasRef.current!
    cvs.width = width * dpr
    cvs.height = height * dpr
    cvs.style.width = `${width}px`
    cvs.style.height = `${height}px`

    const ctx = cvs.getContext('2d')!
    ctx.scale(dpr, dpr)
    ctx.strokeStyle = secondaryColor
    ctx.lineWidth = 1
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    let prev = NaN // last written sample
    let stillFrames = 0 // consecutive frames the value has been unchanged
    const loop = () => {
      // 1  write sample into ring-buffer
      const buf = dataRef.current
      let idx = idxRef.current
      stillFrames = latest.current === prev ? stillFrames + 1 : 0
      prev = latest.current
      buf[idx] = latest.current
      idx = (idx + 1) % width
      idxRef.current = idx

      // once the whole buffer is one constant value the drawn trace can't change —
      // park the loop entirely (stopped transport, latched/soloed LFOs); the
      // value-change effect below resumes it
      if (stillFrames >= width) {
        parkedRef.current = true
        return
      }
      rafRef.current = requestAnimationFrame(loop)

      // 2  clear & redraw
      ctx.clearRect(0, 0, width, height)
      ctx.beginPath()

      // wrap into [0, width) — JS % can return negative (e.g. idx-1 at idx=0),
      // which would read buf[-1] === undefined and break the path with NaN
      const getSample = (x: number) => buf[(((idx + x) % width) + width) % width]
      const toY = (v: number) => (1 - v) * (height - 1)

      const win = (i: number) => (getSample(i - 1) + getSample(i) + getSample(i + 1)) / 3

      for (let x = 0; x < width; x++) {
        const y = toY(win(x))
        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.stroke()
    }
    loopRef.current = loop
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // wake the parked loop when the value moves again
  useEffect(() => {
    if (parkedRef.current) {
      parkedRef.current = false
      rafRef.current = requestAnimationFrame(loopRef.current)
    }
  }, [value])

  return <canvas ref={canvasRef} style={{ display: 'block' }} aria-label="LFO visualiser" />
}

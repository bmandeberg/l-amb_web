'use client'

import React, { useEffect, useRef } from 'react'
import * as Tone from 'tone'
import cn from 'classnames'
import styles from './index.module.css'
import { secondaryColor } from '@/app/globals'

type RadialScopeProps = {
  analyser: React.RefObject<Tone.Analyser | null>
  audioInitialized: boolean
  playing: boolean
}

const SIZE = 150
const SMOOTHING = 1
const LINE_WIDTH = 1.5
const AMPLITUDE = 2
const FISHEYE = 2

export default function RadialScope({ analyser, audioInitialized, playing }: RadialScopeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !audioInitialized || !analyser.current) return

    const dpr = Math.max(1, window.devicePixelRatio || 1)
    canvas.style.width = `${SIZE}px`
    canvas.style.height = `${SIZE}px`
    canvas.width = Math.floor(SIZE * dpr)
    canvas.height = Math.floor(SIZE * dpr)

    const ctx = canvas.getContext('2d')!
    // Work in CSS pixels but render at device resolution
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Tone.Waveform exposes smoothing; types may not include it
    if (typeof analyser.current.smoothing === 'number') analyser.current.smoothing = SMOOTHING

    let raf = 0
    const draw = () => {
      if (!analyser.current) return

      const values = analyser.current.getValue() as Float32Array

      ctx.clearRect(0, 0, SIZE, SIZE)
      ctx.lineWidth = LINE_WIDTH
      ctx.strokeStyle = secondaryColor
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      const cx = SIZE / 2
      const cy = SIZE / 2
      const pad = 2 // soft inset
      const half = SIZE / 2 - pad

      // fisheye transform (barrel distortion around center)
      const fisheyeXY = (nx: number, ny: number, k: number) => {
        // nx, ny in [-1, 1]
        const r = Math.hypot(nx, ny)
        if (r === 0) return [0, 0]
        // radial mapping: r' = ((1+k) r) / (1 + k r)
        const rp = ((1 + k) * r) / (1 + k * r)
        const s = rp / r
        return [nx * s, ny * s]
      }

      ctx.beginPath()
      for (let i = 0; i < values.length; i++) {
        // normalized x across [-1, 1] with a tiny horizontal inset
        const t = i / (values.length - 1)
        const nx = (t * 2 - 1) * 0.96

        // normalized y from analyser (already ~[-1, 1])
        const ny = (values[i] as number) * AMPLITUDE

        // apply fisheye warp
        const [wx, wy] = fisheyeXY(nx, ny, FISHEYE)

        // map to canvas coords
        const x = cx + wx * half
        const y = cy + wy * half

        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)

    const a = analyser.current

    return () => {
      if (raf) cancelAnimationFrame(raf)
      a?.disconnect()
      a?.dispose()
    }
  }, [analyser, audioInitialized])

  return <canvas className={cn(styles.scope, { [styles.playing]: playing })} ref={canvasRef} />
}

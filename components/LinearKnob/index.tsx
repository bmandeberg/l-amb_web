'use client'

import { useMemo, useRef } from 'react'
import { useGesture } from '@use-gesture/react'
import { gray } from '@/app/globals'
import { constrain } from '@/util/math'
import styles from './index.module.css'

interface LinearKnobProps {
  min: number
  max: number
  value: number
  taper?: 'linear' | 'log' | number
  strokeColor?: string
  glow?: boolean
  onChange?: (value: number) => void
  onStart?: () => void
  onEnd?: () => void
}

const SIZE = 70
const RADIUS = 25
const CX = SIZE / 2
const CY = SIZE / 2
const START_ANGLE = 225
const RANGE = 270

export default function LinearKnob({
  min,
  max,
  value,
  taper = 'linear',
  glow,
  strokeColor,
  onChange,
  onStart,
  onEnd,
}: LinearKnobProps) {
  const valueRef = useRef(value)

  // Convert a normalized ratio [0–1] → actual value, applying taper
  const ratioToValue = (r: number) => {
    r = constrain(r, 0, 1)
    if (taper === 'log') {
      // log taper: equal steps in ratio give multiplicative steps in value
      return Math.exp(Math.log(min) + r * (Math.log(max) - Math.log(min)))
    }
    if (typeof taper === 'number') {
      // custom exponent
      return min + (max - min) * Math.pow(r, taper)
    }
    // linear
    return min + (max - min) * r
  }

  // Convert an actual value → normalized ratio [0–1], applying inverse taper
  const valueToRatio = (v: number) => {
    const clamped = constrain(v, min, max)
    const linearR = (clamped - min) / (max - min)
    if (taper === 'log') {
      return (Math.log(clamped) - Math.log(min)) / (Math.log(max) - Math.log(min))
    }
    if (typeof taper === 'number') {
      return Math.pow(linearR, 1 / taper)
    }
    return linearR
  }

  const drag = useGesture({
    onDrag: ({ movement: [dx, dy] }) => {
      // compute how much to nudge the ratio
      const dragScalar = 150
      const delta = (dx - dy) / dragScalar
      const startRatio = valueToRatio(valueRef.current)
      const newRatio = constrain(startRatio + delta, 0, 1)
      const newValue = ratioToValue(newRatio)
      onChange?.(newValue)
    },
    onDragStart: () => {
      valueRef.current = value
      onStart?.()
    },
    onDragEnd: () => onEnd?.(),
  })

  // current ratio drives the arc and pointer
  const ratio = valueToRatio(value)

  const filledArcD = useMemo(() => {
    if (ratio <= 0) return ''
    const endAngle = START_ANGLE - ratio * RANGE
    const { x: x0, y: y0 } = polar(START_ANGLE)
    const { x: x1, y: y1 } = polar(endAngle)
    const largeArc = ratio * RANGE > 180 ? 1 : 0
    return `M ${x0} ${y0} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x1} ${y1}`
  }, [ratio])

  const rotation = ratio * RANGE

  function polar(angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180
    return {
      x: CX + RADIUS * Math.cos(rad),
      y: CY - RADIUS * Math.sin(rad),
    }
  }

  return (
    <div className={styles.knobContainer} style={{ width: SIZE, height: SIZE }} draggable="false" {...drag()}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <defs>
          <filter id="knobArcGlow" x="-50%" y="-50%" width="200%" height="200%" filterUnits="userSpaceOnUse">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feFlood floodColor="white" floodOpacity="0.72" result="tint" />
            <feComposite in="tint" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* grey track */}
        <path d="M 17.32 52.68 A 25 25 0 1 1 52.68 52.68" fill="none" stroke={gray} strokeWidth="3" />

        {/* pointer */}
        <path
          d="M 17.32 52.68 L 35 35"
          fill="none"
          stroke={gray}
          strokeWidth="3"
          transform={`rotate(${rotation} ${CX} ${CY})`}
        />

        {/* filled arc */}
        {filledArcD && (
          <path
            d={filledArcD}
            fill="none"
            stroke={strokeColor || gray}
            strokeWidth="3"
            strokeLinecap="round"
            filter={glow ? 'url(#knobArcGlow)' : undefined}
          />
        )}
      </svg>
    </div>
  )
}

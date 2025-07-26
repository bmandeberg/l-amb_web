'use client'

import { useMemo, useRef, useCallback } from 'react'
import { useGesture } from '@use-gesture/react'
import { gray } from '@/app/globals'
import { constrain, polar } from '@/util/math'
import styles from './index.module.css'

interface LinearKnobProps {
  min: number
  max: number
  value: number
  taper?: 'linear' | 'log' | number
  step?: number
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

function snapToStep(v: number, step: number) {
  return step > 0 ? Math.round(v / step) * step : v
}

export default function LinearKnob({
  min,
  max,
  value,
  taper = 'linear',
  step = 0,
  glow,
  strokeColor,
  onChange,
  onStart,
  onEnd,
}: LinearKnobProps) {
  // always use snapped value for visuals and drag
  const snappedValue = useMemo(() => snapToStep(value, step), [value, step])
  const valueRef = useRef(snappedValue)

  const ratioToValue = useCallback(
    (r: number) => {
      r = constrain(r, 0, 1)
      let v: number
      if (taper === 'log') {
        if (min <= 0) throw new Error('Log taper requires min > 0')
        v = Math.exp(Math.log(min) + r * (Math.log(max) - Math.log(min)))
      } else if (typeof taper === 'number') {
        v = min + (max - min) * Math.pow(r, taper)
      } else {
        v = min + (max - min) * r
      }
      return constrain(snapToStep(v, step), min, max)
    },
    [min, max, taper, step]
  )

  const valueToRatio = useCallback(
    (v: number) => {
      const clamped = constrain(v, min, max)
      const linearR = (clamped - min) / (max - min)
      if (taper === 'log') {
        if (min <= 0) throw new Error('Log taper requires min > 0')
        return (Math.log(clamped) - Math.log(min)) / (Math.log(max) - Math.log(min))
      }
      if (typeof taper === 'number') {
        return Math.pow(linearR, 1 / taper)
      }
      return linearR
    },
    [min, max, taper]
  )

  const drag = useGesture({
    onDrag: ({ movement: [dx, dy] }) => {
      const dragScalar = 150
      const delta = (dx - dy) / dragScalar
      const startRatio = valueToRatio(valueRef.current)
      const newRatio = constrain(startRatio + delta, 0, 1)
      const newValue = ratioToValue(newRatio)
      onChange?.(newValue)
    },
    onDragStart: () => {
      valueRef.current = snappedValue
      onStart?.()
    },
    onDragEnd: () => onEnd?.(),
  })

  // always use the snapped value for visuals
  const ratio = useMemo(() => valueToRatio(snappedValue), [snappedValue, valueToRatio])

  const filledArcD = useMemo(() => {
    if (ratio <= 0) return ''
    const endAngle = START_ANGLE - ratio * RANGE
    const { x: x0, y: y0 } = polar(START_ANGLE, RADIUS, CX, CY)
    const { x: x1, y: y1 } = polar(endAngle, RADIUS, CX, CY)
    const largeArc = ratio * RANGE > 180 ? 1 : 0
    return `M ${x0} ${y0} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x1} ${y1}`
  }, [ratio])

  const content = useMemo(
    () => (
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
            transform={`rotate(${ratio * RANGE} ${CX} ${CY})`}
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
    ),
    [drag, filledArcD, strokeColor, glow, ratio]
  )

  return content
}

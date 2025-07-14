import { useMemo, useRef } from 'react'
import { useGesture } from '@use-gesture/react'
import { gray, primaryColor } from '@/app/globals'
import styles from './index.module.css'

interface LinearKnobProps {
  min: number
  max: number
  value: number
  onChange?: (value: number) => void
  onStart?: () => void
  onEnd?: () => void
}

const SIZE = 70
const RADIUS = 25
const CX = SIZE / 2
const CY = SIZE / 2
const START_ANGLE = 225 // where the track begins (bottom-left)
const RANGE = 270 // total clockwise sweep in degrees

export default function LinearKnob({ min, max, value, onChange, onStart, onEnd }: LinearKnobProps) {
  const valueRef = useRef<number>(0)

  const drag = useGesture({
    onDrag: ({ movement: [dx, dy] }) => {
      const range = max - min
      const dragScalar = 150
      const xOffset = ((dx / dragScalar) * range) / 2
      const yOffset = ((-dy / dragScalar) * range) / 2
      let newValue = valueRef.current + xOffset + yOffset
      newValue = constrain(newValue, min, max)
      onChange?.(newValue)
    },
    onDragStart: () => {
      valueRef.current = value
      onStart?.()
    },
    onDragEnd: () => onEnd?.(),
  })

  const polarToCartesian = (angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180
    return {
      x: CX + RADIUS * Math.cos(rad),
      y: CY - RADIUS * Math.sin(rad), // SVG y-axis goes downward
    }
  }

  const filledArcD = useMemo(() => {
    const t = (value - min) / (max - min)
    if (t <= 0) return ''
    const endAngle = START_ANGLE - t * RANGE // clockwise = decreasing angle
    const { x: x0, y: y0 } = polarToCartesian(START_ANGLE)
    const { x: x1, y: y1 } = polarToCartesian(endAngle)

    const largeArcFlag = t * RANGE > 180 ? 1 : 0

    return `M ${x0.toFixed(2)} ${y0.toFixed(2)}
            A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1
              ${x1.toFixed(2)} ${y1.toFixed(2)}`
  }, [value, min, max])

  // pointer line rotation
  const rotation = useMemo(() => ((value - min) / (max - min)) * RANGE, [value, min, max])

  return (
    <div className={styles.knobContainer} style={{ width: SIZE, height: SIZE }} draggable="false" {...drag()}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <defs>
          <filter
            id="knobArcGlow"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%" // room for the halo
            filterUnits="userSpaceOnUse">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feFlood floodColor="white" floodOpacity="0.72" result="tint" />
            <feComposite in="tint" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* outer grey track */}
        <path d="M 17.32 52.68 A 25 25 0 1 1 52.68 52.68" fill="none" stroke={gray} strokeWidth="3" />

        {/* indicator line */}
        <path
          d={`M 17.32 52.68 L ${CX} ${CY}`}
          fill="none"
          stroke={gray}
          strokeWidth="3"
          transform={`rotate(${rotation} ${CX} ${CY})`}
        />

        {/* filled-in arc */}
        {filledArcD && (
          <path
            d={filledArcD}
            fill="none"
            stroke={primaryColor}
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#knobArcGlow)"
          />
        )}
      </svg>
    </div>
  )
}

function constrain(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max)
}

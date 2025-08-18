import { useCallback, useState } from 'react'
import * as Tone from 'tone'
import { useGesture } from '@use-gesture/react'
import { secondaryColor, gray } from '@/app/globals'
import styles from './index.module.css'
import { constrain, scaleToRange } from '@/util/math'

const MAX_DETUNE = 100

export type VoiceType = 'triangle' | 'sawtooth' | 'pulse' | 'fatsawtooth'

interface VoiceTypeSelectorProps {
  voiceType: VoiceType
  setVoiceType: (type: VoiceType) => void
  voiceRef: React.RefObject<Tone.OmniOscillator<Tone.Oscillator> | null>
  fatInit?: number
}

export default function VoiceTypeSelector({ voiceType, setVoiceType, voiceRef, fatInit }: VoiceTypeSelectorProps) {
  const [fatSpread, setFatSpread] = useState(fatInit ?? MAX_DETUNE)
  const [pulseWidth, setPulseWidth] = useState(0.5)

  const updateVoiceType = useCallback(
    (type: VoiceType) => {
      setVoiceType(type)
      if (voiceRef?.current) {
        voiceRef.current.type = type

        if (type === 'pulse') {
          voiceRef.current.width.value = pulseWidth
        } else if (type === 'fatsawtooth') {
          voiceRef.current.spread = fatSpread
        }
      }
    },
    [setVoiceType, voiceRef, pulseWidth, fatSpread]
  )

  const dragDetune = useGesture({
    onDrag: ({ delta: [dx] }) => {
      const newDetune = constrain(fatSpread + dx * 2, 0, MAX_DETUNE)
      setFatSpread(newDetune)
      if (voiceRef?.current) {
        voiceRef.current.spread = newDetune
      }
    },
  })

  const dragPulseWidth = useGesture({
    onDrag: ({ delta: [dx] }) => {
      const newWidth = constrain(pulseWidth + dx * 0.01, 0.1, 0.9)
      setPulseWidth(newWidth)
      if (voiceRef?.current && voiceType === 'pulse') {
        voiceRef.current.width.value = newWidth
      }
    },
  })

  return (
    <div className={styles.voiceType}>
      {/* triangle */}
      <svg width={14} height={14} viewBox="0 0 14 14" onClick={() => updateVoiceType('triangle')}>
        <polygon
          points="7,1 13,13 1,13"
          stroke={voiceType === 'triangle' ? secondaryColor : gray}
          strokeWidth={2}
          fill="none"
        />
      </svg>

      {/* sawtooth */}
      <svg width={14} height={14} viewBox="0 0 14 14" onClick={() => updateVoiceType('sawtooth')}>
        <polygon
          points="1,1 13,13 1,13"
          stroke={voiceType === 'sawtooth' ? secondaryColor : gray}
          strokeWidth={2}
          fill="none"
        />
      </svg>

      {/* pulse */}
      <svg width={14} height={14} viewBox="0 0 14 14" onClick={() => updateVoiceType('pulse')} {...dragPulseWidth()}>
        <rect
          x={Math.max(pulseWidth - 0.5, 0) * 12 + 1}
          y="1"
          width={(1 - Math.abs(0.5 - pulseWidth)) * 12}
          height="12"
          stroke={voiceType === 'pulse' ? secondaryColor : gray}
          strokeWidth={2}
          fill="none"
        />
      </svg>

      {/* fatsawtooth */}
      <svg width={14} height={14} viewBox="0 0 14 14" onClick={() => updateVoiceType('fatsawtooth')} {...dragDetune()}>
        <line
          x1="1"
          y1={scaleToRange(fatSpread, 0, MAX_DETUNE, 8, 1)}
          x2="1"
          y2="13"
          stroke={voiceType === 'fatsawtooth' ? secondaryColor : gray}
          strokeWidth={2}
        />
        <line
          x1="7"
          y1="1"
          x2="7"
          y2="13"
          stroke={voiceType === 'fatsawtooth' ? secondaryColor : gray}
          strokeWidth={2}
        />
        <line
          x1="13"
          y1={scaleToRange(fatSpread, 0, MAX_DETUNE, 8, 1)}
          x2="13"
          y2="13"
          stroke={voiceType === 'fatsawtooth' ? secondaryColor : gray}
          strokeWidth={2}
        />
      </svg>
    </div>
  )
}

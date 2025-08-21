import { useCallback, useState } from 'react'
import * as Tone from 'tone'
import { useGesture } from '@use-gesture/react'
import { secondaryColor, gray } from '@/app/globals'
import styles from './index.module.css'
import { constrain, scaleToRange } from '@/util/math'
import { initState, updateLocalStorage } from '@/util/presets'

export const MAX_DETUNE = 100

export type VoiceType = 'triangle' | 'sawtooth' | 'pulse' | 'fatsawtooth'

interface VoiceTypeSelectorProps {
  voiceType: VoiceType
  setVoiceType: (type: VoiceType) => void
  voiceRef: React.RefObject<Tone.OmniOscillator<Tone.Oscillator> | null>
  index: number
  fatInit?: number
  pulseInit?: number
}

export default function VoiceTypeSelector({
  voiceType,
  setVoiceType,
  voiceRef,
  fatInit,
  pulseInit,
  index,
}: VoiceTypeSelectorProps) {
  const [fatSpread, setFatSpread] = useState<number>(
    () => initState('fatSpread', fatInit ?? MAX_DETUNE, 'voice' + index) as number
  )
  const [pulseWidth, setPulseWidth] = useState<number>(
    () => initState('pulseWidth', pulseInit ?? 0.5, 'voice' + index) as number
  )

  const updateVoiceType = useCallback(
    (type: VoiceType) => {
      setVoiceType(type)
      updateLocalStorage('type', type, 'voice' + index)
      if (voiceRef?.current) {
        voiceRef.current.type = type

        if (type === 'pulse') {
          voiceRef.current.set({ width: pulseWidth })
        } else if (type === 'fatsawtooth') {
          voiceRef.current.set({ spread: fatSpread })
        }
      }
    },
    [setVoiceType, voiceRef, pulseWidth, fatSpread, index]
  )

  const dragDetune = useGesture({
    onDrag: ({ delta: [dx, dy] }) => {
      const delta = dx - dy
      const newDetune = constrain(fatSpread + delta, 0, MAX_DETUNE)
      setFatSpread(newDetune)
      updateLocalStorage('fatSpread', newDetune, 'voice' + index)
      if (voiceRef?.current) {
        voiceRef.current.set({ spread: newDetune })
      }
    },
  })

  const dragPulseWidth = useGesture({
    onDrag: ({ delta: [dx, dy] }) => {
      const delta = dx - dy
      const newWidth = constrain(pulseWidth + delta * 0.01, 0.1, 0.9)
      setPulseWidth(newWidth)
      updateLocalStorage('pulseWidth', newWidth, 'voice' + index)
      if (voiceRef?.current && voiceType === 'pulse') {
        voiceRef.current.set({ width: newWidth })
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

import { useEffect } from 'react'
import * as Tone from 'tone'
import { secondaryColor, gray } from '@/app/globals'
import styles from './index.module.css'

export type VoiceType = 'triangle' | 'sawtooth' | 'pulse' | 'fatsawtooth'

interface VoiceTypeSelectorProps {
  voiceType: VoiceType
  setVoiceType: (type: VoiceType) => void
  voiceRef: React.RefObject<Tone.OmniOscillator<Tone.Oscillator> | null>
}

export default function VoiceTypeSelector({ voiceType, setVoiceType, voiceRef }: VoiceTypeSelectorProps) {
  useEffect(() => {
    if (voiceRef?.current) {
      voiceRef.current.type = voiceType
    }
  }, [voiceType, voiceRef])

  return (
    <div className={styles.voiceType}>
      {/* triangle */}
      <svg width={14} height={14} viewBox="0 0 14 14" onClick={() => setVoiceType('triangle')}>
        <polygon
          points="7,1 13,13 1,13"
          stroke={voiceType === 'triangle' ? secondaryColor : gray}
          strokeWidth={2}
          fill="none"
        />
      </svg>

      {/* sawtooth */}
      <svg width={14} height={14} viewBox="0 0 14 14" onClick={() => setVoiceType('sawtooth')}>
        <polygon
          points="1,1 13,13 1,13"
          stroke={voiceType === 'sawtooth' ? secondaryColor : gray}
          strokeWidth={2}
          fill="none"
        />
      </svg>

      {/* pulse */}
      <svg width={14} height={14} viewBox="0 0 14 14" onClick={() => setVoiceType('pulse')}>
        <rect
          x="1"
          y="1"
          width="12"
          height="12"
          stroke={voiceType === 'pulse' ? secondaryColor : gray}
          strokeWidth={2}
          fill="none"
        />
      </svg>

      {/* fatsawtooth */}
      <svg width={14} height={14} viewBox="0 0 14 14" onClick={() => setVoiceType('fatsawtooth')}>
        <line
          x1="1"
          y1="7"
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
          y1="7"
          x2="13"
          y2="13"
          stroke={voiceType === 'fatsawtooth' ? secondaryColor : gray}
          strokeWidth={2}
        />
      </svg>
    </div>
  )
}

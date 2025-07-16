import LinearKnob from '@/components/LinearKnob'
import { primaryColor } from '@/app/globals'
import styles from './index.module.css'

// MIDI note 12 - 84 (C0 - C6, 16.35Hz - 8372Hz)

interface VoiceProps {
  pitch: number
  setPitch: (value: number) => void
}

export default function Voice({ pitch, setPitch }: VoiceProps) {
  return (
    <div className={styles.voice}>
      <LinearKnob min={12} max={84} value={pitch} onChange={setPitch} strokeColor={primaryColor} glow />
    </div>
  )
}

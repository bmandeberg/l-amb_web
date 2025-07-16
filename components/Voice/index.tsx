import { useState } from 'react'
import LinearKnob from '@/components/LinearKnob'
import { primaryColor } from '@/app/globals'
import styles from './index.module.css'

// MIDI note 12 - 84 (C0 - C6, 16.35Hz - 8372Hz)

export default function Voice() {
  const [pitch, setPitch] = useState(12)

  return (
    <div className={styles.voice}>
      <LinearKnob min={12} max={84} value={pitch} onChange={setPitch} strokeColor={primaryColor} taper="log" glow />
    </div>
  )
}

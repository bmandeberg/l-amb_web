'use client'

import { useState } from 'react'
import LinearKnob from '@/components/LinearKnob'
import styles from './index.module.css'

export default function Voice() {
  const [knobValue, setKnobValue] = useState(0)

  return (
    <div className={styles.voice}>
      <LinearKnob min={0} max={100} value={knobValue} onChange={setKnobValue} />
    </div>
  )
}

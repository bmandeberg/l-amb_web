'use client'

import { useState } from 'react'
import LinearKnob from '@/components/LinearKnob'
import styles from './page.module.css'

export default function Home() {
  const [knobValue, setKnobValue] = useState(0)

  return (
    <div className={styles.page}>
      <LinearKnob min={0} max={100} value={knobValue} onChange={setKnobValue} />
    </div>
  )
}

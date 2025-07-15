'use client'

import { CSSProperties as CSS, useState, useCallback } from 'react'
import Image from 'next/image'
import * as Tone from 'tone'
import getNativeContext from '@/util/getNativeContext'
import { primaryColor } from './globals'
import Voice from '@/components/Voice'
import BinaryTree from '@/components/BinaryTree'
import useLFO from '@/hooks/useLFO'
import styles from './page.module.css'

export default function LAMBApp() {
  const [initialized, setInitialized] = useState(false)
  const [playing, setPlaying] = useState(false)

  const lfo1 = useLFO(initialized, { frequency: 1, dutyCycle: 0.5, shape: 1 })
  const lfo2 = useLFO(initialized, { frequency: 2, dutyCycle: 0.5, shape: 0 })
  const lfo3 = useLFO(initialized, { frequency: 0.5, dutyCycle: 0.5, shape: 1 })

  const playStop = useCallback(async () => {
    if (!initialized) {
      await Tone.start()
      setInitialized(true)
    }

    setPlaying((playing) => {
      const ctx = getNativeContext()

      if (!playing) {
        ctx.resume()
      } else {
        ctx.suspend()
      }

      return !playing
    })
  }, [initialized])

  return (
    <div className={styles.page} style={{ '--primary-color': primaryColor } as CSS}>
      <BinaryTree lfo1={lfo1} lfo2={lfo2} lfo3={lfo3} allOn={!initialized} />
      <div className={styles.voices}>
        <Voice />
        <div style={{ width: 164 }} />
        <Voice />
        <Voice />
        <Voice />
      </div>
      <div className={styles.infoLayer}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Image src="/logotype-red.png" alt="L-AMB Logo" width={289.36} height={40} />
            <Image
              className={styles.playStopButton}
              src={!playing ? '/play.svg' : '/stop.svg'}
              alt="Play/Stop Button"
              width={40}
              height={40}
              onClick={playStop}
            />
          </div>
          <Image src="/manberg-red.png" alt="Manberg Logo" width={141.84} height={40} />
        </div>
      </div>
    </div>
  )
}

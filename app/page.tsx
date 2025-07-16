'use client'

import { CSSProperties as CSS, useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import * as Tone from 'tone'
import cn from 'classnames'
import getNativeContext from '@/util/getNativeContext'
import { primaryColor, secondaryColor } from './globals'
import { LFOParameters } from '@/tone/lfoNode'
import Voice from '@/components/Voice'
import BinaryTree from '@/components/BinaryTree'
import LFOScope from '@/components/LFOScope'
import LFOControls from '@/components/LFOControls'
import useLFO from '@/hooks/useLFO'
import styles from './page.module.css'

const lfo1Default: LFOParameters = { frequency: 1, dutyCycle: 0.25, shape: 1 }
const lfo2Default: LFOParameters = { frequency: 0.5, dutyCycle: 0.25, shape: 0 }
const lfo3Default: LFOParameters = { frequency: 2, dutyCycle: 0.5, shape: 1 }

export default function LAMBApp() {
  const [initialized, setInitialized] = useState(false)
  const [playing, setPlaying] = useState(false)

  const {
    value: lfo1,
    setFrequency: setLfo1Frequency,
    setDuty: setLfo1Duty,
    setShape: setLfo1Shape,
  } = useLFO(initialized, lfo1Default)
  const {
    value: lfo2,
    setFrequency: setLfo2Frequency,
    setDuty: setLfo2Duty,
    setShape: setLfo2Shape,
  } = useLFO(initialized, lfo2Default)
  const {
    value: lfo3,
    setFrequency: setLfo3Frequency,
    setDuty: setLfo3Duty,
    setShape: setLfo3Shape,
  } = useLFO(initialized, lfo3Default)

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault() // prevent scrolling
        playStop()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [playStop])

  return (
    <div
      className={styles.page}
      style={{ '--primary-color': primaryColor, '--secondary-color': secondaryColor } as CSS}>
      <BinaryTree lfo1={lfo1} lfo2={lfo2} lfo3={lfo3} allOn={!playing} />
      <div className={styles.voices}>
        <Voice />
        <div style={{ width: 146 }} />
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
        <div className={styles.lfoControls}>
          <div className={cn(styles.lfoControl, { [styles.active]: playing })}>
            <LFOScope value={lfo1} />
            <LFOControls
              init={lfo1Default}
              setFrequency={setLfo1Frequency}
              setDutyCycle={setLfo1Duty}
              setShape={setLfo1Shape}
            />
          </div>
          <div className={cn(styles.lfoControl, { [styles.active]: playing })} style={{ marginRight: 100 }}>
            <LFOScope value={lfo2} />
            <LFOControls
              init={lfo2Default}
              setFrequency={setLfo2Frequency}
              setDutyCycle={setLfo2Duty}
              setShape={setLfo2Shape}
            />
          </div>
          <div className={cn(styles.lfoControl, { [styles.active]: playing })} style={{ marginRight: 197 }}>
            <LFOScope value={lfo3} />
            <LFOControls
              init={lfo3Default}
              setFrequency={setLfo3Frequency}
              setDutyCycle={setLfo3Duty}
              setShape={setLfo3Shape}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

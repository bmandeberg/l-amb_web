import React, { useState, useCallback } from 'react'
import ReactSwitch from 'react-switch'
import useLambStore from '@/app/state'
import { LFOParameters } from '@/tone/createLFO'
import LinearKnob from '@/components/LinearKnob'
import { gray, secondaryColor } from '@/app/globals'
import styles from './index.module.css'

interface LFOControlsProps {
  init: LFOParameters
  lfo1?: boolean
  setFrequency: React.RefObject<null | ((hz: number) => void)>
  setDutyCycle: React.RefObject<null | ((d: number) => void)>
  setShape: React.RefObject<null | ((s: 0 | 1) => void)>
}

export default function LFOControls({ init, lfo1, setFrequency, setDutyCycle, setShape }: LFOControlsProps) {
  const [frequency, setLocalFrequency] = useState<number>(init.frequency)
  const [dutyCycle, setLocalDutyCycle] = useState<number>(init.dutyCycle)
  const [shape, setLocalShape] = useState<boolean>(!!init.shape)

  const setLfo1Freq = useLambStore((state) => state.setLfo1Freq)

  const updateFrequency = useCallback(
    (hz: number) => {
      setLocalFrequency(hz)
      if (lfo1) {
        setLfo1Freq(hz)
      }
      setFrequency?.current?.(hz)
    },
    [setFrequency, setLfo1Freq, lfo1]
  )

  const updateDutyCycle = useCallback(
    (d: number) => {
      setLocalDutyCycle(d)
      setDutyCycle?.current?.(d)
    },
    [setDutyCycle]
  )

  const updateShape = useCallback(
    (s: boolean) => {
      setLocalShape(s)
      setShape?.current?.(s ? 1 : 0)
    },
    [setShape]
  )

  return (
    <div className={styles.lfoControls}>
      <div className={styles.lfoControl}>
        <LinearKnob
          min={0.05}
          max={10}
          value={frequency}
          onChange={updateFrequency}
          strokeColor={secondaryColor}
          taper="log"
        />
        <p>FREQ</p>
      </div>
      <div className={styles.lfoControl} style={{ marginLeft: -20 }}>
        <LinearKnob min={0} max={1} value={dutyCycle} onChange={updateDutyCycle} strokeColor={secondaryColor} />
        <p>DUTY</p>
      </div>
      <div className={styles.shapeControl}>
        <svg width={14} height={14} viewBox="0 0 14 14">
          <rect x={0} y={0} width={14} height={14} stroke={shape ? gray : secondaryColor} strokeWidth={4} fill="none" />
        </svg>
        <ReactSwitch
          onChange={updateShape}
          checked={shape}
          uncheckedIcon={false}
          checkedIcon={false}
          width={48}
          height={24}
        />
        <svg width={14} height={14} viewBox="0 0 14 14">
          <polygon points="7,1 13,13 1,13" stroke={shape ? secondaryColor : gray} strokeWidth={2} fill="none" />
        </svg>
      </div>
    </div>
  )
}

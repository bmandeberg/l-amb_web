import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import ReactSwitch from 'react-switch'
import useLambStore from '@/app/state'
import { LFOParameters } from '@/tone/createLFO'
import LinearKnob from '@/components/LinearKnob'
import { gray, secondaryColor } from '@/app/globals'
import { clockDivMultOptions, numClockOptions } from '@/util/clock'
import styles from './index.module.css'

interface LFOControlsProps {
  init: LFOParameters
  lfo1?: boolean
  setFrequency: React.RefObject<null | ((hz: number) => void)>
  setDutyCycle: React.RefObject<null | ((d: number) => void)>
  freqMod: number
  dutyMod: number
  setShape: React.RefObject<null | ((s: 0 | 1) => void)>
  lfo1Phase?: React.RefObject<null | number>
  setPhase?: React.RefObject<null | ((phase: number) => void)>
  syncLfos?: boolean
}

export default function LFOControls({
  init,
  lfo1,
  setFrequency,
  setDutyCycle,
  freqMod,
  dutyMod,
  setShape,
  lfo1Phase,
  setPhase,
  syncLfos,
}: LFOControlsProps) {
  const [frequency, setLocalFrequency] = useState<number>(init.frequency)
  const frequencyRef = useRef<number>(frequency)
  const [clockDivMultIndex, setClockDivMultIndex] = useState<number>(Math.floor(numClockOptions / 2))
  const clockDivMultRef = useRef<number>(clockDivMultIndex)
  const [dutyCycle, setLocalDutyCycle] = useState<number>(init.dutyCycle)
  const [shape, setLocalShape] = useState<boolean>(!!init.shape)

  const lfo1Freq = useLambStore((state) => state.lfo1Freq)
  const setLfo1Freq = useLambStore((state) => state.setLfo1Freq)

  useEffect(() => {
    frequencyRef.current = frequency
  }, [frequency])
  useEffect(() => {
    clockDivMultRef.current = clockDivMultIndex
  }, [clockDivMultIndex])

  const updateFrequency = useCallback(
    (hzOrClockIndex: number) => {
      if (lfo1) {
        setLfo1Freq(hzOrClockIndex)
      }

      if (syncLfos) {
        const clockDivMult = clockDivMultOptions[hzOrClockIndex]
        const divMultFreq = hzOrClockIndex < numClockOptions / 2 ? lfo1Freq / clockDivMult : lfo1Freq * clockDivMult
        setFrequency?.current?.(divMultFreq)
      } else {
        setFrequency?.current?.(hzOrClockIndex)
      }
    },
    [setFrequency, setLfo1Freq, lfo1, syncLfos, lfo1Freq]
  )

  useEffect(() => {
    if (syncLfos) {
      const clockDivMult = clockDivMultOptions[clockDivMultRef.current]
      const divMultFreq =
        clockDivMultRef.current < numClockOptions / 2 ? lfo1Freq / clockDivMult : lfo1Freq * clockDivMult
      setFrequency?.current?.(divMultFreq)

      // set phase to match lfo1 phase
      if (lfo1Phase && lfo1Phase?.current !== null) {
        setPhase?.current?.(lfo1Phase.current)
      }
    } else {
      setFrequency?.current?.(frequencyRef.current)
    }
  }, [lfo1Freq, syncLfos, setFrequency, setPhase, lfo1Phase])

  const updateDutyCycle = useCallback(
    (d: number) => {
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

  const content = useMemo(
    () => (
      <div className={styles.lfoControls}>
        <div className={styles.lfoControl}>
          <LinearKnob
            min={syncLfos ? 0 : 0.05}
            max={syncLfos ? numClockOptions - 1 : 10}
            step={syncLfos ? 1 : undefined}
            value={syncLfos ? clockDivMultIndex : frequency}
            onChange={syncLfos ? setClockDivMultIndex : setLocalFrequency}
            setModdedValue={updateFrequency}
            strokeColor={secondaryColor}
            taper={syncLfos ? undefined : 'log'}
            modVal={freqMod}
          />
          <p className={styles.lfoControlValue}>
            {syncLfos
              ? (clockDivMultIndex < numClockOptions / 2 - 1 ? '÷' : '×') + clockDivMultOptions[clockDivMultIndex]
              : frequency.toFixed(2) + ' Hz'}
          </p>
          <p className={styles.lfoControlLabel}>FREQ</p>
        </div>
        <div className={styles.lfoControl} style={{ marginLeft: -20 }}>
          <LinearKnob
            min={0}
            max={1}
            value={dutyCycle}
            onChange={setLocalDutyCycle}
            setModdedValue={updateDutyCycle}
            strokeColor={secondaryColor}
            modVal={dutyMod}
          />
          <p className={styles.lfoControlValue}>{(dutyCycle * 100).toFixed(0) + '%'}</p>
          <p className={styles.lfoControlLabel}>DUTY</p>
        </div>
        <div className={styles.shapeControl}>
          <svg width={14} height={14} viewBox="0 0 14 14">
            <rect
              x={0}
              y={0}
              width={14}
              height={14}
              stroke={shape ? gray : secondaryColor}
              strokeWidth={4}
              fill="none"
            />
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
    ),
    [
      dutyCycle,
      frequency,
      shape,
      updateDutyCycle,
      updateFrequency,
      updateShape,
      freqMod,
      dutyMod,
      syncLfos,
      clockDivMultIndex,
    ]
  )

  return content
}

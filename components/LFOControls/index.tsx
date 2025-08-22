import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import ReactSwitch from 'react-switch'
import { LFOParameters } from '@/tone/createLFO'
import LinearKnob from '@/components/LinearKnob'
import { gray, secondaryColor } from '@/app/globals'
import { clockDivMultOptions, numClockOptions } from '@/util/clock'
import { initState, updateLocalStorage } from '@/util/presets'
import styles from './index.module.css'

interface LFOControlsProps {
  init: LFOParameters
  lfo1?: boolean
  setFrequency: React.RefObject<null | ((hz: number) => void)>
  setDutyCycle: React.RefObject<null | ((d: number) => void)>
  freqMod: number
  dutyMod: number
  setShape: React.RefObject<null | ((s: 0 | 1) => void)>
  lfo1Freq: number
  setLfo1Freq: (freq: number) => void
  lfo1Phase?: React.RefObject<null | number>
  setPhase?: React.RefObject<null | ((phase: number) => void)>
  syncLfos?: boolean
  index: number
}

export default function LFOControls({
  init,
  lfo1,
  setFrequency,
  setDutyCycle,
  freqMod,
  dutyMod,
  setShape,
  lfo1Freq,
  setLfo1Freq,
  lfo1Phase,
  setPhase,
  syncLfos,
  index,
}: LFOControlsProps) {
  const [frequency, setLocalFrequency] = useState<number>(
    () => initState('freq', init.frequency, 'lfo' + index) as number
  )
  const frequencyRef = useRef<number>(frequency)
  const [moddedFreq, setModdedFreq] = useState<number>(frequency)
  const [clockDivMultIndex, setClockDivMultIndex] = useState<number>(
    () => initState('clockDivMultIndex', Math.floor(numClockOptions / 2), 'lfo' + index) as number
  )
  const clockDivMultRef = useRef<number>(clockDivMultIndex)
  const [dutyCycle, setLocalDutyCycle] = useState<number>(
    () => initState('dutyCycle', init.dutyCycle, 'lfo' + index) as number
  )
  const [moddedDutyCycle, setModdedDutyCycle] = useState<number>(dutyCycle)
  const [shape, setLocalShape] = useState<boolean>(() => initState('shape', !!init.shape, 'lfo' + index) as boolean)

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
      setModdedFreq(hzOrClockIndex)
    },
    [setFrequency, setLfo1Freq, lfo1, syncLfos, lfo1Freq]
  )

  // sync lfos 2 and 3 to lfo1 freq and phase when necessary
  const lfosPreviouslySunk = useRef(false)
  useEffect(() => {
    if (lfo1) return
    if (syncLfos) {
      lfosPreviouslySunk.current = true
      const clockDivMult = clockDivMultOptions[clockDivMultRef.current]
      const divMultFreq =
        clockDivMultRef.current < numClockOptions / 2 ? lfo1Freq / clockDivMult : lfo1Freq * clockDivMult
      setFrequency?.current?.(divMultFreq)

      // set phase to match lfo1 phase
      if (lfo1Phase && lfo1Phase?.current !== null) {
        setPhase?.current?.(lfo1Phase.current)
      }
    } else if (lfosPreviouslySunk.current) {
      setFrequency?.current?.(frequencyRef.current)
      lfosPreviouslySunk.current = false
    }
  }, [lfo1, lfo1Freq, syncLfos, setFrequency, setPhase, lfo1Phase])

  const updateDutyCycle = useCallback(
    (d: number) => {
      setDutyCycle?.current?.(d)
      setModdedDutyCycle(d)
    },
    [setDutyCycle]
  )

  const updateShape = useCallback(
    (s: boolean) => {
      setLocalShape(s)
      setShape?.current?.(s ? 1 : 0)
      updateLocalStorage('shape', s, 'lfo' + index)
    },
    [setShape, index]
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
            onChange={
              syncLfos
                ? (clockDivMultIndex) => {
                    setClockDivMultIndex(clockDivMultIndex)
                    updateLocalStorage('clockDivMultIndex', clockDivMultIndex, 'lfo' + index)
                  }
                : (localFrequency) => {
                    setLocalFrequency(localFrequency)
                    updateLocalStorage('freq', localFrequency, 'lfo' + index)
                  }
            }
            setModdedValue={updateFrequency}
            strokeColor={secondaryColor}
            taper={syncLfos ? undefined : 'log'}
            modVal={freqMod}
          />
          <p className={styles.lfoControlValue}>
            {syncLfos
              ? (clockDivMultIndex < numClockOptions / 2 - 1 ? '÷' : '×') + clockDivMultOptions[moddedFreq]
              : moddedFreq.toFixed(2) + ' Hz'}
          </p>
          <p className={styles.lfoControlLabel}>FREQ</p>
        </div>
        <div className={styles.lfoControl} style={{ marginLeft: -20 }}>
          <LinearKnob
            min={0}
            max={1}
            value={dutyCycle}
            onChange={(localDutyCycle) => {
              setLocalDutyCycle(localDutyCycle)
              updateLocalStorage('dutyCycle', localDutyCycle, 'lfo' + index)
            }}
            setModdedValue={updateDutyCycle}
            strokeColor={secondaryColor}
            modVal={dutyMod}
            defaultValue={0.5}
          />
          <p className={styles.lfoControlValue}>{(moddedDutyCycle * 100).toFixed(0) + '%'}</p>
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
      index,
      moddedFreq,
      moddedDutyCycle,
    ]
  )

  return content
}

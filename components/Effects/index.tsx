import React, { useState, useCallback, useMemo } from 'react'
import cn from 'classnames'
import { useGesture } from '@use-gesture/react'
import * as Tone from 'tone'
import LinearKnob from '../LinearKnob'
import { secondaryColor } from '@/app/globals'
import { constrain } from '@/util/math'
import { initState, updateLocalStorage } from '@/util/presets'
import styles from './index.module.css'

interface EffectsProps {
  delay: React.RefObject<Tone.FeedbackDelay | null>
  filter: React.RefObject<Tone.Filter | null>
  distortion: React.RefObject<Tone.Distortion | null>
  reverb: React.RefObject<Tone.Reverb | null>
  distMod: number
  lpfMod: number
  dlyTimeMod: number
  playing: boolean
}

const FILTER_MAX = 15000
const FILTER_MIN = 20
const MIN_DELAY = 0.001
const MAX_DELAY = 1
const MAX_RESONANCE = 30

export const DEFAULT_DIST = 0.75
export const DEFAULT_LPF = 2000
export const DEFAULT_RESONANCE = 15
export const DEFAULT_DLY = 0.15
export const DEFAULT_DLY_TIME = 0.0093
export const DEFAULT_DLY_FDBK = 0.85
export const DEFAULT_REVERB = 0.5

export default function Effects({
  delay,
  filter,
  distortion,
  reverb,
  distMod,
  lpfMod,
  dlyTimeMod,
  playing,
}: EffectsProps) {
  const [distortionAmount, setDistortionAmount] = useState<number>(
    () => initState('distortionAmount', DEFAULT_DIST, 'fx') as number
  )
  const [filterCutoff, setFilterCutoff] = useState<number>(() => initState('lpfCutoff', DEFAULT_LPF, 'fx') as number)
  const [filterResonance, setFilterResonance] = useState<number>(
    () => initState('lpfResonance', DEFAULT_RESONANCE, 'fx') as number
  )
  const [delayAmount, setDelayAmount] = useState<number>(() => initState('delayAmount', DEFAULT_DLY, 'fx') as number)
  const [delayTime, setDelayTime] = useState<number>(() => initState('delayTime', DEFAULT_DLY_TIME, 'fx') as number)
  const [delayFeedback, setDelayFeedback] = useState<number>(
    () => initState('delayFeedback', DEFAULT_DLY_FDBK, 'fx') as number
  )
  const [reverbAmount, setReverbAmount] = useState<number>(
    () => initState('reverbAmount', DEFAULT_REVERB, 'fx') as number
  )

  // sync ui and fx

  const updateDistortionAmount = useCallback(
    (value: number) => {
      distortion.current?.set({ distortion: value })
    },
    [distortion]
  )

  const updateFilterCutoff = useCallback(
    (value: number) => {
      filter.current?.set({ frequency: value })
    },
    [filter]
  )

  const updateFilterResonance = useCallback(
    (value: number) => {
      setFilterResonance(value)
      filter.current?.set({ Q: value })
      updateLocalStorage('lpfResonance', value, 'fx')
    },
    [filter]
  )

  const updateDelayAmount = useCallback(
    (value: number) => {
      setDelayAmount(value)
      delay.current?.set({ wet: value })
      updateLocalStorage('delayAmount', value, 'fx')
    },
    [delay]
  )

  const updateDelayTime = useCallback(
    (value: number) => {
      delay.current?.set({ delayTime: value })
    },
    [delay]
  )

  const updateDelayFeedback = useCallback(
    (value: number) => {
      setDelayFeedback(value)
      delay.current?.set({ feedback: value })
      updateLocalStorage('delayFeedback', value, 'fx')
    },
    [delay]
  )

  const reverbDrag = useGesture({
    onDrag: ({ delta: [dx, dy] }) => {
      const delta = (dx - dy) / 75
      const wet = constrain(reverbAmount + delta, 0.001, 1)
      setReverbAmount(wet)
      reverb.current?.set({ wet })
      updateLocalStorage('reverbAmount', wet, 'fx')
    },
  })

  const content = useMemo(
    () => (
      <div className={cn(styles.effectsContainer, { [styles.active]: playing })}>
        <p className={styles.fxLabel}>FX</p>
        <div className={styles.effectsRow}>
          <LinearKnob
            min={0}
            max={1}
            value={distortionAmount}
            onChange={(distortionAmount) => {
              setDistortionAmount(distortionAmount)
              updateLocalStorage('distortionAmount', distortionAmount, 'fx')
            }}
            setModdedValue={updateDistortionAmount}
            label="Dist"
            modVal={distMod}
            strokeColor={secondaryColor}
          />
          <div className={styles.effectSpacer}></div>
          <LinearKnob
            min={FILTER_MIN}
            max={FILTER_MAX}
            value={filterCutoff}
            onChange={(filterCutoff) => {
              setFilterCutoff(filterCutoff)
              updateLocalStorage('lpfCutoff', filterCutoff, 'fx')
            }}
            setModdedValue={updateFilterCutoff}
            label="LPF"
            taper="log"
            modVal={lpfMod}
            strokeColor={secondaryColor}
          />
          <div className={styles.effectSpacer}></div>
          <LinearKnob
            min={0}
            max={1}
            value={delayAmount}
            onChange={updateDelayAmount}
            label="Delay"
            strokeColor={secondaryColor}
          />
        </div>
        <div className={styles.effectsRow}>
          <LinearKnob
            min={0}
            max={MAX_RESONANCE}
            value={filterResonance}
            onChange={updateFilterResonance}
            label="Reso"
            strokeColor={secondaryColor}
          />
          <div className={styles.effectSpacer}></div>
          <LinearKnob
            min={MIN_DELAY}
            max={MAX_DELAY}
            value={delayTime}
            onChange={(delayTime) => {
              setDelayTime(delayTime)
              updateLocalStorage('delayTime', delayTime, 'fx')
            }}
            setModdedValue={updateDelayTime}
            label="Time"
            taper="log"
            modVal={dlyTimeMod}
            strokeColor={secondaryColor}
          />
          <div className={styles.miniSpacer}></div>
          <LinearKnob
            min={0}
            max={1}
            value={delayFeedback}
            onChange={updateDelayFeedback}
            label="Feedback"
            strokeColor={secondaryColor}
          />
        </div>
        <div className={styles.reverbContainer}>
          <p>Verb</p>
          <div className={styles.reverbControlContainer} {...reverbDrag()}>
            <div className={styles.reverbControl} style={{ width: reverbAmount * 100 + '%' }}></div>
          </div>
        </div>
      </div>
    ),
    [
      delayAmount,
      delayFeedback,
      delayTime,
      distortionAmount,
      filterCutoff,
      filterResonance,
      updateDelayAmount,
      updateDelayFeedback,
      updateDelayTime,
      updateDistortionAmount,
      updateFilterCutoff,
      updateFilterResonance,
      distMod,
      lpfMod,
      dlyTimeMod,
      reverbAmount,
      reverbDrag,
    ]
  )

  return content
}

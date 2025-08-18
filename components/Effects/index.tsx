import React, { useState, useCallback, useMemo } from 'react'
import { useGesture } from '@use-gesture/react'
import * as Tone from 'tone'
import LinearKnob from '../LinearKnob'
import { constrain } from '@/util/math'
import styles from './index.module.css'

interface EffectsProps {
  delay: React.RefObject<Tone.FeedbackDelay | null>
  filter: React.RefObject<Tone.Filter | null>
  distortion: React.RefObject<Tone.Distortion | null>
  reverb: React.RefObject<Tone.Reverb | null>
  distMod: number
  lpfMod: number
  dlyTimeMod: number
}

const FILTER_MAX = 15000
const FILTER_MIN = 20
const MIN_DELAY = 0.001
const MAX_DELAY = 1
const MAX_RESONANCE = 30

export const DEFAULT_DIST = 0.25
export const DEFAULT_LPF = 2000
export const DEFAULT_RESONANCE = 10
export const DEFAULT_DLY = 0.2
export const DEFAULT_DLY_TIME = 0.0093
export const DEFAULT_DLY_FDBK = 0.85
export const DEFAULT_REVERB = 0.25

export default function Effects({ delay, filter, distortion, reverb, distMod, lpfMod, dlyTimeMod }: EffectsProps) {
  const [distortionAmount, setDistortionAmount] = useState(DEFAULT_DIST)
  const [filterCutoff, setFilterCutoff] = useState(DEFAULT_LPF)
  const [filterResonance, setFilterResonance] = useState(DEFAULT_RESONANCE)
  const [delayAmount, setDelayAmount] = useState(DEFAULT_DLY)
  const [delayTime, setDelayTime] = useState(DEFAULT_DLY_TIME)
  const [delayFeedback, setDelayFeedback] = useState(DEFAULT_DLY_FDBK)
  const [reverbAmount, setReverbAmount] = useState(DEFAULT_REVERB)

  // sync ui and fx

  const updateDistortionAmount = useCallback(
    (value: number) => {
      distortion.current?.set({
        distortion: value,
      })
    },
    [distortion]
  )

  const updateFilterCutoff = useCallback(
    (value: number) => {
      filter.current?.set({
        frequency: value,
      })
    },
    [filter]
  )

  const updateFilterResonance = useCallback(
    (value: number) => {
      setFilterResonance(value)
      filter.current?.set({
        Q: value,
      })
    },
    [filter]
  )

  const updateDelayAmount = useCallback(
    (value: number) => {
      setDelayAmount(value)
      delay.current?.set({
        wet: value,
      })
    },
    [delay]
  )

  const updateDelayTime = useCallback(
    (value: number) => {
      delay.current?.set({
        delayTime: value,
      })
    },
    [delay]
  )

  const updateDelayFeedback = useCallback(
    (value: number) => {
      setDelayFeedback(value)
      delay.current?.set({
        feedback: value,
      })
    },
    [delay]
  )

  const reverbDrag = useGesture({
    onDrag: ({ delta: [x] }) => {
      console.log(x)
      const wet = constrain(reverbAmount + x / 50, 0.001, 1)
      setReverbAmount(wet)
      reverb.current?.set({ wet })
    },
  })

  const content = useMemo(
    () => (
      <div className={styles.effectsContainer}>
        <p className={styles.fxLabel}>FX</p>
        <div className={styles.effectsRow}>
          <LinearKnob
            min={0}
            max={1}
            value={distortionAmount}
            onChange={setDistortionAmount}
            setModdedValue={updateDistortionAmount}
            label="Dist"
            modVal={distMod}
          />
          <div className={styles.effectSpacer}></div>
          <LinearKnob
            min={FILTER_MIN}
            max={FILTER_MAX}
            value={filterCutoff}
            onChange={setFilterCutoff}
            setModdedValue={updateFilterCutoff}
            label="LPF"
            taper="log"
            modVal={lpfMod}
          />
          <div className={styles.effectSpacer}></div>
          <LinearKnob min={0} max={1} value={delayAmount} onChange={updateDelayAmount} label="Delay" />
        </div>
        <div className={styles.effectsRow}>
          <LinearKnob
            min={0}
            max={MAX_RESONANCE}
            value={filterResonance}
            onChange={updateFilterResonance}
            label="Reso"
          />
          <div className={styles.effectSpacer}></div>
          <LinearKnob
            min={MIN_DELAY}
            max={MAX_DELAY}
            value={delayTime}
            onChange={setDelayTime}
            setModdedValue={updateDelayTime}
            label="Time"
            taper="log"
            modVal={dlyTimeMod}
          />
          <div className={styles.miniSpacer}></div>
          <LinearKnob min={0} max={1} value={delayFeedback} onChange={updateDelayFeedback} label="Feedback" />
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

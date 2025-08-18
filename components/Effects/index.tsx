import React, { useState, useCallback, useMemo } from 'react'
import * as Tone from 'tone'
import LinearKnob from '../LinearKnob'
import styles from './index.module.css'

interface EffectsProps {
  delay: React.RefObject<Tone.FeedbackDelay | null>
  filter: React.RefObject<Tone.Filter | null>
  distortion: React.RefObject<Tone.Distortion | null>
  distMod: number
  lpfMod: number
  dlyTimeMod: number
}

export const FILTER_MAX = 15000
const FILTER_MIN = 20
const MIN_DELAY = 0.001
const MAX_DELAY = 1
const MAX_RESONANCE = 30

export default function Effects({ delay, filter, distortion, distMod, lpfMod, dlyTimeMod }: EffectsProps) {
  const [distortionAmount, setDistortionAmount] = useState(0.3)
  const [filterCutoff, setFilterCutoff] = useState(2000)
  const [filterResonance, setFilterResonance] = useState(10)
  const [delayAmount, setDelayAmount] = useState(0.2)
  const [delayTime, setDelayTime] = useState(MIN_DELAY)
  const [delayFeedback, setDelayFeedback] = useState(0.85)

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
    ]
  )

  return content
}

'use client'

import { CSSProperties as CSS, useState, useCallback, useEffect, useMemo } from 'react'
import Image from 'next/image'
import * as Tone from 'tone'
import cn from 'classnames'
import getNativeContext from '@/util/getNativeContext'
import { primaryColor, secondaryColor } from './globals'
import { LFOParameters } from '@/tone/createLFO'
import { midiNoteNumberToNoteName } from '@/util/midi'
import { constrain } from '@/util/math'
import useLambStore from '@/app/state'
import Voice, { ScaleName, scales, minPitch, maxPitch } from '@/components/Voice'
import BinaryTree from '@/components/BinaryTree'
import LFOScope from '@/components/LFOScope'
import LFOControls from '@/components/LFOControls'
import LinearKnob from '@/components/LinearKnob'
import Sequencer from '@/components/Sequencer'
import useLFO from '@/hooks/useLFO'
import styles from './page.module.css'

const lfo1Default: LFOParameters = { frequency: 1, dutyCycle: 0.25, shape: 1 }
const lfo2Default: LFOParameters = { frequency: 0.5, dutyCycle: 0.25, shape: 0 }
const lfo3Default: LFOParameters = { frequency: 2, dutyCycle: 0.5, shape: 1 }

const scaleOptions = Object.keys(scales)
const musicNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export default function LAMBApp() {
  const [initialized, setInitialized] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [sequencerValue, setSequencerValue] = useState(0)

  const lfo1Freq = useLambStore((state) => state.lfo1Freq)

  const [pitch1, setPitch1] = useState(12)
  const [pitch2, setPitch2] = useState(24)
  const [pitch3, setPitch3] = useState(36)
  const [pitch4, setPitch4] = useState(48)

  const [transpose, setTranspose] = useState(0)
  const [scale, setScale] = useState(0)

  const {
    value: lfo1,
    setFrequency: setLfo1Frequency,
    setDuty: setLfo1Duty,
    setShape: setLfo1Shape,
    phase: lfo1Phase,
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

  const content = useMemo(
    () => (
      <div
        className={styles.page}
        style={{ '--primary-color': primaryColor, '--secondary-color': secondaryColor } as CSS}>
        {/* main binary tree graph */}
        <BinaryTree lfo1={lfo1} lfo2={lfo2} lfo3={lfo3} allOn={!playing} />

        {/* voices */}
        <div className={styles.voices}>
          <div className={styles.voiceContainer} style={{ marginRight: 268 }}>
            <Voice pitch={pitch1} setPitch={setPitch1} scale={scaleOptions[scale] as ScaleName} />
          </div>
          <div className={styles.voiceContainer}>
            <Voice pitch={pitch2} setPitch={setPitch2} scale={scaleOptions[scale] as ScaleName} />
          </div>
          <div className={styles.voiceContainer}>
            <Voice pitch={pitch3} setPitch={setPitch3} scale={scaleOptions[scale] as ScaleName} />
          </div>
          <div className={styles.voiceContainer}>
            <Voice pitch={pitch4} setPitch={setPitch4} scale={scaleOptions[scale] as ScaleName} />
          </div>
        </div>

        {/* info overlay */}
        <div className={styles.infoLayer}>
          {/* header */}
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
            <Image src="/manberg-red.png" alt="Manberg Logo" width={141.84} height={40} style={{ marginTop: -4 }} />
          </div>

          {/* main LFO controls */}
          <div className={styles.lfoControls}>
            <div className={cn(styles.lfoControl, styles.hide, { [styles.active]: playing })}>
              <LFOScope value={lfo1} />
              <LFOControls
                init={lfo1Default}
                setFrequency={setLfo1Frequency}
                setDutyCycle={setLfo1Duty}
                setShape={setLfo1Shape}
                lfo1
              />
            </div>
            <div
              className={cn(styles.lfoControl, styles.hide, { [styles.active]: playing })}
              style={{ marginRight: 100 }}>
              <LFOScope value={lfo2} />
              <LFOControls
                init={lfo2Default}
                setFrequency={setLfo2Frequency}
                setDutyCycle={setLfo2Duty}
                setShape={setLfo2Shape}
              />
            </div>
            <div
              className={cn(styles.lfoControl, styles.hide, { [styles.active]: playing })}
              style={{ marginRight: 197 }}>
              <LFOScope value={lfo3} />
              <LFOControls
                init={lfo3Default}
                setFrequency={setLfo3Frequency}
                setDutyCycle={setLfo3Duty}
                setShape={setLfo3Shape}
              />
            </div>
          </div>

          {/* voice controls */}
          <div className={cn(styles.voiceAux, styles.hide, { [styles.active]: playing })}>
            <div className={styles.voiceAuxControl} style={{ marginRight: 270 }}>
              <p>{midiNoteNumberToNoteName(constrain(pitch1 + transpose, minPitch, maxPitch))}</p>
            </div>
            <div className={styles.voiceAuxControl}>
              <p>{midiNoteNumberToNoteName(constrain(pitch2 + transpose, minPitch, maxPitch))}</p>
            </div>
            <div className={styles.voiceAuxControl}>
              <p>{midiNoteNumberToNoteName(constrain(pitch3 + transpose, minPitch, maxPitch))}</p>
            </div>
            <div className={styles.voiceAuxControl}>
              <p>{midiNoteNumberToNoteName(constrain(pitch4 + transpose, minPitch, maxPitch))}</p>
              <div className={styles.voiceGlobalControls}>
                <div className={styles.voiceGlobalControl}>
                  <LinearKnob
                    min={0}
                    max={11}
                    step={1}
                    value={transpose}
                    onChange={setTranspose}
                    strokeColor={secondaryColor}
                  />
                  <p>
                    root:
                    <br />
                    {musicNotes[transpose]}
                  </p>
                </div>
                <div className={styles.voiceGlobalControl}>
                  <LinearKnob
                    min={0}
                    max={scaleOptions.length - 1}
                    step={1}
                    value={scale}
                    onChange={setScale}
                    strokeColor={secondaryColor}
                  />
                  <p>
                    scale:
                    <br />
                    {scaleOptions[scale]}
                  </p>
                </div>
                <svg className={styles.voiceGlobalControlDivider} width="60" height="40">
                  <line x1="0" y1="20" x2="60" y2="20" stroke={secondaryColor} strokeWidth="2" />
                  <line x1="59" y1="0" x2="59" y2="40" stroke={secondaryColor} strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>

          {/* sequencer */}
          <div className={cn(styles.sequencerContainer, styles.hide, { [styles.active]: playing })}>
            <Sequencer setSequencerValue={setSequencerValue} initialized={initialized} lfo1Phase={lfo1Phase} />
          </div>
        </div>
      </div>
    ),
    [
      initialized,
      lfo1,
      lfo1Phase,
      lfo2,
      lfo3,
      pitch1,
      pitch2,
      pitch3,
      pitch4,
      playStop,
      playing,
      scale,
      setLfo1Duty,
      setLfo1Frequency,
      setLfo1Shape,
      setLfo2Duty,
      setLfo2Frequency,
      setLfo2Shape,
      setLfo3Duty,
      setLfo3Frequency,
      setLfo3Shape,
      transpose,
    ]
  )

  return content
}

'use client'

import { CSSProperties as CSS, useState, useCallback, useEffect, useMemo } from 'react'
import Image from 'next/image'
import * as Tone from 'tone'
import cn from 'classnames'
import ReactSwitch from 'react-switch'
import getNativeContext from '@/util/getNativeContext'
import { primaryColor, secondaryColor, gray } from './globals'
import { LFOParameters } from '@/tone/createLFO'
import { midiNoteNumberToNoteName } from '@/util/midi'
import { constrain } from '@/util/math'
import useLFO from '@/hooks/useLFO'
import useFlicker from '@/hooks/useFlicker'
import useLambStore from '@/app/state'
import Voice, { ScaleName, scales, minPitch, maxPitch } from '@/components/Voice'
import BinaryTree from '@/components/BinaryTree'
import LFOScope from '@/components/LFOScope'
import LFOControls from '@/components/LFOControls'
import LinearKnob from '@/components/LinearKnob'
import Sequencer from '@/components/Sequencer'
import ModMatrix from '@/components/ModMatrix'
import TiltContainer from '@/components/TiltContainer'
import styles from './page.module.css'

const lfo1Default: LFOParameters = { frequency: 1, dutyCycle: 0.25, shape: 1 }
const lfo2Default: LFOParameters = { frequency: 0.5, dutyCycle: 0.25, shape: 0 }
const lfo3Default: LFOParameters = { frequency: 2, dutyCycle: 0.5, shape: 1 }

const scaleOptions = Object.keys(scales)
const musicNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export default function LAMBApp() {
  const [initialized, setInitialized] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [modOff, setModOff] = useState(false)

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

  // modulation
  const [sequencerValue, setSequencerValue] = useState(0)
  const [auxLfoFreq, setAuxLfoFreq] = useState(1)
  const [auxLfoShape, setLocalAuxLfoShape] = useState(true)

  const {
    value: auxLfo,
    setFrequency: setAuxLfoFrequency,
    setShape: setAuxLfoShape,
  } = useLFO(initialized, { frequency: auxLfoFreq, shape: auxLfoShape ? 1 : 0, dutyCycle: 0.5 } as LFOParameters)

  const updateAuxLfoShape = useCallback(
    (newShape: boolean) => {
      setLocalAuxLfoShape(newShape)
      setAuxLfoShape?.current?.(newShape ? 1 : 0)
    },
    [setAuxLfoShape]
  )

  const updateAuxLfoFreq = useCallback(
    (hz: number) => {
      setAuxLfoFreq(hz)
      setAuxLfoFrequency?.current?.(hz)
    },
    [setAuxLfoFrequency]
  )

  // apply modulation
  const modMatrix = useLambStore((state) => state.modMatrix)

  const modVal = useCallback(
    (sourceIndex: number) => {
      if (modOff) return 0

      const modSources = [lfo1, lfo2, lfo3, sequencerValue, auxLfo]
      return modSources.reduce(
        (acc, source, destinationIndex) => acc + (source - 0.5) * modMatrix[sourceIndex][destinationIndex],
        0
      )
    },
    [modMatrix, modOff, lfo1, lfo2, lfo3, auxLfo, sequencerValue]
  )

  // flicker effect
  const { opacity: flicker1 } = useFlicker(playing)
  const { opacity: flicker2 } = useFlicker(playing)
  const { opacity: flicker3 } = useFlicker(playing)
  const { opacity: flicker4 } = useFlicker(playing)
  const { opacity: flicker5 } = useFlicker(playing)

  const content = useMemo(
    () => (
      <div
        className={styles.page}
        style={{ '--primary-color': primaryColor, '--secondary-color': secondaryColor, '--gray': gray } as CSS}>
        {/* main binary tree graph */}
        <TiltContainer maxTilt={1} perspective={900}>
          <BinaryTree lfo1={lfo1} lfo2={lfo2} lfo3={lfo3} allOn={!playing} />

          {/* voices */}
          <div className={styles.voices}>
            <div className={styles.voiceContainer} style={{ marginRight: 268 }}>
              <Voice pitch={pitch1} setPitch={setPitch1} scale={scaleOptions[scale] as ScaleName} modVal={modVal(6)} />
            </div>
            <div className={styles.voiceContainer}>
              <Voice pitch={pitch2} setPitch={setPitch2} scale={scaleOptions[scale] as ScaleName} modVal={modVal(7)} />
            </div>
            <div className={styles.voiceContainer}>
              <Voice pitch={pitch3} setPitch={setPitch3} scale={scaleOptions[scale] as ScaleName} modVal={modVal(8)} />
            </div>
            <div className={styles.voiceContainer}>
              <Voice pitch={pitch4} setPitch={setPitch4} scale={scaleOptions[scale] as ScaleName} modVal={modVal(9)} />
            </div>
          </div>
        </TiltContainer>

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

          <TiltContainer maxTilt={0.5} perspective={900}>
            <div className={cn(styles.infoBody, { [styles.playing]: playing })}>
              {/* main LFO controls */}
              <div className={styles.lfoControls}>
                <div className={cn(styles.lfoControl, { [styles.active]: playing })} style={{ opacity: flicker1 }}>
                  <LFOScope value={lfo1} />
                  <LFOControls
                    init={lfo1Default}
                    setFrequency={setLfo1Frequency}
                    setDutyCycle={setLfo1Duty}
                    setShape={setLfo1Shape}
                    lfo1
                    freqMod={modVal(0)}
                    dutyMod={modVal(1)}
                  />
                </div>
                <div
                  className={cn(styles.lfoControl, { [styles.active]: playing })}
                  style={{ marginRight: 100, opacity: flicker2 }}>
                  <LFOScope value={lfo2} />
                  <LFOControls
                    init={lfo2Default}
                    setFrequency={setLfo2Frequency}
                    setDutyCycle={setLfo2Duty}
                    setShape={setLfo2Shape}
                    freqMod={modVal(2)}
                    dutyMod={modVal(3)}
                  />
                </div>
                <div
                  className={cn(styles.lfoControl, { [styles.active]: playing })}
                  style={{ marginRight: 197, opacity: flicker3 }}>
                  <LFOScope value={lfo3} />
                  <LFOControls
                    init={lfo3Default}
                    setFrequency={setLfo3Frequency}
                    setDutyCycle={setLfo3Duty}
                    setShape={setLfo3Shape}
                    freqMod={modVal(4)}
                    dutyMod={modVal(5)}
                  />
                </div>
              </div>

              {/* voice controls */}
              <div className={cn(styles.voiceAux, { [styles.active]: playing })} style={{ opacity: flicker4 }}>
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

              {/* modulation */}
              <div
                className={cn(styles.modulationContainer, {
                  [styles.active]: playing,
                  [styles.bypassed]: modOff,
                })}>
                <Sequencer
                  setSequencerValue={setSequencerValue}
                  initialized={initialized}
                  lfo1Phase={lfo1Phase}
                  playing={playing}
                />

                <div className={styles.horizontalDivider} style={{ marginTop: -18, opacity: flicker5 }}></div>

                <div className={styles.auxLfoContainer} style={{ opacity: flicker5 }}>
                  <p>LFO4</p>

                  <div className={styles.auxLfoControl}>
                    <LinearKnob
                      min={0.1}
                      max={10}
                      value={auxLfoFreq}
                      onChange={updateAuxLfoFreq}
                      strokeColor={secondaryColor}
                      taper="log"
                    />
                    <p className={styles.auxLfoFreq}>{auxLfoFreq.toFixed(2)} Hz</p>
                  </div>

                  <div className={styles.auxLfoIndicator} style={{ opacity: auxLfo * 0.7 + 0.3 }}></div>
                </div>

                <div className={styles.shapeControl} style={{ opacity: flicker5 }}>
                  <svg width={14} height={14} viewBox="0 0 14 14">
                    <rect
                      x={0}
                      y={0}
                      width={14}
                      height={14}
                      stroke={auxLfoShape ? gray : secondaryColor}
                      strokeWidth={4}
                      fill="none"
                    />
                  </svg>
                  <ReactSwitch
                    onChange={updateAuxLfoShape}
                    checked={auxLfoShape}
                    uncheckedIcon={false}
                    checkedIcon={false}
                    width={48}
                    height={24}
                  />
                  <svg width={14} height={14} viewBox="0 0 14 14">
                    <polygon
                      points="7,1 13,13 1,13"
                      stroke={auxLfoShape ? secondaryColor : gray}
                      strokeWidth={2}
                      fill="none"
                    />
                  </svg>
                </div>

                <div
                  className={styles.horizontalDivider}
                  style={{ marginLeft: 190, marginTop: 30, width: 70, opacity: flicker5 }}></div>

                <div className={styles.modOff} style={{ opacity: flicker5 }}>
                  <p>MOD OFF</p>
                  <svg
                    className={styles.modOffToggle}
                    width="13"
                    height="13"
                    viewBox="0 0 13 13"
                    onClick={() => {
                      setModOff((modOff) => !modOff)
                    }}>
                    <line x1="0" y1="0" x2="13" y2="13" stroke={modOff ? secondaryColor : gray} strokeWidth="2" />
                    <line x1="13" y1="0" x2="0" y2="13" stroke={modOff ? secondaryColor : gray} strokeWidth="2" />
                  </svg>
                </div>

                {/* mod matrix */}
                <ModMatrix playing={playing} />
                <p className={styles.modMatrixLabel} style={{ opacity: flicker5 }}>
                  MOD MATRIX
                </p>
              </div>
            </div>
          </TiltContainer>
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
      auxLfoFreq,
      auxLfoShape,
      updateAuxLfoFreq,
      updateAuxLfoShape,
      auxLfo,
      modOff,
      flicker1,
      flicker2,
      flicker3,
      flicker4,
      flicker5,
      modVal,
    ]
  )

  return content
}

'use client'

import { CSSProperties as CSS, useState, useCallback, useEffect, useMemo, useRef } from 'react'
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
import useLambStore from '@/app/state'
import Voice, { ScaleName, scales, minPitch, maxPitch } from '@/components/Voice'
import BinaryTree from '@/components/BinaryTree'
import LFOScope from '@/components/LFOScope'
import LFOControls from '@/components/LFOControls'
import LinearKnob from '@/components/LinearKnob'
import Sequencer from '@/components/Sequencer'
import ModMatrix from '@/components/ModMatrix'
import TiltContainer from '@/components/TiltContainer'
import Checkbox from '@/components/Checkbox'
import styles from './page.module.css'

const lfo1Default: LFOParameters = { frequency: 1, dutyCycle: 0.25, shape: 1 }
const lfo2Default: LFOParameters = { frequency: 0.5, dutyCycle: 0.25, shape: 0 }
const lfo3Default: LFOParameters = { frequency: 2, dutyCycle: 0.5, shape: 1 }

const scaleOptions = Object.keys(scales)
const musicNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const BG_WIDTH = 2048 / 2
const BG_HEIGHT = 1328 / 2

export default function LAMBApp() {
  const [initialized, setInitialized] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [modOff, setModOff] = useState(false)
  const [syncLfos, setSyncLfos] = useState(false)
  const [solo2, setSolo2] = useState(false)
  const [solo3, setSolo3] = useState(false)
  const bgGraphicRef = useRef<SVGLinearGradientElement>(null)

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
    setPhase: setLfo2Phase,
  } = useLFO(initialized, lfo2Default)
  const {
    value: lfo3,
    setFrequency: setLfo3Frequency,
    setDuty: setLfo3Duty,
    setShape: setLfo3Shape,
    setPhase: setLfo3Phase,
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

  // update linear gradient on the background container when the mouse moves
  useEffect(() => {
    let rafId: number

    function mouseMoveHandler(e: MouseEvent) {
      if (!window) return
      if (rafId) cancelAnimationFrame(rafId)

      rafId = requestAnimationFrame(() => {
        if (!bgGraphicRef.current) return
        const { clientX, clientY } = e

        const maxStopOpacity = constrain(1 - clientY / window.innerHeight, 0.1, 0.3)
        bgGraphicRef.current.children[0].setAttribute(
          'stop-opacity',
          String((clientX / window.innerWidth) * maxStopOpacity)
        )
        bgGraphicRef.current.children[1].setAttribute(
          'stop-opacity',
          String((1 - clientX / window.innerWidth) * maxStopOpacity)
        )
      })
    }

    window.addEventListener('mousemove', mouseMoveHandler)
    return () => {
      window.removeEventListener('mousemove', mouseMoveHandler)
    }
  }, [])

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

  const showLfo1Controls = useMemo(() => playing && !solo2 && !solo3, [playing, solo2, solo3])
  const showLfo2Controls = useMemo(() => playing && !solo3, [playing, solo3])

  const pitch1Level = useMemo(() => (1 - lfo3) * (1 - lfo2) * (1 - lfo1), [lfo1, lfo2, lfo3])
  const pitch2Level = useMemo(() => lfo3 * (1 - lfo2) * (1 - lfo1), [lfo1, lfo2, lfo3])
  const pitch3Level = useMemo(() => lfo2 * (1 - lfo1), [lfo1, lfo2])

  const bgGraphic = useMemo(
    () => (
      <path
        className={cn(styles.bgClip, { [styles.active]: playing })}
        d="M686.3,108.6h354c5.1,0,9.8,2.7,12.4,7.1l6.7,11.6c2.6,4.4,7.3,7.1,12.4,7.1h157.4c5.1,0,9.8,2.7,12.4,7.1l14.5,25c2.6,4.4,7.3,7.1,12.4,7.1h395.8c5.1,0,9.8,2.7,12.4,7.1l15.7,27.1c1.3,2.2,1.9,4.7,1.9,7.2v32.4c0,2.5-.7,5-1.9,7.2l-17.9,30.8c-1.3,2.2-1.9,4.7-1.9,7.2v31.4c0,2.5.7,5,1.9,7.2l17.9,30.8c1.3,2.2,1.9,4.7,1.9,7.2v287.6c0,2.5-.7,5-1.9,7.2l-22.4,38.6c-2.6,4.4-7.3,7.1-12.4,7.1h-28.3c-5.1,0-9.8,2.7-12.4,7.1l-56,96.4c-2.6,4.4-7.3,7.1-12.4,7.1h-683.2c-5.1,0-9.8-2.7-12.4-7.1l-14.4-24.9c-2.6-4.4-7.3-7.1-12.4-7.1h-304.7c-5.1,0-9.8,2.7-12.4,7.1l-14.3,24.7c-2.6,4.4-7.3,7.1-12.3,7.1l-333.1.2c-5.1,0-9.8-2.7-12.4-7.1l-24.1-41.3c-1.3-2.2-1.9-4.7-1.9-7.2v-62.2c0-2.5-.7-5-1.9-7.2l-26.3-45.2c-2.6-4.4-7.3-7.1-12.4-7.1h-24.3c-5.1,0-9.8-2.7-12.4-7.1l-17.7-30.4c-1.3-2.2-1.9-4.7-1.9-7.2v-110.4c0-2.4.6-4.7,1.7-6.8h0c2.5-4.6,7.3-7.5,12.6-7.5h24c5.1,0,9.8-2.7,12.4-7.1l26.3-45.2c1.3-2.2,1.9-4.7,1.9-7.2v-61.6c0-2.5.7-5,1.9-7.2l19.8-34.1c2.6-4.4,7.3-7.1,12.4-7.1h24.2c5.1,0,9.8-2.7,12.4-7.1l26.3-45.2c1.3-2.2,1.9-4.7,1.9-7.2v-62.3c0-2.5.7-5,1.9-7.2l20-34.4c2.6-4.4,7.3-7.1,12.4-7.1h429.4c5.1,0,9.8-2.7,12.3-7.1l6.3-10.8c2.6-4.4,7.3-7.1,12.3-7.1Z"
      />
    ),
    [playing]
  )

  const content = useMemo(
    () => (
      <div
        className={styles.page}
        style={{ '--primary-color': primaryColor, '--secondary-color': secondaryColor, '--gray': gray } as CSS}>
        {/* background */}
        <Image
          className={styles.backgroundImage}
          src="/bg.jpg"
          alt="Background"
          width={BG_WIDTH}
          height={BG_HEIGHT}
          draggable="false"
        />

        {/* container graphic */}
        <TiltContainer maxTilt={1} perspective={700}>
          <div className={styles.containerGraphicContainer}>
            <svg
              className={cn(styles.containerGraphic, { [styles.active]: playing })}
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              version="1.1"
              viewBox="0 0 1728 958"
              width="1728"
              fill="url(#gradientContainer)"
              stroke="white"
              height="958">
              <defs>
                <clipPath id="shapeClip">{bgGraphic}</clipPath>

                <filter id="blurContainer" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="20" />
                </filter>

                <linearGradient id="gradientContainer" x1="0%" y1="0%" x2="0%" y2="100%" ref={bgGraphicRef}>
                  <stop offset="0%" stopColor="#fff" stopOpacity={0} />
                  <stop offset="50%" stopColor="#fff" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#fff" stopOpacity={0} />
                </linearGradient>
              </defs>

              <image
                href="/bg.jpg"
                x="0"
                y="0"
                width="1728"
                height="958"
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#shapeClip)"
                filter="url(#blurContainer)"
              />

              {bgGraphic}

              {/* divider lines */}
              <g className={cn(styles.dividerLines, { [styles.active]: playing })}>
                <line x1="118.6" y1="304" x2="608.2" y2="304" />
                <line x1="19.8" y1="473.4" x2="509.3" y2="473.4" />
                <line x1="37.8" y1="642.9" x2="410.4" y2="642.9" />
                <polyline points="1163.4 375.2 1412.1 375.2 1433.9 337.7 1433.9 301.8" />
                <line x1="1394" y1="531.4" x2="1253.6" y2="531.4" />
              </g>
            </svg>
          </div>
        </TiltContainer>

        {/* info overlay */}
        <div className={styles.infoLayer}>
          {/* header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <Image src="/logotype.png" alt="L-AMB Logo" width={289.36} height={40} />
              <Image
                className={styles.playStopButton}
                src={!playing ? '/play.svg' : '/stop.svg'}
                alt="Play/Stop Button"
                width={40}
                height={40}
                onClick={playStop}
              />
            </div>
            <Image src="/manberg.png" alt="Manberg Logo" width={141.84} height={40} style={{ marginTop: -4 }} />
          </div>

          <TiltContainer maxTilt={0.5} perspective={900}>
            <div className={cn(styles.infoBody, { [styles.active]: playing })}>
              {/* main LFO controls */}
              <div className={styles.lfoControls}>
                <div className={cn(styles.lfoControlContainer, { [styles.active]: showLfo1Controls })}>
                  <div className={styles.lfoControlHeader}>
                    <p>LFO1</p>
                    <div>
                      <Checkbox checked={syncLfos} onChange={setSyncLfos} label="SYNC" />
                    </div>
                  </div>
                  <div className={styles.lfoControl}>
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
                </div>
                <div
                  className={cn(styles.lfoControlContainer, { [styles.active]: showLfo2Controls })}
                  style={{ marginRight: 100 }}>
                  <div className={styles.lfoControlHeader}>
                    <p>LFO2</p>
                    <div>
                      <Checkbox checked={solo2} onChange={setSolo2} label="SOLO" />
                    </div>
                  </div>
                  <div className={styles.lfoControl}>
                    <LFOScope value={lfo2} />
                    <LFOControls
                      init={lfo2Default}
                      setFrequency={setLfo2Frequency}
                      setDutyCycle={setLfo2Duty}
                      setShape={setLfo2Shape}
                      freqMod={modVal(2)}
                      dutyMod={modVal(3)}
                      syncLfos={syncLfos}
                      lfo1Phase={lfo1Phase}
                      setPhase={setLfo2Phase}
                    />
                  </div>
                </div>
                <div
                  className={cn(styles.lfoControlContainer, { [styles.active]: playing })}
                  style={{ marginRight: 197 }}>
                  <div className={styles.lfoControlHeader}>
                    <p>LFO3</p>
                    <div>
                      <Checkbox checked={solo3} onChange={setSolo3} label="SOLO" />
                    </div>
                  </div>
                  <div className={styles.lfoControl}>
                    <LFOScope value={lfo3} />
                    <LFOControls
                      init={lfo3Default}
                      setFrequency={setLfo3Frequency}
                      setDutyCycle={setLfo3Duty}
                      setShape={setLfo3Shape}
                      freqMod={modVal(4)}
                      dutyMod={modVal(5)}
                      syncLfos={syncLfos}
                      lfo1Phase={lfo1Phase}
                      setPhase={setLfo3Phase}
                    />
                  </div>
                </div>
              </div>

              {/* voice controls */}
              <div className={cn(styles.voiceAux, { [styles.active]: playing })}>
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

                <div className={styles.horizontalDivider} style={{ marginTop: -18 }}></div>

                <div className={styles.auxLfoContainer}>
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

                <div className={styles.shapeControl}>
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

                <div className={styles.horizontalDivider} style={{ marginLeft: 190, marginTop: 30, width: 70 }}></div>

                <div className={styles.modOff}>
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
                <p className={styles.modMatrixLabel}>MOD MATRIX</p>
              </div>
            </div>
          </TiltContainer>
        </div>

        {/* main binary tree graph */}
        <TiltContainer maxTilt={1} perspective={900}>
          <BinaryTree lfo1={lfo1} lfo2={lfo2} lfo3={lfo3} allOn={!playing} solo2={solo2} solo3={solo3} />

          {/* voices */}
          <div className={cn(styles.voices, { [styles.active]: playing })}>
            <div className={styles.voiceContainer} style={{ marginRight: 268 }}>
              <Voice
                pitch={pitch1}
                setPitch={setPitch1}
                scale={scaleOptions[scale] as ScaleName}
                modVal={modVal(6)}
                level={pitch1Level}
                index={0}
              />
            </div>
            <div className={styles.voiceContainer}>
              <Voice
                pitch={pitch2}
                setPitch={setPitch2}
                scale={scaleOptions[scale] as ScaleName}
                modVal={modVal(7)}
                level={pitch2Level}
                index={1}
              />
            </div>
            <div className={styles.voiceContainer}>
              <Voice
                pitch={pitch3}
                setPitch={setPitch3}
                scale={scaleOptions[scale] as ScaleName}
                modVal={modVal(8)}
                level={pitch3Level}
                index={2}
              />
            </div>
            <div className={styles.voiceContainer}>
              <Voice
                pitch={pitch4}
                setPitch={setPitch4}
                scale={scaleOptions[scale] as ScaleName}
                modVal={modVal(9)}
                level={lfo1}
                index={3}
              />
            </div>
          </div>
        </TiltContainer>
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
      modVal,
      syncLfos,
      solo2,
      solo3,
      setLfo2Phase,
      setLfo3Phase,
      pitch1Level,
      pitch2Level,
      pitch3Level,
      bgGraphic,
      showLfo1Controls,
      showLfo2Controls,
    ]
  )

  return content
}

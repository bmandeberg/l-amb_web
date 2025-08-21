'use client'

import { CSSProperties as CSS, useState, useCallback, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import * as Tone from 'tone'
import cn from 'classnames'
import ReactSwitch from 'react-switch'
import getNativeContext from '@/util/getNativeContext'
import { primaryColor, secondaryColor, gray, screenWidth, screenHeight } from './globals'
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
import VoiceTypeSelector, { VoiceType } from '@/components/VoiceTypeSelector'
import Effects, {
  DEFAULT_DIST,
  DEFAULT_LPF,
  DEFAULT_RESONANCE,
  DEFAULT_DLY,
  DEFAULT_DLY_TIME,
  DEFAULT_DLY_FDBK,
  DEFAULT_REVERB,
} from '@/components/Effects'
import { initState, updateLocalStorage, copyPresetUrl } from '@/util/presets'
import styles from './page.module.css'

const lfo1Default: LFOParameters = {
  frequency: initState('freq', 1.71, 'lfo1') as number,
  dutyCycle: initState('dutyCycle', 0.25, 'lfo1') as number,
  shape: initState('shape', false, 'lfo1') ? 1 : 0,
}
const lfo2Default: LFOParameters = {
  frequency: initState('freq', 2.14, 'lfo2') as number,
  dutyCycle: initState('dutyCycle', 0.25, 'lfo2') as number,
  shape: initState('shape', false, 'lfo2') ? 1 : 0,
}
const lfo3Default: LFOParameters = {
  frequency: initState('freq', 4.43, 'lfo3') as number,
  dutyCycle: initState('dutyCycle', 0.5, 'lfo3') as number,
  shape: initState('shape', false, 'lfo3') ? 1 : 0,
}

const scaleOptions = Object.keys(scales)
const musicNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const BG_WIDTH = 2048 / 2
const BG_HEIGHT = 1328 / 2

const DEFAULT_WAVE = 'fatsawtooth' as VoiceType
const REVERB_DECAY = 3

export default function LAMBApp() {
  const [initialized, setInitialized] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [screenSizeRatio, setScreenSizeRatio] = useState(1)
  const [playing, setPlaying] = useState(false)
  const [modOff, setModOff] = useState<boolean>(() => initState('modOff', false) as boolean)
  const [syncLfos, setSyncLfos] = useState<boolean>(() => initState('syncLfos', false) as boolean)
  const [solo2, setSolo2] = useState<boolean>(() => initState('solo2', false) as boolean)
  const [solo3, setSolo3] = useState<boolean>(() => initState('solo3', false) as boolean)
  const bgGraphicRef = useRef<SVGLinearGradientElement>(null)

  const [transpose, setTranspose] = useState<number>(() => initState('transpose', 0) as number)
  const [scale, setScale] = useState<number>(() => initState('scale', 3) as number)

  const [pitch1, setPitch1] = useState<number>(() => initState('pitch', 48, 'voice1') as number)
  const [pitch2, setPitch2] = useState<number>(() => initState('pitch', 53, 'voice2') as number)
  const [pitch3, setPitch3] = useState<number>(() => initState('pitch', 56, 'voice3') as number)
  const [pitch4, setPitch4] = useState<number>(() => initState('pitch', 24, 'voice4') as number)
  const voiceARef = useRef<Tone.OmniOscillator<Tone.Oscillator> | null>(null)
  const voiceBRef = useRef<Tone.OmniOscillator<Tone.Oscillator> | null>(null)
  const voiceCRef = useRef<Tone.OmniOscillator<Tone.Oscillator> | null>(null)
  const voiceDRef = useRef<Tone.OmniOscillator<Tone.Oscillator> | null>(null)
  const [voiceAType, setVoiceAType] = useState<VoiceType>(() => initState('type', DEFAULT_WAVE, 'voice1') as VoiceType)
  const [voiceBType, setVoiceBType] = useState<VoiceType>(() => initState('type', DEFAULT_WAVE, 'voice2') as VoiceType)
  const [voiceCType, setVoiceCType] = useState<VoiceType>(() => initState('type', DEFAULT_WAVE, 'voice3') as VoiceType)
  const [voiceDType, setVoiceDType] = useState<VoiceType>(() => initState('type', DEFAULT_WAVE, 'voice4') as VoiceType)

  const pitch1NoteName = useMemo(
    () => midiNoteNumberToNoteName(constrain(pitch1 + transpose, minPitch, maxPitch)),
    [pitch1, transpose]
  )
  const pitch2NoteName = useMemo(
    () => midiNoteNumberToNoteName(constrain(pitch2 + transpose, minPitch, maxPitch)),
    [pitch2, transpose]
  )
  const pitch3NoteName = useMemo(
    () => midiNoteNumberToNoteName(constrain(pitch3 + transpose, minPitch, maxPitch)),
    [pitch3, transpose]
  )
  const pitch4NoteName = useMemo(
    () => midiNoteNumberToNoteName(constrain(pitch4 + transpose, minPitch, maxPitch)),
    [pitch4, transpose]
  )

  // update voice frequencies when pitches change
  useEffect(() => {
    if (voiceARef.current) voiceARef.current.frequency.value = pitch1NoteName
    if (voiceBRef.current) voiceBRef.current.frequency.value = pitch2NoteName
    if (voiceCRef.current) voiceCRef.current.frequency.value = pitch3NoteName
    if (voiceDRef.current) voiceDRef.current.frequency.value = pitch4NoteName
  }, [pitch1NoteName, pitch2NoteName, pitch3NoteName, pitch4NoteName])

  const lfo1Latch = useMemo(() => solo2 || solo3, [solo2, solo3])

  const {
    value: lfo1,
    setFrequency: setLfo1Frequency,
    setDuty: setLfo1Duty,
    setShape: setLfo1Shape,
    phase: lfo1Phase,
    node: lfo1Node,
  } = useLFO(initialized, lfo1Default, lfo1Latch)
  const {
    value: lfo2,
    setFrequency: setLfo2Frequency,
    setDuty: setLfo2Duty,
    setShape: setLfo2Shape,
    setPhase: setLfo2Phase,
    node: lfo2Node,
  } = useLFO(initialized, lfo2Default, solo3)
  const {
    value: lfo3,
    setFrequency: setLfo3Frequency,
    setDuty: setLfo3Duty,
    setShape: setLfo3Shape,
    setPhase: setLfo3Phase,
    node: lfo3Node,
  } = useLFO(initialized, lfo3Default)

  // fx
  const delay = useRef<Tone.FeedbackDelay | null>(null)
  const filter = useRef<Tone.Filter | null>(null)
  const distortion = useRef<Tone.Distortion | null>(null)
  const reverb = useRef<Tone.Reverb | null>(null)

  // init audio path and fx
  useEffect(() => {
    if (!initialized || !lfo3Node || !lfo2Node || !lfo1Node) return

    const voiceAGain = new Tone.Gain(0)
    voiceARef.current = new Tone.OmniOscillator({ volume: -8, frequency: pitch1NoteName, type: DEFAULT_WAVE })
      .connect(voiceAGain)
      .start()
    Tone.connect(lfo3Node, new Tone.Subtract(1).connect(new Tone.Pow(2).connect(voiceAGain.gain)))

    const voiceBGain = new Tone.Gain(0)
    voiceBRef.current = new Tone.OmniOscillator({ volume: -8, frequency: pitch2NoteName, type: DEFAULT_WAVE })
      .connect(voiceBGain)
      .start()
    Tone.connect(lfo3Node, new Tone.Pow(2).connect(voiceBGain.gain))

    const voiceABGain = new Tone.Gain(0)
    voiceAGain.connect(voiceABGain)
    voiceBGain.connect(voiceABGain)
    Tone.connect(lfo2Node, new Tone.Subtract(1).connect(new Tone.Pow(2).connect(voiceABGain.gain)))

    const voiceCGain = new Tone.Gain(0)
    voiceCRef.current = new Tone.OmniOscillator({ volume: -8, frequency: pitch3NoteName, type: DEFAULT_WAVE })
      .connect(voiceCGain)
      .start()
    Tone.connect(lfo2Node, new Tone.Pow(2).connect(voiceCGain.gain))

    const voiceABCGain = new Tone.Gain(0)
    voiceABGain.connect(voiceABCGain)
    voiceCGain.connect(voiceABCGain)
    Tone.connect(lfo1Node, new Tone.Subtract(1).connect(new Tone.Pow(2).connect(voiceABCGain.gain)))

    const voiceDGain = new Tone.Gain(0)
    voiceDRef.current = new Tone.OmniOscillator({ volume: -8, frequency: pitch4NoteName, type: DEFAULT_WAVE })
      .connect(voiceDGain)
      .start()
    Tone.connect(lfo1Node, new Tone.Pow(2).connect(voiceDGain.gain))

    // fx
    reverb.current = new Tone.Reverb(REVERB_DECAY).toDestination()
    reverb.current.set({ wet: DEFAULT_REVERB })
    delay.current = new Tone.FeedbackDelay(DEFAULT_DLY_TIME, DEFAULT_DLY_FDBK).connect(reverb.current)
    delay.current.set({ wet: DEFAULT_DLY })
    filter.current = new Tone.Filter(DEFAULT_LPF, 'lowpass').connect(delay.current)
    filter.current.set({ Q: DEFAULT_RESONANCE })
    distortion.current = new Tone.Distortion(DEFAULT_DIST).connect(filter.current)

    voiceABCGain.connect(distortion.current)
    voiceDGain.connect(distortion.current)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, lfo3Node, lfo2Node, lfo1Node])

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

  // play/stop on spacebar
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

  // resize window
  useEffect(() => {
    function handleResize() {
      if (!window) return

      setScreenSizeRatio(window.innerWidth / screenWidth)
    }

    // run once on startup
    handleResize()
    setMounted(true)

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // modulation
  const [sequencerValue, setSequencerValue] = useState(0)
  const [auxLfoFreq, setAuxLfoFreq] = useState<number>(() => initState('freq', 0.1, 'auxLfo') as number)
  const [auxLfoShape, setLocalAuxLfoShape] = useState<boolean>(() => initState('shape', true, 'auxLfo') as boolean)

  const {
    value: auxLfo,
    setFrequency: setAuxLfoFrequency,
    setShape: setAuxLfoShape,
  } = useLFO(initialized, { frequency: auxLfoFreq, shape: auxLfoShape ? 1 : 0, dutyCycle: 0.5 } as LFOParameters)

  const updateAuxLfoShape = useCallback(
    (newShape: boolean) => {
      setLocalAuxLfoShape(newShape)
      setAuxLfoShape?.current?.(newShape ? 1 : 0)
      updateLocalStorage('shape', newShape, 'auxLfo')
    },
    [setAuxLfoShape]
  )

  const updateAuxLfoFreq = useCallback(
    (hz: number) => {
      setAuxLfoFreq(hz)
      setAuxLfoFrequency?.current?.(hz)
      updateLocalStorage('freq', hz, 'auxLfo')
    },
    [setAuxLfoFrequency]
  )

  // apply modulation
  const modMatrix = useLambStore((state) => state.modMatrix)

  const modVal = useCallback(
    (destinationIndex: number) => {
      if (modOff) return 0

      const modSources = [lfo1, lfo2, lfo3, sequencerValue, auxLfo]
      return modSources.reduce(
        (acc, source, sourceIndex) => acc + (source - 0.5) * modMatrix[destinationIndex][sourceIndex],
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
        className={cn(styles.page, { [styles.loaded]: mounted })}
        style={
          {
            '--primary-color': primaryColor,
            '--secondary-color': secondaryColor,
            '--gray': gray,
            '--screen-width': screenWidth + 'px',
            '--screen-height': screenHeight + 'px',
            '--transition-time': '0.25s',
            transform: `scale(${screenSizeRatio})`,
          } as CSS
        }>
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
                y="-20"
                width="1728"
                height="958"
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#shapeClip)"
                filter="url(#blurContainer)"
              />

              {/* frame graphics */}
              <g className={cn(styles.frameGraphics, { [styles.open]: playing })}>
                <path d="M1672.4,288.7h1.2c5,0,9.6-2.7,12.1-7l14.6-25.1c1.2-2.1,1.9-4.6,1.9-7v-36.9c0-2.5-.7-4.9-1.9-7l-19.2-33.1c-2.5-4.3-7.1-7-12.1-7h-32.2c-5,0-9.6,2.7-12.1,7l-.6,1h40.3c5,0,9.6,2.6,12.1,6.9l15.9,27.3c1.2,2.1,1.9,4.6,1.9,7.1v32.5c0,2.5-.7,4.9-1.9,7.1l-19.9,34.2h-.1Z" />
                <path d="M1673,327.4h.4c5,0,9.6,2.7,12.1,7l14.8,25.5c1.2,2.1,1.9,4.6,1.9,7v60.2c0,2.4-.6,4.8-1.9,7l-6,10.5v-75.7c0-2.4-.7-4.7-1.9-6.8l-19.4-34.7h0Z" />
                <path d="M1694.2,602l8,13.8v43.2c0,2.5-.7,4.9-1.9,7l-26,44.6c-2.5,4.3-7.1,7-12.1,7h-45.8l4.6-8h36.6c5,0,9.6-2.7,12.1-7l22.6-38.8c1.2-2.1,1.9-4.6,1.9-7v-54.8h0Z" />
                <path d="M1581.9,777l.5.9c2.5,4.3,2.5,9.7,0,14l-17.1,29.3c-2.5,4.3-7.1,7-12.1,7h-44.7c-5,0-9.6-2.7-12.1-7l-.6-1h52.8c5,0,9.6-2.6,12.1-6.9l21.2-36.3Z" />
                <path d="M894.3,828.2h-33.9c-5,0-9.6-2.7-12.1-7l-23.3-40.2h9.2l18.7,32.2c2.5,4.3,7.1,7,12.1,7h42l-.6,1c-2.5,4.3-7.1,7-12.1,7h0Z" />
                <path d="M453.2,828.2h33.9c5,0,9.6-2.7,12.1-7l23.3-40.2h-9.2l-18.7,32.2c-2.5,4.3-7.1,7-12.1,7h-42l.6,1c2.5,4.3,7.1,7,12.1,7h0Z" />
                <path d="M180.8,820.3l-.6,1c-2.5,4.3-7.1,6.9-12.1,6.9h-23.8c-5,0-9.6-2.7-12.1-7l-27.6-47.4c-1.2-2.1-1.9-4.6-1.9-7v-31.6c0-2.5.7-4.9,1.9-7.1l6.2-10.5v47c0,2.5.6,4.9,1.8,7.1l24.2,41.6c2.5,4.3,7.1,7,12.1,7h31.9Z" />
                <path d="M78.5,642.9l4.7,8h-41.9c-5,0-9.6-2.7-12.1-7l-21.3-36.5c-1.2-2.1-1.9-4.6-1.9-7v-18c0-2.5.7-4.9,1.9-7l6.1-10.5v33.4c0,2.5.7,4.9,1.9,7l17.9,30.7c2.5,4.3,7.1,7,12.1,7h32.6Z" />
                <path d="M60.5,473.4l4.8-8H23.7c-5,0-9.6,2.7-12.1,7l-3.7,6.3c-1.2,2.1-1.9,4.6-1.9,7v17.3c0,2.5.7,4.9,1.9,7l6.1,10.5v-32.6c0-2.5.7-4.9,1.9-7l.3-.5c2.5-4.3,7.1-7,12.1-7h32.2Z" />
                <path d="M92.9,393l-6.2-10.5c-1.3-2.2-1.9-4.6-1.9-7.1v-25.3c0-2.5.7-4.9,1.9-7l23.3-40.1c2.5-4.3,7.1-7,12.1-7h41.9l-4.7,8h-32.6c-5,0-9.6,2.7-12.1,7l-19.9,34.3c-1.2,2.1-1.9,4.6-1.9,7.1v40.7h0Z" />
                <path d="M271.3,133.6l-.6-1c-2.5-4.3-7.1-7-12.1-7h-37.4c-5,0-9.6,2.7-12.1,7l-23.5,40.4c-1.2,2.1-1.9,4.6-1.9,7v30.1c0,2.5.7,4.9,1.9,7.1l6.2,10.5v-45.5c0-2.5.6-4.9,1.8-7.1l20.1-34.6c2.5-4.3,7.1-7,12.1-7h45.5Z" />
                <path d="M709.7,108.6l-.6-1c-2.5-4.3-7.1-7-12.1-7h-15.4c-5,0-9.6,2.6-12.1,6.9l-6.5,11.1c-2.5,4.3-7.1,6.9-12.1,6.9h-10c-5,0-9.6,2.7-12.1,7l-.6,1h27.3c5,0,9.6-2.6,12.1-6.9l6.5-11.1c2.5-4.3,7.1-6.9,12.1-6.9h41.5-18Z" />
                <path d="M1100.9,134.4l-1.5-2.1c-2.6-3.7-6.9-5.9-11.4-5.9h-11.9c-5,0-9.6-2.7-12.1-7l-6.9-11.9c-2.5-4.3-7.1-7-12.1-7h-18.9c-5,0-9.6,2.7-12.1,7l-.6,1h27c5,0,9.6,2.7,12.1,7l6.9,11.9c2.5,4.3,7.1,7,12.1,7h29.4Z" />
                <path d="M1198.8,134.4l.6-1c2.5-4.3,7.1-7,12.1-7h22.4c5,0,9.6,2.7,12.1,7l14.7,25.3c2.5,4.3,7.1,7,12.1,7h15.6c5,0,9.6,2.7,12.1,7l.6,1h-32.9c-5,0-9.6-2.7-12.1-7l-14.7-25.3c-2.5-4.3-7.1-7-12.1-7h-30.5Z" />
              </g>

              {bgGraphic}

              {/* divider lines */}
              <g className={cn(styles.dividerLines, { [styles.active]: playing })}>
                <line x1="118.6" y1="304" x2="608.2" y2="304" />
                <line x1="19.8" y1="473.4" x2="509.3" y2="473.4" />
                <line x1="37.8" y1="642.9" x2="410.4" y2="642.9" />
                <polyline points="1163.4 375.2 1412.1 375.2 1433.9 337.7 1433.9 301.8" />
                <line x1="1394" y1="531.4" x2="1253.6" y2="531.4" />
                <path d="M201.9,820.3l103-177.4" />
                <path d="M132.5,805.9l94.6-163" />
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
            <div className={styles.headerRight}>
              <div className={cn(styles.copySnackbar, { [styles.active]: linkCopied })}>link copied to clipboard!</div>
              <Image
                className={styles.linkIcon}
                src="/link.png"
                alt="Link Icon"
                width={21}
                height={21}
                onClick={() => {
                  copyPresetUrl()
                  setLinkCopied(true)
                  setTimeout(() => setLinkCopied(false), 2000)
                }}
              />
              <Image src="/manberg.png" alt="Manberg Logo" width={141.84} height={40} style={{ marginTop: -4 }} />
            </div>
          </div>

          <TiltContainer maxTilt={0.5} perspective={900}>
            <div className={cn(styles.infoBody, { [styles.active]: playing })}>
              {/* main LFO controls */}
              <div className={styles.lfoControls}>
                <div className={cn(styles.lfoControlContainer, { [styles.active]: showLfo1Controls })}>
                  <div className={styles.lfoControlHeader}>
                    <p>LFO1</p>
                    <div>
                      <Checkbox
                        checked={syncLfos}
                        onChange={(syncLfos) => {
                          setSyncLfos(syncLfos)
                          updateLocalStorage('syncLfos', syncLfos)
                        }}
                        label="SYNC"
                      />
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
                      index={1}
                    />
                  </div>
                </div>
                <div
                  className={cn(styles.lfoControlContainer, { [styles.active]: showLfo2Controls })}
                  style={{ marginRight: 100 }}>
                  <div className={styles.lfoControlHeader}>
                    <p>LFO2</p>
                    <div>
                      <Checkbox
                        checked={solo2}
                        onChange={(solo2) => {
                          setSolo2(solo2)
                          updateLocalStorage('solo2', solo2)
                        }}
                        label="SOLO"
                      />
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
                      index={2}
                    />
                  </div>
                </div>
                <div
                  className={cn(styles.lfoControlContainer, { [styles.active]: playing })}
                  style={{ marginRight: 197 }}>
                  <div className={styles.lfoControlHeader}>
                    <p>LFO3</p>
                    <div>
                      <Checkbox
                        checked={solo3}
                        onChange={(solo3) => {
                          setSolo3(solo3)
                          updateLocalStorage('solo3', solo3)
                        }}
                        label="SOLO"
                      />
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
                      index={3}
                    />
                  </div>
                </div>
              </div>

              {/* voice controls */}
              <div className={cn(styles.voiceAux, { [styles.active]: playing })}>
                <div className={styles.voiceAuxControl} style={{ marginRight: 270 }}>
                  <p suppressHydrationWarning>{pitch1NoteName}</p>
                </div>
                <div className={styles.voiceAuxControl}>
                  <p suppressHydrationWarning>{pitch2NoteName}</p>
                </div>
                <div className={styles.voiceAuxControl}>
                  <p suppressHydrationWarning>{pitch3NoteName}</p>
                </div>
                <div className={styles.voiceAuxControl}>
                  <p suppressHydrationWarning>{pitch4NoteName}</p>

                  {/* voice global controls */}
                  <div className={styles.voiceGlobalControls}>
                    <div className={styles.voiceGlobalControl}>
                      <LinearKnob
                        min={0}
                        max={11}
                        step={1}
                        value={transpose}
                        onChange={(transpose) => {
                          setTranspose(transpose)
                          updateLocalStorage('transpose', transpose)
                        }}
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
                        onChange={(scale) => {
                          setScale(scale)
                          updateLocalStorage('scale', scale)
                        }}
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
                      setModOff((modOff) => {
                        updateLocalStorage('modOff', !modOff)
                        return !modOff
                      })
                    }}>
                    <line x1="0" y1="0" x2="13" y2="13" stroke={modOff ? secondaryColor : gray} strokeWidth="2" />
                    <line x1="13" y1="0" x2="0" y2="13" stroke={modOff ? secondaryColor : gray} strokeWidth="2" />
                  </svg>
                </div>

                {/* mod matrix */}
                <ModMatrix playing={playing} />
                <p className={styles.modMatrixLabel}>MOD MATRIX</p>
              </div>

              {/* effects */}
              <Effects
                delay={delay}
                filter={filter}
                distortion={distortion}
                reverb={reverb}
                distMod={modVal(10)}
                lpfMod={modVal(11)}
                dlyTimeMod={modVal(12)}
              />
            </div>
          </TiltContainer>
        </div>

        {/* main binary tree graph */}
        <TiltContainer maxTilt={1} perspective={900}>
          <BinaryTree lfo1={lfo1} lfo2={lfo2} lfo3={lfo3} allOn={!playing} solo2={solo2} solo3={solo3} />

          {/* voices */}
          <div className={cn(styles.voices, { [styles.active]: playing })}>
            <div className={styles.voiceContainer} style={{ marginRight: 268 }}>
              <VoiceTypeSelector voiceType={voiceAType} setVoiceType={setVoiceAType} voiceRef={voiceARef} index={1} />
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
              <VoiceTypeSelector voiceType={voiceBType} setVoiceType={setVoiceBType} voiceRef={voiceBRef} index={2} />
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
              <VoiceTypeSelector voiceType={voiceCType} setVoiceType={setVoiceCType} voiceRef={voiceCRef} index={3} />
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
              <VoiceTypeSelector
                voiceType={voiceDType}
                setVoiceType={setVoiceDType}
                voiceRef={voiceDRef}
                fatInit={60}
                index={4}
              />
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
      pitch1NoteName,
      pitch2NoteName,
      pitch3NoteName,
      pitch4NoteName,
      voiceAType,
      voiceBType,
      voiceCType,
      voiceDType,
      screenSizeRatio,
      mounted,
      linkCopied,
    ]
  )

  return mounted ? content : null
}

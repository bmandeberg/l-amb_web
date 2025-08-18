import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import LinearKnob from '@/components/LinearKnob'
import { lerpHex } from '@/util/math'
import { primaryColor, gray } from '@/app/globals'
import styles from './index.module.css'

// MIDI note 24 - 84 (C1 - C6, 32.7Hz - 8372Hz)
export const minPitch = 24
export const maxPitch = 84

export const scales = {
  chromatic: [1],
  ionian: [2, 2, 1, 2, 2, 2, 1],
  dorian: [2, 1, 2, 2, 2, 1, 2],
  phrygian: [1, 2, 2, 2, 1, 2, 2],
  lydian: [2, 2, 2, 1, 2, 2, 1],
  mixolydian: [2, 2, 1, 2, 2, 1, 2],
  aeolian: [2, 1, 2, 2, 1, 2, 2],
  locrian: [1, 2, 2, 1, 2, 2, 2],
  pentatonic: [2, 2, 3, 2, 3],
  diminished: [2, 1, 2, 1, 2, 1, 2, 1],
  insen: [1, 2, 2, 1, 2, 2],
  whole: [2],
}
export type ScaleName = keyof typeof scales

interface VoiceProps {
  pitch: number
  setPitch: (value: number) => void
  scale: ScaleName
  modVal: number
  level: number
  index: number
}

export default function Voice({ pitch, setPitch, scale, modVal, level, index }: VoiceProps) {
  const [localPitch, setLocalPitch] = useState(pitch)
  const pitchRef = useRef(pitch)

  useEffect(() => {
    pitchRef.current = pitch
  }, [pitch])

  const availablePitches = useMemo<number[]>(() => {
    let currentPitch = minPitch
    const scaleIntervals = scales[scale as ScaleName] || scales.chromatic
    const pitches = [currentPitch]
    let scaleIndex = 0

    while (currentPitch < maxPitch) {
      const nextInterval = scaleIntervals[scaleIndex % scaleIntervals.length]
      currentPitch += nextInterval
      if (currentPitch <= maxPitch) {
        pitches.push(currentPitch)
      }
      scaleIndex++
    }

    return pitches
  }, [scale])

  const updatePitch = useCallback(
    (value: number) => {
      setPitch(availablePitches[value - 1] || minPitch)
    },
    [availablePitches, setPitch]
  )

  // update pitch to be diatonic when scale or transpose changes
  useEffect(() => {
    // find closest pitch in availablePitches
    let closestIndex = 0
    for (let i = 0; i < availablePitches.length; i++) {
      if (
        Math.abs(availablePitches[i] - pitchRef.current) < Math.abs(availablePitches[closestIndex] - pitchRef.current)
      ) {
        closestIndex = i
      }
    }

    setLocalPitch(closestIndex + 1)
    updatePitch(closestIndex + 1)
  }, [availablePitches, updatePitch])

  const content = useMemo(
    () => (
      <div className={styles.voice}>
        <LinearKnob
          min={1}
          max={availablePitches.length}
          step={1}
          value={localPitch}
          onChange={setLocalPitch}
          setModdedValue={updatePitch}
          strokeColor={lerpHex(gray, primaryColor, level)}
          glow
          glowAmount={level}
          modVal={modVal}
          glowIndex={index}
          disableReset
          coloredIndicator
        />
      </div>
    ),
    [availablePitches, localPitch, updatePitch, modVal, level, index]
  )

  return content
}

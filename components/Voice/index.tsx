import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import LinearKnob from '@/components/LinearKnob'
import { primaryColor } from '@/app/globals'
import styles from './index.module.css'

// MIDI note 12 - 84 (C0 - C6, 16.35Hz - 8372Hz)
export const minPitch = 12
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
}

export default function Voice({ pitch, setPitch, scale }: VoiceProps) {
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
      setLocalPitch(value)
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
          onChange={updatePitch}
          strokeColor={primaryColor}
          glow
        />
      </div>
    ),
    [availablePitches, localPitch, updatePitch]
  )

  return content
}

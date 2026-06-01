'use client'

import { createContext, useContext, useEffect, useRef } from 'react'

// `epoch` increments each time a preset is loaded. Components subscribe via
// useRehydrate to re-read their values from the (already-updated) live patch and
// push them through their existing audio-apply paths — so loading a preset never
// tears down the Tone.js graph and playback continues uninterrupted.
export const PresetContext = createContext<{ epoch: number }>({ epoch: 0 })

export function useRehydrate(fn: () => void) {
  const { epoch } = useContext(PresetContext)
  const fnRef = useRef(fn)
  fnRef.current = fn
  const prevEpoch = useRef(epoch)

  useEffect(() => {
    if (epoch === prevEpoch.current) return
    prevEpoch.current = epoch
    fnRef.current()
  }, [epoch])
}

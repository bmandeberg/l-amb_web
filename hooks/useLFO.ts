'use client'

import { useEffect, useState, useRef } from 'react'
import { createLFO, LFOParameters } from '@/tone/createLFO'

export default function useLFO(
  initialized: boolean,
  lfoParams: LFOParameters,
  latch?: boolean,
  // optional per-tick callback (~60fps) for consumers that need every sample
  // imperatively without re-rendering — e.g. the sequencer's clock edge detection
  onTick?: (value: number, phase: number) => void
) {
  // The worklet posts a `value` ~60fps. We keep it in a ref (not state) so each
  // tick doesn't re-render; a single rAF loop in page.tsx samples every LFO's
  // ref once per frame and triggers one coalesced render (see lfoValues there).
  const valueRef = useRef(0)
  const onTickRef = useRef(onTick)
  onTickRef.current = onTick
  const setFrequency = useRef<null | ((hz: number) => void)>(null)
  const setDuty = useRef<null | ((d: number) => void)>(null)
  const setShape = useRef<null | ((s: 0 | 1) => void)>(null)
  const setPhase = useRef<null | ((phase: number) => void)>(null)
  const phase = useRef<null | number>(null)
  const setLatch = useRef<null | ((latchValue: 0 | 1) => void)>(null)
  const [node, setNode] = useState<null | AudioWorkletNode>(null)

  useEffect(() => {
    if (!initialized) return
    let isMounted = true
    let lfoObj: Awaited<ReturnType<typeof createLFO>>
    ;(async () => {
      lfoObj = await createLFO(lfoParams)
      // Forward worklet messages into React state
      lfoObj.node.port.onmessage = (e) => {
        if (isMounted && e.data.type === 'tick') {
          phase.current = e.data.phase
          valueRef.current = e.data.value
          onTickRef.current?.(e.data.value, e.data.phase)
        }
      }
      setFrequency.current = lfoObj.setFrequency
      setDuty.current = lfoObj.setDuty
      setShape.current = lfoObj.setShape
      setPhase.current = lfoObj.setPhase
      setLatch.current = lfoObj.setLatch
      setNode(lfoObj.node)
    })()

    return () => {
      isMounted = false
      if (lfoObj) lfoObj.node.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized])

  useEffect(() => {
    if (!initialized) return
    setLatch.current?.(latch ? 1 : 0)
  }, [initialized, latch])

  return { valueRef, setFrequency, setDuty, setShape, phase, setPhase, node }
}

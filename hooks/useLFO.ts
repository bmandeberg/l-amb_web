'use client'

import { useEffect, useState } from 'react'
import { createLFO, LFOParameters } from '@/tone/lfoNode'

export default function useLFO(initialized: boolean, lfoParams: LFOParameters) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!initialized) return
    let isMounted = true
    let lfoObj: Awaited<ReturnType<typeof createLFO>>
    ;(async () => {
      lfoObj = await createLFO(lfoParams)
      // Forward worklet messages into React state
      lfoObj.node.port.onmessage = (e) => {
        if (isMounted) setValue(e.data as number)
      }
    })()

    return () => {
      isMounted = false
      if (lfoObj) lfoObj.node.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized])

  return value // 0…1 – updates ≈60 Hz
}

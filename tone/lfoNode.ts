import getNativeContext from '@/util/getNativeContext'
import { ensureLFOWorkletLoaded } from '@/util/workletLoader'

export interface LFOParameters {
  frequency: number
  dutyCycle: number
  shape: 0 | 1 // 0=square, 1=triangle
}

export async function createLFO({
  frequency = 1,
  dutyCycle = 0.5,
  shape = 0, // 0=square, 1=triangle
}: LFOParameters) {
  // Make sure the worklet module is loaded once
  const ctx = getNativeContext()
  await ensureLFOWorkletLoaded(ctx)

  const node = new AudioWorkletNode(ctx, 'custom-lfo', {
    numberOfOutputs: 1,
    outputChannelCount: [1],
    parameterData: { frequency, dutyCycle, shape },
  })

  return {
    node,
    setFrequency: (hz: number) => (node.parameters.get('frequency')!.value = hz),
    setDuty: (d: number) => (node.parameters.get('dutyCycle')!.value = d),
    setShape: (s: 0 | 1) => (node.parameters.get('shape')!.value = s),
  }
}

let workletReady: Promise<void> | null = null

export function ensureLFOWorkletLoaded(ctx: BaseAudioContext) {
  if (!workletReady) {
    workletReady = ctx.audioWorklet.addModule('/worklets/lfo-processor.js')
  }
  return workletReady
}

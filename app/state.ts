import { create } from 'zustand'
import { initState, updateLocalStorage } from '@/util/presets'

const NUM_MOD_SOURCES = 5
const NUM_MOD_DESTINATIONS = 13

export interface LambStore {
  lfo1Freq: number
  setLfo1Freq: (freq: number) => void
  modMatrix: number[][] // [destination][source]
  setModMatrix: (modMatrix: number[][]) => void
}

const useLambStore = create<LambStore>((set) => ({
  lfo1Freq: 1,
  setLfo1Freq: (freq: number) => set({ lfo1Freq: freq }),
  modMatrix: defaultModMatrix(),
  setModMatrix: (modMatrix: number[][]) => {
    set({ modMatrix })
    updateLocalStorage('modMatrix', modMatrix)
  },
}))

export default useLambStore

function defaultModMatrix(): number[][] {
  const modMatrix = Array.from({ length: NUM_MOD_DESTINATIONS }, () => Array(NUM_MOD_SOURCES).fill(0))
  // init patch mod matrix
  modMatrix[9][4] = 0.35
  modMatrix[11][4] = 0.39

  return initState('modMatrix', modMatrix) as number[][]
}

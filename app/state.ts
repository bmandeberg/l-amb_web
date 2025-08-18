import { create } from 'zustand'

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
  modMatrix: Array.from({ length: NUM_MOD_DESTINATIONS }, () => Array(NUM_MOD_SOURCES).fill(0)),
  setModMatrix: (modMatrix: number[][]) => set({ modMatrix }),
}))

export default useLambStore

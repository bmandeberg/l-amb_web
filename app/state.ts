import { create } from 'zustand'

export interface LambStore {
  lfo1Freq: number
  setLfo1Freq: (freq: number) => void
  modMatrix: number[][]
  setModMatrix: (modMatrix: number[][]) => void
}

const useLambStore = create<LambStore>((set) => ({
  lfo1Freq: 1,
  setLfo1Freq: (freq: number) => set({ lfo1Freq: freq }),
  modMatrix: Array.from({ length: 10 }, () => Array(5).fill(0)),
  setModMatrix: (modMatrix: number[][]) => set({ modMatrix }),
}))

export default useLambStore

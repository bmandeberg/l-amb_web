import { create } from 'zustand'

export interface LambStore {
  lfo1Freq: number
  setLfo1Freq: (freq: number) => void
}

const useLambStore = create<LambStore>((set) => ({
  lfo1Freq: 1,
  setLfo1Freq: (freq: number) => set({ lfo1Freq: freq }),
}))

export default useLambStore

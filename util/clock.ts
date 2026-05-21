export const maxDivMult = 9
export const numClockOptions = (maxDivMult - 1) * 2 + 1
export const clockDivMultOptions = initClockDivMultOptions()

function initClockDivMultOptions() {
  // freq knob sweeps from divide-by-maxDivMult down to 1, then up to multiply-by-maxDivMult
  // e.g. [9, 8, …, 2, 1, 2, …, 8, 9]
  const descending = []
  for (let i = maxDivMult; i >= 1; i--) descending.push(i)
  const ascending = []
  for (let i = 2; i <= maxDivMult; i++) ascending.push(i)
  return [...descending, ...ascending]
}

// Apply a clock division/multiplication option (by index) to a base frequency.
// Indices below the midpoint divide; indices above multiply.
export function divMultFreq(baseFreq: number, index: number): number {
  const factor = clockDivMultOptions[index]
  return index < numClockOptions / 2 ? baseFreq / factor : baseFreq * factor
}

export function expoMap(t: number, k: number = 4) {
  // keep input in bounds
  const x = Math.min(Math.max(t, 0), 1)

  // k = 0 falls back to identity
  if (k === 0) return x

  const a = Math.exp(k) - 1 // normalising constant
  return (Math.exp(k * x) - 1) / a // (e^{kx} - 1) / (e^{k} - 1)
}

export function constrain(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max)
}

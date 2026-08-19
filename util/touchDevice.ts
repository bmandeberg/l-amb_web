// true on touch-primary devices (no hover / coarse pointer), where
// mouse-position-driven effects like the panel tilt are dead weight
export default function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(hover: none), (pointer: coarse)').matches
}

// SVG feGaussianBlur glows re-rasterize on every value change — too slow for mobile GPUs
export const svgGlowEnabled = !isTouchDevice()
